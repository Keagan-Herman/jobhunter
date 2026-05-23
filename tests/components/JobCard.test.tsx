/**
 * @jest-environment jsdom
 */
import { render, screen, fireEvent } from '@testing-library/react'
import { JobCard } from '@/components/dashboard/JobCard'

const mockJob = {
  id: '1',
  title: 'Software Engineer',
  company: 'Tech Co',
  location: 'Remote',
  score: 85,
  stack: ['React', 'TypeScript'],
  status: 'pending',
  seniority: 'senior',
  work_style: 'fully remote',
  stack_overlap: 90,
  score_reason: 'Good match'
} as any /* eslint-disable-line @typescript-eslint/no-explicit-any */

describe('JobCard', () => {
  it('renders job details correctly', () => {
    render(<JobCard job={mockJob} isSelected={false} onClick={() => {}} index={0} />)

    expect(screen.getByText('Software Engineer')).toBeInTheDocument()
    expect(screen.getByText(/Tech Co/)).toBeInTheDocument()
    expect(screen.getByText(/85/)).toBeInTheDocument()
    expect(screen.getByText('senior')).toBeInTheDocument()
    expect(screen.getByText('fully remote')).toBeInTheDocument()
    expect(screen.getByText(/90/)).toBeInTheDocument()
  })

  it('calls onClick when clicked', () => {
    const handleClick = jest.fn()
    render(<JobCard job={mockJob} isSelected={false} onClick={handleClick} index={0} />)

    fireEvent.click(screen.getByText('Software Engineer').closest('div')!)
    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  it('applies selected styles when isSelected is true', () => {
    const { container } = render(<JobCard job={mockJob} isSelected={true} onClick={() => {}} index={0} />)
    expect(container.firstChild).toHaveClass('bg-[#111128]')
    expect(container.firstChild).toHaveClass('before:bg-[#00ff87]')
  })
})
