import { Server } from "socket.io"
import { NextApiRequest } from "next"
import { NextApiResponseServerIO } from "../../types/next"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

const SocketHandler = async (req: NextApiRequest, res: NextApiResponseServerIO) => {
  if (res.socket.server.io) {
    console.log("Socket already running")
  } else {
    console.log("Initializing socket")
    const io = new Server(res.socket.server, {
      path: "/api/socket",
      addTrailingSlash: false,
      transports: ['polling'],
      cors: {
        origin: "*",
        methods: ["GET", "POST"],
        allowedHeaders: ["Content-Type", "Authorization"],
        credentials: true
      },
      pingTimeout: 60000,
      pingInterval: 25000,
    })
    res.socket.server.io = io

    io.on("connection", (socket) => {
      console.log(`Client connected: ${socket.id}`)
      let currentRoom = ""

      socket.on("join-room", async ({ roomId, username }) => {
        try {
          currentRoom = roomId
          console.log(`${username} joining room ${roomId}`)

          // Create room if it doesn't exist
          const room = await prisma.room.upsert({
            where: { id: roomId },
            update: {},
            create: { 
              id: roomId, 
              name: roomId 
            }
          })

          // First try to find the user
          const existingUser = await prisma.user.findUnique({
            where: { username }
          })

          if (existingUser) {
            // Update existing user
            await prisma.user.update({
              where: { username },
              data: { 
                status: "online",
                socketId: socket.id,
                rooms: {
                  connect: { id: room.id }
                }
              }
            })
          } else {
            // Create new user
            await prisma.user.create({
              data: { 
                username, 
                status: "online",
                socketId: socket.id,
                rooms: {
                  connect: { id: room.id }
                }
              }
            })
          }

          // Join the socket room
          socket.join(roomId)
          console.log(`${username} joined room ${roomId}`)

          // Get ALL active users in this room
          const roomUsers = await prisma.user.findMany({
            where: {
              rooms: {
                some: {
                  id: roomId
                }
              },
              AND: [
                {
                  status: "online"
                },
                {
                  socketId: {
                    not: null
                  }
                }
              ]
            },
            select: {
              username: true,
              status: true
            }
          })

          console.log('Current room users:', roomUsers)

          // Broadcast to EVERYONE in the room (including sender)
          io.in(roomId).emit("room-users", roomUsers)
          
          // Notify others about the new user
          socket.to(roomId).emit("user-joined", {
            username,
            status: "online",
            message: `${username} has joined the room`
          })

        } catch (error) {
          console.error("Error in join-room:", error)
        }
      })

      socket.on("send-message", async (message) => {
        try {
          const user = await prisma.user.upsert({
            where: { username: message.sender },
            update: { status: "online" },
            create: { username: message.sender, status: "online" }
          })

          const room = await prisma.room.upsert({
            where: { id: message.roomId },
            update: {},
            create: { id: message.roomId, name: message.roomId }
          })

          const savedMessage = await prisma.message.create({
            data: {
              text: message.text,
              senderId: user.id,
              roomId: room.id,
              reactions: {}
            },
            include: {
              sender: true
            }
          })

          // Convert to a plain object and add timestamp
          const messageToSend = {
            ...savedMessage,
            timestamp: new Date().toISOString(), // Convert to ISO string
            reactions: {}
          }

          io.to(message.roomId).emit("new-message", messageToSend)
        } catch (error) {
          console.error("Error in send-message:", error)
        }
      })

      socket.on("status-change", async ({ username, status }) => {
        try {
          await prisma.user.update({
            where: { username },
            data: { status }
          })

          // Get updated room users after status change
          const roomUsers = await prisma.user.findMany({
            where: {
              rooms: {
                some: {
                  id: currentRoom
                }
              },
              AND: [
                {
                  status: {
                    not: "offline"
                  }
                },
                {
                  socketId: {
                    not: null
                  }
                }
              ]
            },
            select: {
              username: true,
              status: true
            }
          })

          // Broadcast updated users list to everyone
          io.in(currentRoom).emit("room-users", roomUsers)
          io.in(currentRoom).emit("user-status-changed", {
            username,
            status,
            message: `${username} is now ${status}`
          })
        } catch (error) {
          console.error("Error in status-change:", error)
        }
      })

      socket.on("add-reaction", async ({ messageId, emoji, username }) => {
        try {
          const message = await prisma.message.findUnique({
            where: { id: messageId }
          })

          if (!message) return

          // Initialize reactions as empty object if null/undefined
          const reactions = message.reactions 
            ? { ...message.reactions as Record<string, string[]> }
            : {} as Record<string, string[]>;

          if (!reactions[emoji]) {
            reactions[emoji] = [];
          }
          reactions[emoji].push(username);

          await prisma.message.update({
            where: { id: messageId },
            data: { reactions }
          })

          io.emit("reaction-added", { messageId, reactions })
        } catch (error) {
          console.error("Error in add-reaction:", error)
        }
      })

      socket.on("disconnect", async () => {
        try {
          const user = await prisma.user.findFirst({
            where: { socketId: socket.id }
          })

          if (user) {
            await prisma.user.update({
              where: { id: user.id },
              data: { 
                status: "offline",
                socketId: null
              }
            })

            const roomUsers = await prisma.user.findMany({
              where: {
                rooms: {
                  some: {
                    id: currentRoom
                  }
                },
                AND: [
                  {
                    status: "online"
                  },
                  {
                    socketId: {
                      not: null
                    }
                  }
                ]
              },
              select: {
                username: true,
                status: true
              }
            })

            io.in(currentRoom).emit("room-users", roomUsers)
            io.in(currentRoom).emit("user-status-changed", {
              username: user.username,
              status: "offline",
              message: `${user.username} has disconnected`
            })
          }
        } catch (error) {
          console.error("Error in disconnect:", error)
        }
      })
    })
  }
  res.end()
}

export default SocketHandler

// Disable body parsing
export const config = {
  api: {
    bodyParser: false,
  },
} 