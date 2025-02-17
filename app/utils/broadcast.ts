import { NextResponse } from 'next/server'

interface BroadcastMessage {
  type: string
  message?: {
    id: string
    text: string
    sender: {
      username: string
    }
    createdAt: string
    reactions: Record<string, string[]>
  }
}

// Use a global variable to store clients
const globalClients = new Map<string, Set<ReadableStreamDefaultController>>()
let retryAttempts = new Map<string, number>()
const MAX_RETRIES = 5

// Function to broadcast message to all active clients
export function broadcast(data: { roomId: string; [key: string]: any }) {
  const roomId = data.roomId
  const roomClients = globalClients.get(roomId)
  
  if (!roomClients || roomClients.size === 0) {
    console.log(`No clients in room ${roomId}, retrying broadcast`)
    // Retry broadcast after a short delay
    setTimeout(() => {
      const updatedClients = globalClients.get(roomId)
      if (updatedClients && updatedClients.size > 0) {
        console.log(`Retrying broadcast to ${updatedClients.size} clients`)
        const message = `data: ${JSON.stringify(data)}\n\n`
        for (const client of updatedClients) {
          try {
            client.enqueue(message)
            console.log(`Message sent to client in room ${roomId}`)
          } catch (e) {
            console.error(`Error broadcasting to client:`, e)
            updatedClients.delete(client)
          }
        }
      }
    }, 100)
    return
  }

  console.log(`Broadcasting to ${roomClients.size} clients in room ${roomId}`)
  const message = `data: ${JSON.stringify(data)}\n\n`
  
  for (const client of roomClients) {
    try {
      client.enqueue(message)
      console.log(`Message sent to client in room ${roomId}`)
    } catch (e) {
      console.error(`Error broadcasting to client:`, e)
      roomClients.delete(client)
    }
  }
}

export function createEventStream(roomId: string) {
  if (!globalClients.has(roomId)) {
    globalClients.set(roomId, new Set())
  }

  return new Response(new ReadableStream({
    start(controller: ReadableStreamDefaultController) {
      const roomClients = globalClients.get(roomId)
      if (roomClients) {
        roomClients.add(controller)
        console.log(`Client connected to room ${roomId}. Active clients: ${roomClients.size}`)
        
        // Send initial connection message
        controller.enqueue(`data: ${JSON.stringify({ type: 'connected', roomId })}\n\n`)
      }
    },
    cancel(controller: ReadableStreamDefaultController) {
      const roomClients = globalClients.get(roomId)
      if (roomClients) {
        roomClients.delete(controller)
        console.log(`Client disconnected from room ${roomId}. Remaining clients: ${roomClients.size}`)
      }
    }
  }), {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no'
    },
  })
}

// Export for debugging
export function getActiveClients(roomId: string): number {
  return globalClients.get(roomId)?.size || 0
} 