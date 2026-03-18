export async function withRetry<T>(
  fn: () => Promise<T>,
  retries: number = 3,
  delayMs: number = 1000,
  label: string = 'operation'
): Promise<T> {
  let lastError: any

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await fn()
    } catch (err: any) {
      lastError = err
      console.log(`[RETRY] ${label} failed (attempt ${attempt}/${retries}): ${err.message?.slice(0, 80)}`)
      if (attempt < retries) {
        await new Promise(r => setTimeout(r, delayMs * attempt)) // exponential backoff
      }
    }
  }

  throw lastError
}