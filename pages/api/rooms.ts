import { NextApiRequest, NextApiResponse } from "next"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "POST") {
    // Create a new room
    const { name } = req.body
    const room = await prisma.room.create({
      data: { name }
    })
    return res.status(201).json(room)
  }

  if (req.method === "GET") {
    // Get all rooms or a specific room
    const { id } = req.query
    if (id) {
      const room = await prisma.room.findUnique({
        where: { id: String(id) },
        include: {
          messages: {
            include: {
              sender: true
            }
          },
          users: true
        }
      })
      return res.status(200).json(room)
    }

    const rooms = await prisma.room.findMany()
    return res.status(200).json(rooms)
  }

  return res.status(405).end()
} 