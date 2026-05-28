import {
  detectSeniority,
  detectWorkStyle,
} from '@/lib/profile'

describe('profile seniority', () => {
    test('detects senior roles', () => {
      expect(detectSeniority('Senior Developer')).toBe('senior')
    })
})

describe('profile work style', () => {
    test('detects fully remote', () => {
      expect(detectWorkStyle('This is a fully remote position')).toBe('fully remote')
    })
})
