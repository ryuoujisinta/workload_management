import { render, screen } from '@testing-library/react'
import { LinkButton } from '../link-button'

describe('LinkButton', () => {
  it('renders a link with provided children and href', () => {
    render(<LinkButton href="/home">Go Home</LinkButton>)
    
    const link = screen.getByRole('link', { name: /go home/i })
    expect(link).toBeInTheDocument()
    expect(link).toHaveAttribute('href', '/home')
  })

  it('applies custom className', () => {
    render(<LinkButton href="/home" className="custom-class">Settings</LinkButton>)
    
    const link = screen.getByRole('link', { name: /settings/i })
    expect(link).toHaveClass('custom-class')
  })
})
