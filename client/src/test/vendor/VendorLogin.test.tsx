import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import VendorLogin from '../../pages/vendor/login';
import { VendorAuthProvider } from '../../contexts/vendor-auth-context';

// Mock the useVendorAuth hook
vi.mock('../../hooks/use-vendor-auth', () => ({
  useVendorAuth: () => ({
    vendor: null,
    isLoading: false,
    error: null,
    login: vi.fn().mockImplementation((email, password) => {
      if (email === 'test@example.com' && password === 'password123') {
        return Promise.resolve({
          vendor: {
            id: 1,
            email: 'test@example.com',
            name: 'Test Vendor',
          },
          token: 'fake-token',
        });
      } else {
        return Promise.reject(new Error('Invalid credentials'));
      }
    }),
    logout: vi.fn(),
  }),
}));

// Mock useLocation and navigate from wouter
vi.mock('wouter', () => ({
  useLocation: () => ['/vendor/login', vi.fn()],
  useRoute: vi.fn(),
  Link: ({ children, ...props }: any) => <a {...props}>{children}</a>,
  navigate: vi.fn(),
}));

describe('VendorLogin Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the login form', () => {
    render(
      <VendorAuthProvider>
        <VendorLogin />
      </VendorAuthProvider>
    );

    expect(screen.getByText('Vendor Login')).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
    expect(screen.getByText(/don't have an account/i)).toBeInTheDocument();
    expect(screen.getByText(/register/i)).toBeInTheDocument();
  });

  it('shows validation errors for empty fields', async () => {
    render(
      <VendorAuthProvider>
        <VendorLogin />
      </VendorAuthProvider>
    );

    // Submit form without filling fields
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    // Check validation errors
    await waitFor(() => {
      expect(screen.getByText(/email is required/i)).toBeInTheDocument();
      expect(screen.getByText(/password is required/i)).toBeInTheDocument();
    });
  });

  it('shows validation error for invalid email', async () => {
    render(
      <VendorAuthProvider>
        <VendorLogin />
      </VendorAuthProvider>
    );

    // Type invalid email
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'not-an-email' },
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: 'password123' },
    });

    // Submit form
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    // Check validation error
    await waitFor(() => {
      expect(screen.getByText(/invalid email/i)).toBeInTheDocument();
    });
  });

  it('handles successful login', async () => {
    const { navigate } = await import('wouter');

    render(
      <VendorAuthProvider>
        <VendorLogin />
      </VendorAuthProvider>
    );

    // Fill form with valid credentials
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'test@example.com' },
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: 'password123' },
    });

    // Submit form
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    // Check navigation
    await waitFor(() => {
      expect(navigate).toHaveBeenCalledWith('/vendor/dashboard');
    });
  });

  it('handles login failure', async () => {
    render(
      <VendorAuthProvider>
        <VendorLogin />
      </VendorAuthProvider>
    );

    // Fill form with invalid credentials
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'test@example.com' },
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: 'wrong-password' },
    });

    // Submit form
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    // Check error message
    await waitFor(() => {
      expect(screen.getByText(/invalid credentials/i)).toBeInTheDocument();
    });
  });

  it('navigates to registration page when register link is clicked', () => {
    render(
      <VendorAuthProvider>
        <VendorLogin />
      </VendorAuthProvider>
    );

    // Click register link
    const registerLink = screen.getByText(/register/i);
    expect(registerLink.getAttribute('href')).toBe('/vendor/register');
  });
});