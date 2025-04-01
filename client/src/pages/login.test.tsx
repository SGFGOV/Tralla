import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import Login from './login'
import { AuthContext } from '../contexts/auth-context'

// Mock the modules
vi.mock('../contexts/auth-context', async () => {
  const actual = await vi.importActual('../contexts/auth-context')
  return {
    ...actual,
    useAuth: vi.fn(),
  }
})

vi.mock('wouter', () => ({
  useLocation: () => ['/login', vi.fn()],
}))

vi.mock('@/lib/queryClient', () => ({
  apiRequest: vi.fn(),
  queryClient: {
    setQueryData: vi.fn()
  }
}))

describe('Login Component', () => {
  const mockLogin = vi.fn()
  const mockLoginMutation = { 
    mutate: vi.fn(),
    isPending: false,
    isError: false,
    error: null
  }
  
  beforeEach(() => {
    vi.clearAllMocks()
    
    // Mock the auth context value
    const contextValue = {
      user: null,
      isLoading: false,
      error: null,
      login: mockLogin,
      loginMutation: mockLoginMutation,
      logoutMutation: { mutate: vi.fn(), isPending: false },
      registerMutation: { mutate: vi.fn(), isPending: false }
    }
    
    render(
      <AuthContext.Provider value={contextValue}>
        <Login />
      </AuthContext.Provider>
    )
  })

  it('renders the login form correctly', () => {
    // Check if the form components are rendered
    expect(screen.getByText('Tralla')).toBeInTheDocument()
    expect(screen.getByText('Sign in to connect with people nearby')).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/user@example.com or \+91/)).toBeInTheDocument()
    expect(screen.getByPlaceholderText('••••••••')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Sign In/i })).toBeInTheDocument()
  })

  it('shows validation errors for empty fields', async () => {
    // Try to submit the form without entering data
    const submitButton = screen.getByRole('button', { name: /Sign In/i })
    fireEvent.click(submitButton)
    
    // Check for validation errors
    await waitFor(() => {
      expect(screen.getByText(/Email or phone number is required/i)).toBeInTheDocument()
      expect(screen.getByText(/Password is required/i)).toBeInTheDocument()
    })
  })

  it('calls login mutation when valid data is submitted', async () => {
    // Fill in the form fields
    fireEvent.change(screen.getByPlaceholderText(/user@example.com or \+91/), {
      target: { value: 'test@example.com' }
    })
    
    fireEvent.change(screen.getByPlaceholderText('••••••••'), {
      target: { value: 'password123' }
    })
    
    // Submit the form
    const submitButton = screen.getByRole('button', { name: /Sign In/i })
    fireEvent.click(submitButton)
    
    // Check if login mutation was called with the correct data
    await waitFor(() => {
      expect(mockLoginMutation.mutate).toHaveBeenCalledWith({
        username: 'test@example.com',
        password: 'password123'
      })
    })
  })

  // Add more test cases for OTP functionality, error handling, etc.
})