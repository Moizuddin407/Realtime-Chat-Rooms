import { createEventStream } from '@/app/utils/broadcast'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
export const preferredRegion = 'auto'

const connectedClients = new Set<ReadableStreamDefaultController>()

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const roomId = searchParams.get('roomId')

  if (!roomId) {
    return new Response('Room ID is required', { status: 400 })
  }

  return createEventStream(roomId)
}

export function broadcast(message: any) {
  connectedClients.forEach(client => {
    client.enqueue(`data: ${JSON.stringify(message)}\n\n`)
  })
} 