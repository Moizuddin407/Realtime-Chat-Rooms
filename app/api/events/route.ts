import { createEventStream } from '@/app/utils/broadcast'

export async function GET() {
  return createEventStream()
} 