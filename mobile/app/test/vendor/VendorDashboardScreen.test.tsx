import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import VendorDashboardScreen from '../../screens/vendor/VendorDashboardScreen';
import { VendorAuthProvider } from '../../contexts/vendor-auth-context';

// Mock the navigation
jest.mock('@react-navigation/native', () => {
  return {
    ...jest.requireActual('@react-navigation/native'),
    useNavigation: () => ({
      navigate: jest.fn(),
      goBack: jest.fn(),
    }),
  };
});

// Mock the vendor auth context
jest.mock('../../hooks/use-vendor-auth', () => ({
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

// Mock API hooks
jest.mock('../../hooks/use-api', () => ({
  useApi: (endpoint) => {
    if (endpoint === '/api/vendor/restaurants') {
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
    
    if (endpoint === '/api/vendor/restaurants/1/stats') {
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
    
    if (endpoint === '/api/vendor/restaurants/1/reservations') {
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
    
    return {
      data: null,
      isLoading: false,
      error: null,
    };
  },
}));

describe('VendorDashboardScreen', () => {
  it('renders the dashboard with vendor information', async () => {
    const { getByText } = render(
      <VendorAuthProvider>
        <VendorDashboardScreen />
      </VendorAuthProvider>
    );

    await waitFor(() => {
      expect(getByText('Vendor Dashboard')).toBeTruthy();
      expect(getByText('Test Restaurant')).toBeTruthy();
      expect(getByText('123 Test St')).toBeTruthy();
      expect(getByText('Italian')).toBeTruthy();
      expect(getByText('Rating: 4.5')).toBeTruthy();
    });
  });

  it('displays reservation statistics', async () => {
    const { getByText } = render(
      <VendorAuthProvider>
        <VendorDashboardScreen />
      </VendorAuthProvider>
    );

    await waitFor(() => {
      expect(getByText('Today: 8 reservations')).toBeTruthy();
      expect(getByText('Upcoming: 20 reservations')).toBeTruthy();
      expect(getByText('5')).toBeTruthy(); // Pending
      expect(getByText('15')).toBeTruthy(); // Confirmed
      expect(getByText('3')).toBeTruthy(); // Canceled
    });
  });

  it('shows recent reservations', async () => {
    const { getByText } = render(
      <VendorAuthProvider>
        <VendorDashboardScreen />
      </VendorAuthProvider>
    );

    await waitFor(() => {
      expect(getByText('Recent Reservations')).toBeTruthy();
      expect(getByText('John Doe')).toBeTruthy();
      expect(getByText('4 people')).toBeTruthy();
      expect(getByText('Jane Smith')).toBeTruthy();
      expect(getByText('2 people')).toBeTruthy();
      expect(getByText('Table: A12')).toBeTruthy();
    });
  });

  it('displays quicklinks to vendor functions', async () => {
    const { getByText } = render(
      <VendorAuthProvider>
        <VendorDashboardScreen />
      </VendorAuthProvider>
    );

    await waitFor(() => {
      expect(getByText('Manage Reservations')).toBeTruthy();
      expect(getByText('Discount Codes')).toBeTruthy();
      expect(getByText('View Profile')).toBeTruthy();
      expect(getByText('Settings')).toBeTruthy();
    });
  });

  it('shows loading state when data is loading', async () => {
    // Override the mock for loading state
    jest.mock('../../hooks/use-api', () => ({
      useApi: () => ({
        data: null,
        isLoading: true,
        error: null,
      }),
    }));

    const { getByTestId } = render(
      <VendorAuthProvider>
        <VendorDashboardScreen />
      </VendorAuthProvider>
    );

    expect(getByTestId('loading-indicator')).toBeTruthy();
  });

  it('shows error state when data fetch fails', async () => {
    // Override the mock for error state
    jest.mock('../../hooks/use-api', () => ({
      useApi: () => ({
        data: null,
        isLoading: false,
        error: new Error('Failed to fetch restaurant data'),
      }),
    }));

    const { getByText } = render(
      <VendorAuthProvider>
        <VendorDashboardScreen />
      </VendorAuthProvider>
    );

    expect(getByText('Error loading dashboard data')).toBeTruthy();
  });
});