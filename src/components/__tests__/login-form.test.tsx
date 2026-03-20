import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import LoginForm from '../login-form'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'

jest.mock('next-auth/react', () => ({
  signIn: jest.fn(),
}))

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}))

describe('LoginForm', () => {
  const mockSignIn = signIn as jest.Mock
  const mockPush = jest.fn()
  const mockRefresh = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    ;(useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
      refresh: mockRefresh,
    })
  })

  it('renders login form properly', () => {
    render(<LoginForm />)
    
    expect(screen.getByText("工数管理システム")).toBeInTheDocument()
    expect(screen.getByLabelText("メールアドレス")).toBeInTheDocument()
    expect(screen.getByLabelText("パスワード")).toBeInTheDocument()
    expect(screen.getByRole('button', { name: "ログイン" })).toBeInTheDocument()
  })

  it('shows error message if signIn fails', async () => {
    mockSignIn.mockResolvedValueOnce({ error: 'CredentialsSignin' })
    render(<LoginForm />)

    fireEvent.change(screen.getByLabelText("メールアドレス"), { target: { value: 'test@example.com' } })
    fireEvent.change(screen.getByLabelText("パスワード"), { target: { value: 'wrongpass' } })
    fireEvent.click(screen.getByRole('button', { name: "ログイン" }))

    await waitFor(() => {
      expect(mockSignIn).toHaveBeenCalledWith('credentials', {
        email: 'test@example.com',
        password: 'wrongpass',
        redirect: false
      })
      expect(screen.getByText("メールアドレスまたはパスワードが間違っています")).toBeInTheDocument()
    })
    
    expect(mockPush).not.toHaveBeenCalled()
  })

  it('redirects to root if signIn succeeds', async () => {
    mockSignIn.mockResolvedValueOnce({ ok: true })
    render(<LoginForm />)

    fireEvent.change(screen.getByLabelText("メールアドレス"), { target: { value: 'user@example.com' } })
    fireEvent.change(screen.getByLabelText("パスワード"), { target: { value: 'correctpass' } })
    fireEvent.click(screen.getByRole('button', { name: "ログイン" }))

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/')
      expect(mockRefresh).toHaveBeenCalled()
    })
  })
})
