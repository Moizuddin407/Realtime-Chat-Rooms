import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { broadcast } from '@/app/utils/broadcast'

const prisma = new PrismaClient()

export async function POST(req: Request) {
  try {
    const body = await req.json()
    console.log('Received message request:', body)
    
    if (!body.text || !body.sender || !body.roomId) {
      console.error('Missing required fields:', body)
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const { text, sender, roomId } = body
    
    const message = await prisma.message.create({
      data: {
        text,
        sender: {
          connectOrCreate: {
            where: { username: sender },
            create: { 
              username: sender, 
              status: 'online',
              socketId: null
            }
          }
        },
        room: {
          connectOrCreate: {
            where: { id: roomId },
            create: { 
              id: roomId, 
              name: roomId 
            }
          }
        }
      },
      include: {
        sender: true
      }
    })
    
    console.log('Message created successfully:', message)

    // Broadcast the new message to all clients
    broadcast({
      type: 'message',
      message: {
        id: message.id,
        text: message.text,
        sender: {
          username: message.sender.username
        },
        createdAt: message.createdAt.toISOString(),
        reactions: message.reactions
      }
    })
    
    return NextResponse.json(message)
  } catch (error) {
    console.error('Failed to send message:', error)
    return NextResponse.json(
      { error: 'Failed to send message', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const roomId = searchParams.get('roomId')
    
    if (!roomId) {
      return NextResponse.json(
        { error: 'Room ID is required' },
        { status: 400 }
      )
    }

    console.log('Fetching messages for room:', roomId)
    
    const messages = await prisma.message.findMany({
      where: {
        room: { id: roomId }
      },
      include: {
        sender: true
      },
      orderBy: {
        createdAt: 'asc'
      }
    })
    
    console.log(`Found ${messages.length} messages`)
    return NextResponse.json(messages)
  } catch (error) {
    console.error('Failed to fetch messages:', error)
    return NextResponse.json(
      { error: 'Failed to fetch messages', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
} 