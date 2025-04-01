// Import necessary testing utilities
import '@testing-library/jest-dom';
import { vi, afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

// Mock matchMedia if needed
beforeAll(() => {
  window.matchMedia = window.matchMedia || function() {
    return {
      matches: false,
      addListener: function() {},
      removeListener: function() {},
      addEventListener: function() {},
      removeEventListener: function() {},
      dispatchEvent: function() {
        return false;
      },
    };
  };
});

// Mock the navigation functions from wouter
vi.mock('wouter', async (importOriginal) => {
  const actual = await importOriginal<typeof import('wouter')>();
  return {
    ...actual,
    useLocation: () => ['/test-location', vi.fn()],
    useRoute: vi.fn(),
    Link: ({ children, ...props }: any) => <a {...props}>{children}</a>,
  };
});

// Mock react-query
vi.mock('@tanstack/react-query', async () => {
  return {
    useQuery: vi.fn().mockImplementation(() => ({
      data: undefined,
      isLoading: false,
      error: null,
    })),
    useMutation: vi.fn().mockImplementation(() => ({
      mutate: vi.fn(),
      isPending: false,
      isError: false,
      error: null,
    })),
    QueryClient: vi.fn(),
    QueryClientProvider: ({ children }: { children: React.ReactNode }) => children,
  };
});

// Mock the Stripe libraries
vi.mock('@stripe/react-stripe-js', async () => {
  return {
    CardElement: () => <div data-testid="card-element" />,
    Elements: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    useStripe: () => ({
      confirmPayment: vi.fn(),
    }),
    useElements: () => ({
      getElement: vi.fn(),
    }),
  };
});

vi.mock('@stripe/stripe-js', async () => {
  return {
    loadStripe: vi.fn().mockResolvedValue({
      elements: vi.fn().mockReturnValue({}),
    }),
  };
});

// Clean up after each test
afterEach(() => {
  cleanup();
});