import { scoreCache } from '@/lib/cache'
import { db } from '@/lib/db'

jest.mock('@/lib/db', () => ({
  db: {
    query: {
      jobs: {
        findFirst: jest.fn(),
      },
    },
  },
}))

describe('scoreCache', () => {
  test('get returns cached data when found', async () => {
    (db.query.jobs.findFirst as jest.Mock).mockResolvedValue({
      score: 85,
      score_reason: 'Good match',
      stack: ['React'],
      score_is_fallback: false
    })

    const result = await scoreCache.get('user-456', 'ext-123')
    expect(result).toEqual({
      score: 85,
      reason: 'Good match',
      stack: ['React'],
      score_is_fallback: false
    })
  })

  test('get returns null when not found', async () => {
    (db.query.jobs.findFirst as jest.Mock).mockResolvedValue(null)
    const result = await scoreCache.get('user-456', 'ext-123')
    expect(result).toBeNull()
  })
})
