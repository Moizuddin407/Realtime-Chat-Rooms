import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { broadcast, getActiveClients } from '@/app/utils/broadcast'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
export const preferredRegion = 'auto'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    
    if (!body.text || !body.sender || !body.roomId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const message = await db.message.create({
      data: {
        text: body.text,
        sender: {
          connectOrCreate: {
            where: { username: body.sender },
            create: { username: body.sender }
          }
        },
        room: {
          connectOrCreate: {
            where: { id: body.roomId },
            create: { 
              id: body.roomId,
              name: `Room ${body.roomId}`
            }
          }
        }
      },
      include: {
        sender: true
      }
    })

    console.log(`Active clients before broadcast: ${getActiveClients(body.roomId)}`)

    broadcast({
      type: 'message',
      roomId: body.roomId,
      message: {
        ...message,
        createdAt: message.createdAt.toISOString()
      }
    })

    return NextResponse.json(message)
  } catch (error) {
    console.error('Error in POST /api/messages:', error)
    return NextResponse.json({ error: 'Failed to send message' }, { status: 500 })
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
    
    const messages = await db.message.findMany({
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
    console.error('Error in GET /api/messages:', error)
    return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 })
  }
} 