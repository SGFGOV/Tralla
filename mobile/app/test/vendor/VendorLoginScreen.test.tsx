import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import VendorLoginScreen from '../../screens/vendor/VendorLoginScreen';
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

// Mock the vendor auth hook
jest.mock('../../hooks/use-vendor-auth', () => ({
  useVendorAuth: () => ({
    vendor: null,
    isLoading: false,
    error: null,
    login: jest.fn().mockImplementation((email, password) => {
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
    logout: jest.fn(),
  }),
}));

// Mock toast notifications
jest.mock('react-native-toast-message', () => ({
  show: jest.fn(),
}));

describe('VendorLoginScreen', () => {
  it('renders the login form correctly', () => {
    const { getByText, getByPlaceholderText } = render(
      <VendorAuthProvider>
        <VendorLoginScreen />
      </VendorAuthProvider>
    );

    // Check form elements
    expect(getByText('Vendor Login')).toBeTruthy();
    expect(getByPlaceholderText('Email')).toBeTruthy();
    expect(getByPlaceholderText('Password')).toBeTruthy();
    expect(getByText('Sign In')).toBeTruthy();
    expect(getByText("Don't have an account? Register")).toBeTruthy();
  });

  it('validates form inputs', async () => {
    const { getByText, getByPlaceholderText } = render(
      <VendorAuthProvider>
        <VendorLoginScreen />
      </VendorAuthProvider>
    );

    // Submit empty form
    fireEvent.press(getByText('Sign In'));

    // Check validation errors
    await waitFor(() => {
      expect(getByText('Email is required')).toBeTruthy();
      expect(getByText('Password is required')).toBeTruthy();
    });

    // Test invalid email format
    fireEvent.changeText(getByPlaceholderText('Email'), 'invalid-email');
    fireEvent.press(getByText('Sign In'));

    await waitFor(() => {
      expect(getByText('Invalid email format')).toBeTruthy();
    });
  });

  it('handles successful login', async () => {
    const { getByText, getByPlaceholderText } = render(
      <VendorAuthProvider>
        <VendorLoginScreen />
      </VendorAuthProvider>
    );

    // Fill form with valid credentials
    fireEvent.changeText(getByPlaceholderText('Email'), 'test@example.com');
    fireEvent.changeText(getByPlaceholderText('Password'), 'password123');
    
    // Submit form
    fireEvent.press(getByText('Sign In'));

    // Verify navigation
    const { useNavigation } = require('@react-navigation/native');
    await waitFor(() => {
      expect(useNavigation().navigate).toHaveBeenCalledWith('VendorDashboard');
    });
  });

  it('handles login failure', async () => {
    const { getByText, getByPlaceholderText } = render(
      <VendorAuthProvider>
        <VendorLoginScreen />
      </VendorAuthProvider>
    );

    const Toast = require('react-native-toast-message');

    // Fill form with invalid credentials
    fireEvent.changeText(getByPlaceholderText('Email'), 'test@example.com');
    fireEvent.changeText(getByPlaceholderText('Password'), 'wrong-password');
    
    // Submit form
    fireEvent.press(getByText('Sign In'));

    // Verify error toast
    await waitFor(() => {
      expect(Toast.show).toHaveBeenCalledWith({
        type: 'error',
        text1: 'Login Failed',
        text2: 'Invalid credentials',
      });
    });
  });

  it('navigates to registration screen', () => {
    const { getByText } = render(
      <VendorAuthProvider>
        <VendorLoginScreen />
      </VendorAuthProvider>
    );

    // Press register link
    fireEvent.press(getByText("Don't have an account? Register"));

    // Verify navigation
    const { useNavigation } = require('@react-navigation/native');
    expect(useNavigation().navigate).toHaveBeenCalledWith('VendorRegister');
  });
});