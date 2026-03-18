export async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number = 10000,
  label: string = 'operation'
): Promise<T> {
  const timeout = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error(`${label} timed out after ${timeoutMs}ms`)), timeoutMs)
  )
  return Promise.race([promise, timeout])
}