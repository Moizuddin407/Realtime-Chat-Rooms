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
export const clients = new Map<ReadableStreamDefaultController, boolean>()

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