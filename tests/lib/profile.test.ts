import {
  detectSeniority,
  detectWorkStyle,
  calculateStackOverlap,
  extractStack,
  getCountryName,
  getUserProfile,
  getUserFeedbackContext,
  getLearnedSignals
} from '@/lib/profile'

describe('profile utilities', () => {
  describe('detectSeniority', () => {
    test('detects junior roles', () => {
      expect(detectSeniority('Junior Developer')).toBe('junior')
      expect(detectSeniority('Graduate Engineer')).toBe('junior')
      expect(detectSeniority('Entry Level Analyst')).toBe('junior')
    })

    test('detects senior roles', () => {
      expect(detectSeniority('Senior Developer')).toBe('senior')
      expect(detectSeniority('Lead Engineer')).toBe('senior')
      expect(detectSeniority('Principal Architect')).toBe('senior')
    })

    test('detects executive roles', () => {
      expect(detectSeniority('Head of Engineering')).toBe('executive')
      expect(detectSeniority('Director of Product')).toBe('executive')
      expect(detectSeniority('VP of Sales')).toBe('executive')
    })

    test('defaults to mid', () => {
      expect(detectSeniority('Software Developer')).toBe('mid')
      expect(detectSeniority('Full Stack Engineer')).toBe('mid')
    })
  })

  describe('detectWorkStyle', () => {
    test('detects fully remote', () => {
      expect(detectWorkStyle('This is a fully remote position')).toBe('fully remote')
      expect(detectWorkStyle('100% remote working')).toBe('fully remote')
      expect(detectWorkStyle('Work from anywhere')).toBe('fully remote')
    })

    test('detects hybrid', () => {
      expect(detectWorkStyle('We offer hybrid work options')).toBe('hybrid')
    })

    test('detects on-site', () => {
      expect(detectWorkStyle('Working on-site in London')).toBe('on-site')
      expect(detectWorkStyle('In office 5 days a week')).toBe('on-site')
      expect(detectWorkStyle('In-office environment')).toBe('on-site')
    })

    test('returns unspecified', () => {
      expect(detectWorkStyle('Great job opportunity')).toBe('unspecified')
    })
  })

  describe('calculateStackOverlap', () => {
    test('calculates correct overlap percentage', () => {
      const jobStack = ['React', 'TypeScript', 'Node.js']
      const userSkills = ['react', 'typescript', 'python']
      expect(calculateStackOverlap(jobStack, userSkills)).toBe(67)
    })

    test('returns 0 if no match', () => {
      const jobStack = ['Java']
      const userSkills = ['Python']
      expect(calculateStackOverlap(jobStack, userSkills)).toBe(0)
    })

    test('returns 0 if empty inputs', () => {
      expect(calculateStackOverlap([], [])).toBe(0)
      expect(calculateStackOverlap(['React'], [])).toBe(0)
      expect(calculateStackOverlap([], ['React'])).toBe(0)
    })

    test('handles 100% overlap', () => {
      expect(calculateStackOverlap(['React'], ['React'])).toBe(100)
    })
  })

  describe('extractStack', () => {
    test('extracts keywords from description', () => {
      const desc = 'We use React, TypeScript and Node.js with a PostgreSQL database on AWS.'
      const stack = extractStack(desc)
      expect(stack).toContain('React')
      expect(stack).toContain('TypeScript')
      expect(stack).toContain('Node.js')
      expect(stack).toContain('PostgreSQL')
      expect(stack).toContain('AWS')
      expect(stack).not.toContain('Python')
    })

    test('is case insensitive', () => {
      const desc = 'react and typescript'
      const stack = extractStack(desc)
      expect(stack).toContain('React')
      expect(stack).toContain('TypeScript')
    })
  })

  describe('getCountryName', () => {
    test('returns correct country name', () => {
      expect(getCountryName('za')).toBe('South Africa')
      expect(getCountryName('gb')).toBe('United Kingdom')
      expect(getCountryName('us')).toBe('United States')
    })

    test('defaults to South Africa', () => {
      expect(getCountryName('unknown')).toBe('South Africa')
    })
  })

  describe('getUserProfile (Database)', () => {
    test('returns profile text and data when found', async () => {
      const mockSingle = jest.fn().mockResolvedValue({
        data: {
          full_name: 'John Doe',
          job_title: 'Developer',
          company: 'Acme',
          skills: ['JS', 'TS']
        },
        error: null
      })
      const mockSupabase = {
        from: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: mockSingle
      } as any /* eslint-disable-line @typescript-eslint/no-explicit-any */

      const result = await getUserProfile(mockSupabase, 'user-123')
      expect(result.profileData?.full_name).toBe('John Doe')
      expect(result.profileText).toContain('John Doe')
      expect(result.profileText).toContain('JS, TS')
    })

    test('returns default when not found', async () => {
      const mockSupabase = {
        from: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: null, error: null })
      } as any /* eslint-disable-line @typescript-eslint/no-explicit-any */

      const result = await getUserProfile(mockSupabase, 'user-123')
      expect(result.profileData).toBeNull()
      expect(result.profileText).toBe('Software developer with full stack experience')
    })
  })

  describe('getUserFeedbackContext', () => {
    test('formats applied and skipped jobs', async () => {
        const mockSupabase = {
            from: jest.fn().mockReturnThis(),
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            order: jest.fn().mockReturnThis(),
            limit: jest.fn().mockResolvedValue({
                data: [
                    { action: 'applied', reason: 'Great stack', jobs: { title: 'App 1', company: 'Co 1' } },
                    { action: 'skipped', reason: 'Too far', jobs: { title: 'Skip 1', company: 'Co 2' } }
                ]
            })
        } as any /* eslint-disable-line @typescript-eslint/no-explicit-any */

        const result = await getUserFeedbackContext(mockSupabase, 'user-123')
        expect(result).toContain('Jobs they applied to:')
        expect(result).toContain('- Applied to "App 1" at Co 1 — liked: Great stack')
        expect(result).toContain('Jobs they skipped:')
        expect(result).toContain('- Skipped "Skip 1" at Co 2 because: Too far')
    })
  })

  describe('getLearnedSignals', () => {
    test('formats positive and negative signals', async () => {
        const mockSupabase = {
            from: jest.fn().mockReturnThis(),
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            order: jest.fn().mockReturnThis(),
            limit: jest.fn().mockResolvedValue({
                data: [
                    { signal_type: 'tech', signal_value: 'React', weight: 5, outcome: 'positive' },
                    { signal_type: 'location', signal_value: 'Remote', weight: 3, outcome: 'negative' }
                ]
            })
        } as any /* eslint-disable-line @typescript-eslint/no-explicit-any */

        const result = await getLearnedSignals(mockSupabase, 'user-123')
        expect(result).toContain('Signals that led to positive outcomes')
        expect(result).toContain('- tech: "React" (strength: 5.0)')
        expect(result).toContain('Signals that led to negative outcomes')
        expect(result).toContain('- location: "Remote" (strength: 3.0)')
    })
  })
})
