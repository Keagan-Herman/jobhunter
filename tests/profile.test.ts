import { detectSeniority, detectWorkStyle, calculateStackOverlap } from '../lib/profile'

describe('Profile Logic', () => {
  describe('detectSeniority', () => {
    it('should detect junior roles', () => {
      expect(detectSeniority('Junior Web Developer')).toBe('junior')
      expect(detectSeniority('Graduate Engineer')).toBe('junior')
      expect(detectSeniority('Entry Level Analyst')).toBe('junior')
    })

    it('should detect senior roles', () => {
      expect(detectSeniority('Senior Frontend Engineer')).toBe('senior')
      expect(detectSeniority('Engineering Lead')).toBe('senior')
      expect(detectSeniority('Principal Architect')).toBe('senior')
    })

    it('should detect executive roles', () => {
      expect(detectSeniority('Head of Product')).toBe('executive')
      expect(detectSeniority('VP Engineering')).toBe('executive')
      expect(detectSeniority('Director of Technology')).toBe('executive')
    })

    it('should default to mid for others', () => {
      expect(detectSeniority('Software Engineer')).toBe('mid')
      expect(detectSeniority('Developer')).toBe('mid')
    })
  })

  describe('detectWorkStyle', () => {
    it('should detect fully remote', () => {
      expect(detectWorkStyle('This role is fully remote.')).toBe('fully remote')
      expect(detectWorkStyle('100% remote working')).toBe('fully remote')
    })

    it('should detect hybrid', () => {
      expect(detectWorkStyle('We offer hybrid work options.')).toBe('hybrid')
    })

    it('should detect on-site', () => {
      expect(detectWorkStyle('This is an on-site position in London.')).toBe('on-site')
      expect(detectWorkStyle('Office-based role')).toBe('on-site')
    })

    it('should return unspecified if no match', () => {
      expect(detectWorkStyle('Great job opportunity.')).toBe('unspecified')
    })
  })

  describe('calculateStackOverlap', () => {
    it('should calculate correct percentage', () => {
      const jobStack = ['React', 'TypeScript', 'Node.js']
      const userSkills = ['React', 'TypeScript', 'Python']
      expect(calculateStackOverlap(jobStack, userSkills)).toBe(67)
    })

    it('should return 100 for perfect match', () => {
      const jobStack = ['Go', 'Docker']
      const userSkills = ['Go', 'Docker', 'Kubernetes']
      expect(calculateStackOverlap(jobStack, userSkills)).toBe(100)
    })

    it('should return 0 for no match', () => {
      const jobStack = ['Java']
      const userSkills = ['PHP']
      expect(calculateStackOverlap(jobStack, userSkills)).toBe(0)
    })

    it('should handle empty arrays', () => {
      expect(calculateStackOverlap([], ['React'])).toBe(0)
      expect(calculateStackOverlap(['React'], [])).toBe(0)
    })
  })
})
