import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import VendorDashboard from '../../pages/vendor/dashboard';
import { VendorAuthProvider } from '../../contexts/vendor-auth-context';

// Mock the useVendorAuth hook
vi.mock('../../hooks/use-vendor-auth', () => ({
  useVendorAuth: () => ({
    vendor: {
      id: 1,
      email: 'test-restaurant@example.com',
      name: 'Test Restaurant',
      businessType: 'restaurant',
      businessId: 1,
      verified: true,
      active: true,
    },
    isLoading: false,
    error: null,
  }),
}));

// Mock the API query hooks
vi.mock('@tanstack/react-query', () => ({
  useQuery: vi.fn().mockImplementation(({ queryKey }) => {
    // Restaurant data
    if (queryKey[0] === '/api/vendor/restaurants') {
      return {
        data: [{
          id: 1,
          name: 'Test Restaurant',
          location: '123 Test St',
          cuisine: 'Italian',
          priceRange: '$$',
          rating: 4.5,
        }],
        isLoading: false,
        error: null,
      };
    }
    
    // Restaurant stats
    if (queryKey[0] === '/api/vendor/restaurants/1/stats') {
      return {
        data: {
          total: 25,
          pending: 5,
          confirmed: 15,
          canceled: 3,
          completed: 2,
          todayReservations: 8,
          upcomingReservations: 20,
        },
        isLoading: false,
        error: null,
      };
    }
    
    // Recent reservations
    if (queryKey[0] === '/api/vendor/restaurants/1/reservations') {
      return {
        data: [
          {
            id: 1,
            userId: 1,
            reservationDate: new Date().toISOString(),
            partySize: 4,
            status: 'pending',
            specialRequests: 'Window seat please',
            user: {
              id: 1,
              displayName: 'John Doe',
              email: 'john@example.com'
            }
          },
          {
            id: 2,
            userId: 2,
            reservationDate: new Date().toISOString(),
            partySize: 2,
            status: 'confirmed',
            tableNumber: 'A12',
            user: {
              id: 2,
              displayName: 'Jane Smith',
              email: 'jane@example.com'
            }
          }
        ],
        isLoading: false,
        error: null,
      };
    }
    
    // Fallback for any other query
    return {
      data: undefined,
      isLoading: false,
      error: null,
    };
  }),
  
  QueryClient: vi.fn(),
  QueryClientProvider: ({ children }: { children: React.ReactNode }) => children,
}));

// Mock the useToast hook
vi.mock('../../hooks/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

// Mock wouter
vi.mock('wouter', () => ({
  useLocation: () => ['/vendor/dashboard', vi.fn()],
  useRoute: vi.fn(),
  Link: ({ children, ...props }: any) => <a {...props}>{children}</a>,
}));

describe('VendorDashboard Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the dashboard with vendor information', async () => {
    render(
      <VendorAuthProvider>
        <VendorDashboard />
      </VendorAuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Vendor Dashboard')).toBeInTheDocument();
      expect(screen.getByText('Test Restaurant')).toBeInTheDocument();
      expect(screen.getByText('123 Test St')).toBeInTheDocument();
      expect(screen.getByText('Italian')).toBeInTheDocument();
      expect(screen.getByText('4.5')).toBeInTheDocument();
    });
  });

  it('displays reservation statistics', async () => {
    render(
      <VendorAuthProvider>
        <VendorDashboard />
      </VendorAuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Today: 8 reservations')).toBeInTheDocument();
      expect(screen.getByText('Upcoming: 20 reservations')).toBeInTheDocument();
      expect(screen.getByText('5')).toBeInTheDocument(); // Pending
      expect(screen.getByText('15')).toBeInTheDocument(); // Confirmed
      expect(screen.getByText('3')).toBeInTheDocument(); // Canceled
    });
  });

  it('shows recent reservations', async () => {
    render(
      <VendorAuthProvider>
        <VendorDashboard />
      </VendorAuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Recent Reservations')).toBeInTheDocument();
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('4 people')).toBeInTheDocument();
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
      expect(screen.getByText('2 people')).toBeInTheDocument();
      expect(screen.getByText('Table A12')).toBeInTheDocument();
    });
  });

  it('displays navigation links to other vendor pages', async () => {
    render(
      <VendorAuthProvider>
        <VendorDashboard />
      </VendorAuthProvider>
    );

    await waitFor(() => {
      const manageRestaurantLink = screen.getByText('Manage Restaurant');
      expect(manageRestaurantLink).toBeInTheDocument();
      expect(manageRestaurantLink.closest('a')).toHaveAttribute('href', '/vendor/restaurant/1');
      
      const discountCodesLink = screen.getByText('Discount Codes');
      expect(discountCodesLink).toBeInTheDocument();
      expect(discountCodesLink.closest('a')).toHaveAttribute('href', '/vendor/discounts');
      
      const profileLink = screen.getByText('Profile Settings');
      expect(profileLink).toBeInTheDocument();
      expect(profileLink.closest('a')).toHaveAttribute('href', '/vendor/profile');
    });
  });

  it('shows loading state when data is loading', async () => {
    // Override the mock for loading state
    vi.mocked(import('@tanstack/react-query')).useQuery.mockImplementationOnce(() => ({
      data: undefined,
      isLoading: true,
      error: null,
    }));

    render(
      <VendorAuthProvider>
        <VendorDashboard />
      </VendorAuthProvider>
    );

    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('shows error state when data fetch fails', async () => {
    // Override the mock for error state
    vi.mocked(import('@tanstack/react-query')).useQuery.mockImplementationOnce(() => ({
      data: undefined,
      isLoading: false,
      error: new Error('Failed to fetch restaurant data'),
    }));

    render(
      <VendorAuthProvider>
        <VendorDashboard />
      </VendorAuthProvider>
    );

    expect(screen.getByText('Error loading dashboard data')).toBeInTheDocument();
  });
});