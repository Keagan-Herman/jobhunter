import { withRetry } from '@/lib/retry'

describe('withRetry', () => {
  test('returns result if operation succeeds first time', async () => {
    const op = jest.fn().mockResolvedValue('success')
    const result = await withRetry(op)
    expect(result).toBe('success')
    expect(op).toHaveBeenCalledTimes(1)
  })

  test('retries and eventually succeeds', async () => {
    const op = jest
      .fn()
      .mockRejectedValueOnce(new Error('fail'))
      .mockRejectedValueOnce(new Error('fail'))
      .mockResolvedValue('success')

    const result = await withRetry(op, 3, 10)
    expect(result).toBe('success')
    expect(op).toHaveBeenCalledTimes(3)
  })

  test('throws after max retries', async () => {
    const op = jest.fn().mockRejectedValue(new Error('fail'))
    await expect(withRetry(op, 2, 10)).rejects.toThrow('fail')
    expect(op).toHaveBeenCalledTimes(2)
  })
})
