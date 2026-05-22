import { POST } from '@/app/api/parse-cv/route'
import * as supabaseServer from '@/lib/supabase/server'
import * as groqLib from '@/lib/groq'
import { extractText } from 'unpdf'
import fs from 'fs'
import path from 'path'

jest.mock('@/lib/supabase/server')
jest.mock('unpdf')
jest.mock('@/lib/groq')
jest.mock('@/lib/auth-mock', () => ({
  isDev: true,
  mockUser: { id: 'dev-user' }
}))
jest.mock('@/lib/timeout', () => ({
    withTimeout: jest.fn((p) => p)
}))

describe('POST /api/parse-cv', () => {
  let mockSupabase: any /* eslint-disable-line @typescript-eslint/no-explicit-any */

  beforeEach(() => {
    jest.clearAllMocks()
    mockSupabase = {
      auth: {
        getUser: jest.fn().mockResolvedValue({ data: { user: { id: 'dev-user' } }, error: null })
      },
      from: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      eq: jest.fn().mockImplementation(() => Promise.resolve({ data: [], error: null }))
    }
    ;(supabaseServer.createClient as jest.Mock).mockResolvedValue(mockSupabase)
  })

  test('parses PDF and returns profile', async () => {
    const pdfPath = path.join(process.cwd(), 'tests/fixtures/dummy.pdf')
    const pdfBuffer = fs.readFileSync(pdfPath)
    const formData = new FormData()
    formData.append('cv', new Blob([pdfBuffer], { type: 'application/pdf' }), 'cv.pdf')

    ;(extractText as jest.Mock).mockResolvedValue({ text: 'CV Content' })
    ;(groqLib.generateContent as jest.Mock).mockResolvedValue(JSON.stringify({
        full_name: 'John Doe',
        skills: ['React']
    }))

    const req = new Request('http://localhost/api/parse-cv', {
      method: 'POST',
      body: formData
    })

    const res = await POST(req)
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.success).toBe(true)
    expect(data.profile.full_name).toBe('John Doe')
  })

  test('returns 400 if no file', async () => {
    const req = new Request('http://localhost/api/parse-cv', {
      method: 'POST',
      body: new FormData()
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })
})
