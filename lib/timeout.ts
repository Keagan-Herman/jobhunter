export async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number = 10000,
  label: string = 'operation'
): Promise<T> {
  let timerId: ReturnType<typeof setTimeout>
  const timeout = new Promise<never>((_, reject) => {
    timerId = setTimeout(() => reject(new Error(`${label} timed out after ${timeoutMs}ms`)), timeoutMs)
  })
  // Suppress unhandled rejection from the losing promise — without this, a Groq/PDF.js
  // call that settles after the timeout fires becomes an unhandled rejection that
  // Next.js dev mode intercepts and converts to an HTML error response.
  promise.catch(() => {})
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timerId!))
}