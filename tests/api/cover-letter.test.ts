import { POST } from '@/app/api/cover-letter/route'
import * as supabaseServer from '@/lib/supabase/server'
import * as groq from '@/lib/groq'
import * as profileLib from '@/lib/profile'

jest.mock('@/lib/supabase/server')
jest.mock('@/lib/groq')
jest.mock('@/lib/profile')
jest.mock('@/lib/auth-mock', () => ({
  isDev: true,
  mockUser: { id: 'dev-user' }
}))

describe('POST /api/cover-letter', () => {
  let mockSupabase: any

  beforeEach(() => {
    jest.clearAllMocks()

    mockSupabase = {
      auth: {
        getUser: jest.fn().mockResolvedValue({ data: { user: { id: 'dev-user' } }, error: null })
      },
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      single: jest.fn(),
      insert: jest.fn().mockReturnThis()
    }

    ;(supabaseServer.createClient as jest.Mock).mockResolvedValue(mockSupabase)
  })

  test('returns 400 if jobId is missing', async () => {
    const req = new Request('http://localhost/api/cover-letter', {
      method: 'POST',
      body: JSON.stringify({})
    })
    const res = await POST(req)
    const data = await res.json()
    expect(res.status).toBe(400)
    expect(data.error).toBe('jobId is required')
  })

  test('returns 404 if job not found', async () => {
    mockSupabase.single.mockResolvedValueOnce({ data: null, error: new Error('Not found') })

    const req = new Request('http://localhost/api/cover-letter', {
      method: 'POST',
      body: JSON.stringify({ jobId: 'job-123' })
    })
    const res = await POST(req)
    expect(res.status).toBe(404)
  })

  test('generates and saves cover letter', async () => {
    mockSupabase.single
      .mockResolvedValueOnce({ data: { id: 'job-123', title: 'Dev', company: 'Co' }, error: null }) // job
      .mockResolvedValueOnce({ data: { tone: 'professional' }, error: null }) // preferences
      .mockResolvedValueOnce({ data: null, error: null }) // existing
      .mockResolvedValueOnce({ data: { id: 'cl-123', version: 1 }, error: null }) // saved

    mockSupabase.limit.mockResolvedValueOnce({ data: [] }) // patterns

    ;(profileLib.getUserProfile as jest.Mock).mockResolvedValue({ profileText: 'My profile' })
    ;(groq.generateContent as jest.Mock).mockResolvedValue('Generated Letter')

    const req = new Request('http://localhost/api/cover-letter', {
      method: 'POST',
      body: JSON.stringify({ jobId: 'job-123' })
    })
    const res = await POST(req)
    const data = await res.json()

    expect(res.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.coverLetter.content).toBe('Generated Letter')
  })
})
