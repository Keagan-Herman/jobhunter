import {
  detectSeniority,
  detectWorkStyle,
  calculateStackOverlap,
  extractStack,
  getCountryName
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
})
