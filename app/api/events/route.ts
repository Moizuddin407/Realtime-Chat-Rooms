import { NextResponse } from 'next/server'

// Store connected clients with their active status
const clients = new Map<ReadableStreamDefaultController, boolean>()

// Function to broadcast message to all active clients
export function broadcast(message: any) {
  const encoder = new TextEncoder()
  for (const [controller, isActive] of clients.entries()) {
    if (isActive) {
      try {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(message)}\n\n`))
      } catch (error) {
        // If we can't send, mark client as inactive
        clients.set(controller, false)
      }
    }
  }
}

export async function GET(req: Request) {
  const stream = new ReadableStream({
    start(controller) {
      clients.set(controller, true)
      const encoder = new TextEncoder()
      
      // Send initial connection message
      try {
        controller.enqueue(encoder.encode('data: {"type":"connected"}\n\n'))
      } catch (error) {
        console.error('Error sending initial message:', error)
      }
      
      // Keep connection alive with less frequent pings
      const pingInterval = setInterval(() => {
        if (clients.get(controller)) {
          try {
            controller.enqueue(encoder.encode('data: {"type":"ping"}\n\n'))
          } catch (error) {
            // If ping fails, mark client as inactive and cleanup
            clients.set(controller, false)
            clearInterval(pingInterval)
          }
        } else {
          clearInterval(pingInterval)
        }
      }, 30000)
      
      // Cleanup on close
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