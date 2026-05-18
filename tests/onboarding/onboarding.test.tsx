/**
 * @jest-environment jsdom
 */
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import OnboardingPage from '@/app/onboarding/page'
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

describe('OnboardingPage', () => {
  let mockSupabase: any
  let mockRouter: any

  beforeEach(() => {
    jest.clearAllMocks()
    mockRouter = { push: jest.fn() }
    ;(useRouter as jest.Mock).mockReturnValue(mockRouter)

    mockSupabase = {
      auth: {
        getUser: jest.fn().mockResolvedValue({ data: { user: { id: 'dev-user' } } })
      },
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({ data: null, error: null }),
      upsert: jest.fn().mockResolvedValue({ error: null })
    }
    ;(createClient as jest.Mock).mockReturnValue(mockSupabase)
  })

  it('renders step 1 by default', async () => {
    render(<OnboardingPage />)
    expect(screen.getByText(/Welcome! Let's get you set up/i)).toBeInTheDocument()
  })

  it('navigates through steps manually', async () => {
    render(<OnboardingPage />)

    // Step 1 -> Step 2
    fireEvent.click(screen.getByText(/Fill in manually/i))
    // Use getAllByText and check for h2 specifically to avoid progress bar label
    expect(screen.getByRole('heading', { name: /Your Profile/i })).toBeInTheDocument()

    // Fill Step 2
    fireEvent.change(screen.getByPlaceholderText(/John Smith/i), { target: { value: 'John Doe' } })
    fireEvent.change(screen.getByPlaceholderText(/TypeScript, React/i), { target: { value: 'React, Node' } })

    // Step 2 -> Step 3
    fireEvent.click(screen.getByText(/Next → Preferences/i))
    expect(screen.getByRole('heading', { name: /Job Preferences/i })).toBeInTheDocument()
  })

  it('redirects if profile already exists', async () => {
    mockSupabase.single.mockResolvedValueOnce({ data: { id: 'dev-user' }, error: null })
    render(<OnboardingPage />)

    await waitFor(() => {
      expect(mockRouter.push).toHaveBeenCalledWith('/dashboard')
    })
  })

  it('handles CV import', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      json: () => Promise.resolve({
        success: true,
        profile: {
          full_name: 'Jane Doe',
          skills: ['Next.js', 'Tailwind']
        }
      })
    })

    render(<OnboardingPage />)

    const file = new File(['dummy content'], 'cv.pdf', { type: 'application/pdf' })
    const input = screen.getByLabelText(/Upload PDF/i)

    fireEvent.change(input, { target: { files: [file] } })

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /Your Profile/i })).toBeInTheDocument()
      expect(screen.getByDisplayValue('Jane Doe')).toBeInTheDocument()
      expect(screen.getByDisplayValue('Next.js, Tailwind')).toBeInTheDocument()
    })
  })
})
