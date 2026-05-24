/**
 * @jest-environment jsdom
 */
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import DashboardPage from '@/app/dashboard/page'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

jest.mock('@/lib/supabase/client', () => ({
  createClient: jest.fn()
}))

jest.mock('next/navigation', () => ({
  useRouter: jest.fn()
}))

jest.mock('@/lib/auth-mock', () => ({
  isDev: true,
  mockUser: { id: 'dev-user' }
}))

describe('DashboardPage', () => {
  let mockSupabase: any /* eslint-disable-line @typescript-eslint/no-explicit-any */
  let mockRouter: any /* eslint-disable-line @typescript-eslint/no-explicit-any */

  beforeEach(() => {
    jest.clearAllMocks()
    mockRouter = { push: jest.fn() }
    ;(useRouter as jest.Mock).mockReturnValue(mockRouter)

    mockSupabase = {
      auth: {
        getUser: jest.fn().mockResolvedValue({ data: { user: { id: 'dev-user' } } }),
        signOut: jest.fn().mockResolvedValue({ error: null })
      },
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({ data: { id: 'dev-user' }, error: null }),
      insert: jest.fn().mockReturnThis()
    }
    ;(createClient as jest.Mock).mockReturnValue(mockSupabase)

    global.fetch = jest.fn() as jest.Mock
  })

  it('renders dashboard with stats', async () => {
    // Mock jobs fetch
    mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'jobs_with_cover') {
            return {
                select: () => ({
                    order: () => Promise.resolve({ data: [
                        { id: '1', title: 'Job 1', status: 'pending', score: 90 },
                        { id: '2', title: 'Job 2', status: 'applied', score: 80 }
                    ], error: null })
                })
            }
        }
        return mockSupabase
    })

    render(<DashboardPage />)

    await waitFor(() => {
        expect(screen.getByText(/Job 1/i)).toBeInTheDocument()
    })

    // Check tabs
    expect(screen.getAllByText(/pending/i).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/applied/i).length).toBeGreaterThan(0)
    // There are '1's in the stats grid and in the tabs
    expect(screen.getAllByText('1').length).toBeGreaterThanOrEqual(2)
  })

  it('triggers job scan', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true, found: 5, saved: 2 })
    })

    render(<DashboardPage />)

    const scanBtn = screen.getByText(/Scan Jobs/i)
    fireEvent.click(scanBtn)

    await waitFor(() => {
        expect(screen.getByText(/Found 5 jobs/i)).toBeInTheDocument()
    })
  })

  it('handles sign out', async () => {
    render(<DashboardPage />)
    const signOutBtn = screen.getByText(/Sign Out/i)
    fireEvent.click(signOutBtn)

    await waitFor(() => {
        expect(mockRouter.push).toHaveBeenCalledWith('/login')
    })
  })
})
