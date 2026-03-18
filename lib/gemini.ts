import Groq from 'groq-sdk'
import { withRetry } from './retry'
import { withTimeout } from './timeout'

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY!
})

export async function generateContent(prompt: string): Promise<string> {
  return withRetry(
    async () => {
      const response = await withTimeout(
        groq.chat.completions.create({
          model: 'llama-3.3-70b-versatile',
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.3,
          max_tokens: 500
        }),
        15000,
        'Groq API call'
      )
      return response.choices[0]?.message?.content || ''
    },
    3,
    1000,
    'generateContent'
  )
}