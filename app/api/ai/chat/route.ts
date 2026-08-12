import { NextResponse } from 'next/server'
import { chatSymptoms } from '@/lib/ai/symptom-checker'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { conversation, patientContext } = body

    if (!conversation || !Array.isArray(conversation) || conversation.length === 0) {
      return NextResponse.json(
        { error: 'Conversation history array is required.' },
        { status: 400 }
      )
    }

    const response = await chatSymptoms(conversation, patientContext)
    return NextResponse.json(response)
  } catch (error: any) {
    console.error('[API Route /api/ai/chat] Error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to process AI health assistant chat request.' },
      { status: 500 }
    )
  }
}
