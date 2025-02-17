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

// Store connected clients with their active status
const clients = new Map<ReadableStreamDefaultController, boolean>()

// Function to broadcast message to all active clients
export function broadcast(message: BroadcastMessage) {
  const encoder = new TextEncoder()
  for (const [controller, isActive] of clients.entries()) {
    if (isActive) {
      try {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(message)}\n\n`))
      } catch {
        // If we can't send, mark client as inactive
        clients.set(controller, false)
      }
    }
  }
}

export async function GET() {
  const stream = new ReadableStream({
    start(controller) {
      clients.set(controller, true)
      const encoder = new TextEncoder()
      
      try {
        controller.enqueue(encoder.encode('data: {"type":"connected"}\n\n'))
      } catch {
        console.error('Failed to send initial message')
      }
      
      const pingInterval = setInterval(() => {
        if (clients.get(controller)) {
          try {
            controller.enqueue(encoder.encode('data: {"type":"ping"}\n\n'))
          } catch {
            clients.set(controller, false)
            clearInterval(pingInterval)
          }
        } else {
          clearInterval(pingInterval)
        }
      }, 30000)
      
      return () => {
        clearInterval(pingInterval)
        clients.delete(controller)
      }
    }
  })

  return new NextResponse(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive'
    }
  })
} 