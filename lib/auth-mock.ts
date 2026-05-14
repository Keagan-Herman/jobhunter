import { DEV_USER_ID } from './constants'

export const mockUser = {
  id: DEV_USER_ID,
  email: 'dev@example.com',
  user_metadata: {
    full_name: 'Dev User'
  },
  aud: 'authenticated',
  role: 'authenticated'
}

export async function getMockUser() {
  return { data: { user: mockUser }, error: null }
}

export const isDev = process.env.NODE_ENV === 'development'
