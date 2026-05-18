import { scoreCache } from '@/lib/cache'

describe('scoreCache', () => {
  const mockSupabase = {
    from: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    single: jest.fn()
  } as any

  test('get returns cached data when found', async () => {
    mockSupabase.single.mockResolvedValue({
      data: {
        score: 85,
        score_reason: 'Good match',
        stack: ['React'],
        score_is_fallback: false
      },
      error: null
    })

    const result = await scoreCache.get(mockSupabase, 'ext-123_user-456')
    expect(result).toEqual({
      score: 85,
      reason: 'Good match',
      stack: ['React'],
      score_is_fallback: false
    })
    expect(mockSupabase.eq).toHaveBeenCalledWith('external_id', 'ext-123')
    expect(mockSupabase.eq).toHaveBeenCalledWith('user_id', 'user-456')
  })

  test('get returns null when not found', async () => {
    mockSupabase.single.mockResolvedValue({ data: null, error: null })
    const result = await scoreCache.get(mockSupabase, 'ext-123_user-456')
    expect(result).toBeNull()
  })
})
