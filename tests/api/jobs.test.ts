import { GET } from '@/app/api/jobs/route'
import * as supabaseServer from '@/lib/supabase/server'
import * as profileLib from '@/lib/profile'
import * as groqLib from '@/lib/groq'

jest.mock('@/lib/supabase/server')
jest.mock('@/lib/profile')
jest.mock('@/lib/groq')
jest.mock('@/lib/auth-mock', () => ({
  isDev: true,
  mockUser: { id: 'dev-user' }
}))
jest.mock('@/lib/timeout', () => ({
    withTimeout: jest.fn((p) => p)
}))
jest.mock('@/lib/cache', () => ({
    scoreCache: { get: jest.fn().mockResolvedValue(null) }
}))

describe('GET /api/jobs', () => {
  let mockSupabase: any /* eslint-disable-line @typescript-eslint/no-explicit-any */

  beforeEach(() => {
    jest.clearAllMocks()

    mockSupabase = {
      auth: {
        getUser: jest.fn().mockResolvedValue({ data: { user: { id: 'dev-user' } }, error: null })
      },
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      in: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      single: jest.fn().mockImplementation(function(this: any /* eslint-disable-line @typescript-eslint/no-explicit-any */) {
        return Promise.resolve({ data: this._data, error: this._error })
      })
    }
    ;(supabaseServer.createClient as jest.Mock).mockResolvedValue(mockSupabase)

    global.fetch = jest.fn() as jest.Mock
  })

  test('returns 429 if scanned too recently', async () => {
    const thirtyMinsAgo = new Date(Date.now() - 10 * 60000).toISOString()
    ;(profileLib.getUserProfile as jest.Mock).mockResolvedValue({
      profileData: { last_scan_at: thirtyMinsAgo }
    })

    const res = await GET()
    expect(res.status).toBe(429)
    const data = await res.json()
    expect(data.error).toContain('Please wait')
  })

  test('scans and saves new jobs', async () => {
    const longAgo = new Date(Date.now() - 60 * 60000).toISOString()
    ;(profileLib.getUserProfile as jest.Mock).mockResolvedValue({
      profileText: 'Profile',
      profileData: { last_scan_at: longAgo, search_terms: ['dev'], country: 'za' }
    })
    ;(profileLib.getUserFeedbackContext as jest.Mock).mockResolvedValue('Feedback')
    ;(profileLib.getLearnedSignals as jest.Mock).mockResolvedValue('Signals')
    ;(profileLib.detectSeniority as jest.Mock).mockReturnValue('mid')
    ;(profileLib.detectWorkStyle as jest.Mock).mockReturnValue('hybrid')
    ;(profileLib.calculateStackOverlap as jest.Mock).mockReturnValue(50)
    ;(profileLib.extractStack as jest.Mock).mockReturnValue(['React'])
    ;(groqLib.generateContent as jest.Mock).mockResolvedValue('{"score": 80, "reason": "Good", "stack": ["React"]}')

    // Mock Adzuna response
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      json: () => Promise.resolve({ results: [{ id: '1', title: 'Job 1', company: { display_name: 'Co' }, description: 'Desc' }] })
    })
    // Mock JSearch response
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      json: () => Promise.resolve({ data: [{ job_id: '2', job_title: 'Job 2', employer_name: 'Co 2', job_description: 'Desc 2' }] })
    })

    // Mock Supabase calls
    mockSupabase.single
        .mockResolvedValueOnce({ data: [], error: null }) // existing check
        .mockResolvedValueOnce({ data: [], error: null }) // insert jobs
        .mockResolvedValueOnce({ data: [], error: null }) // update profile
        .mockResolvedValueOnce({ data: [], error: null }) // insert log

    const res = await GET()
    const data = await res.json()
    expect(res.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.found).toBeGreaterThan(0)
  })
})
