describe('Forgot Password Functionality', () => {
  beforeEach(() => {
    cy.visit('/forgot-password');
  });

  it('displays the forgot password form', () => {
    // Verify page title and form elements
    cy.contains('Forgot Password').should('be.visible');
    cy.contains('Reset your password').should('be.visible');
    cy.get('input[type="email"]').should('be.visible');
    cy.get('button').contains('Send Reset Link').should('be.visible');
    cy.contains('Back to Login').should('be.visible');
  });

  it('shows validation errors for empty email', () => {
    // Submit with empty email
    cy.get('button').contains('Send Reset Link').click();
    
    // Verify validation error
    cy.contains('Email is required').should('be.visible');
  });

  it('shows validation errors for invalid email', () => {
    // Submit with invalid email
    cy.get('input[type="email"]').type('invalid-email');
    cy.get('button').contains('Send Reset Link').click();
    
    // Verify validation error
    cy.contains('Invalid email address').should('be.visible');
  });

  it('sends password reset request successfully', () => {
    // Mock successful request
    cy.intercept('POST', '/api/auth/request-otp', {
      statusCode: 200,
      body: {
        success: true,
        message: 'Password reset instructions sent to your email'
      }
    }).as('requestOtp');

    // Enter valid email and submit
    cy.get('input[type="email"]').type('test@example.com');
    cy.get('button').contains('Send Reset Link').click();
    
    // Wait for request
    cy.wait('@requestOtp');
    
    // Verify success message
    cy.contains('Password reset instructions sent to your email').should('be.visible');
    
    // Verify OTP input appears
    cy.get('.otp-input').should('be.visible');
  });

  it('handles unknown email error', () => {
    // Mock error response
    cy.intercept('POST', '/api/auth/request-otp', {
      statusCode: 404,
      body: {
        success: false,
        message: 'No account found with this email address'
      }
    }).as('requestOtp');

    // Enter unknown email and submit
    cy.get('input[type="email"]').type('unknown@example.com');
    cy.get('button').contains('Send Reset Link').click();
    
    // Wait for request
    cy.wait('@requestOtp');
    
    // Verify error message
    cy.contains('No account found with this email address').should('be.visible');
  });

  it('verifies OTP and shows password reset form', () => {
    // Mock OTP request
    cy.intercept('POST', '/api/auth/request-otp', {
      statusCode: 200,
      body: {
        success: true,
        message: 'Password reset instructions sent to your email'
      }
    }).as('requestOtp');

    // Mock OTP verification
    cy.intercept('POST', '/api/auth/verify-otp', {
      statusCode: 200,
      body: {
        success: true,
        resetToken: 'mock-reset-token'
      }
    }).as('verifyOtp');

    // Enter valid email and submit
    cy.get('input[type="email"]').type('test@example.com');
    cy.get('button').contains('Send Reset Link').click();
    
    // Wait for request
    cy.wait('@requestOtp');
    
    // Enter OTP code (this implementation might vary based on your OTP input component)
    cy.get('.otp-input').find('input').each(($input, index) => {
      cy.wrap($input).type(index.toString());
    });
    
    // Click verify button
    cy.get('button').contains('Verify Code').click();
    
    // Wait for verification
    cy.wait('@verifyOtp');
    
    // Verify password reset form appears
    cy.contains('Reset Your Password').should('be.visible');
    cy.get('input[type="password"]').should('have.length', 2);
    cy.get('button').contains('Reset Password').should('be.visible');
  });

  it('shows error for invalid OTP', () => {
    // Mock OTP request
    cy.intercept('POST', '/api/auth/request-otp', {
      statusCode: 200,
      body: {
        success: true,
        message: 'Password reset instructions sent to your email'
      }
    }).as('requestOtp');

    // Mock invalid OTP verification
    cy.intercept('POST', '/api/auth/verify-otp', {
      statusCode: 400,
      body: {
        success: false,
        error: 'Invalid OTP code'
      }
    }).as('verifyOtp');

    // Enter valid email and submit
    cy.get('input[type="email"]').type('test@example.com');
    cy.get('button').contains('Send Reset Link').click();
    
    // Wait for request
    cy.wait('@requestOtp');
    
    // Enter OTP code
    cy.get('.otp-input').find('input').each(($input) => {
      cy.wrap($input).type('1');
    });
    
    // Click verify button
    cy.get('button').contains('Verify Code').click();
    
    // Wait for verification
    cy.wait('@verifyOtp');
    
    // Verify error message
    cy.contains('Invalid OTP code').should('be.visible');
  });

  it('completes password reset successfully', () => {
    // Mock OTP request
    cy.intercept('POST', '/api/auth/request-otp', {
      statusCode: 200,
      body: {
        success: true,
        message: 'Password reset instructions sent to your email'
      }
    }).as('requestOtp');

    // Mock OTP verification
    cy.intercept('POST', '/api/auth/verify-otp', {
      statusCode: 200,
      body: {
        success: true,
        resetToken: 'mock-reset-token'
      }
    }).as('verifyOtp');

    // Mock password reset
    cy.intercept('POST', '/api/auth/reset-password', {
      statusCode: 200,
      body: {
        success: true,
        message: 'Password has been reset successfully'
      }
    }).as('resetPassword');

    // Enter valid email and submit
    cy.get('input[type="email"]').type('test@example.com');
    cy.get('button').contains('Send Reset Link').click();
    cy.wait('@requestOtp');
    
    // Enter OTP code
    cy.get('.otp-input').find('input').each(($input, index) => {
      cy.wrap($input).type(index.toString());
    });
    
    // Click verify button
    cy.get('button').contains('Verify Code').click();
    cy.wait('@verifyOtp');
    
    // Enter new password
    cy.get('input[type="password"]').first().type('NewPassword123');
    cy.get('input[type="password"]').last().type('NewPassword123');
    
    // Submit form
    cy.get('button').contains('Reset Password').click();
    
    // Wait for reset request
    cy.wait('@resetPassword');
    
    // Verify success message
    cy.contains('Password has been reset successfully').should('be.visible');
    
    // Should redirect to login page
    cy.url().should('include', '/login');
  });

  it('shows password mismatch error', () => {
    // Mock OTP request
    cy.intercept('POST', '/api/auth/request-otp', {
      statusCode: 200,
      body: {
        success: true,
        message: 'Password reset instructions sent to your email'
      }
    }).as('requestOtp');

    // Mock OTP verification
    cy.intercept('POST', '/api/auth/verify-otp', {
      statusCode: 200,
      body: {
        success: true,
        resetToken: 'mock-reset-token'
      }
    }).as('verifyOtp');

    // Enter valid email and submit
    cy.get('input[type="email"]').type('test@example.com');
    cy.get('button').contains('Send Reset Link').click();
    cy.wait('@requestOtp');
    
    // Enter OTP code
    cy.get('.otp-input').find('input').each(($input, index) => {
      cy.wrap($input).type(index.toString());
    });
    
    // Click verify button
    cy.get('button').contains('Verify Code').click();
    cy.wait('@verifyOtp');
    
    // Enter mismatched passwords
    cy.get('input[type="password"]').first().type('Password123');
    cy.get('input[type="password"]').last().type('DifferentPassword123');
    
    // Submit form
    cy.get('button').contains('Reset Password').click();
    
    // Verify error message
    cy.contains('Passwords do not match').should('be.visible');
  });

  it('navigates back to login page', () => {
    // Click back to login link
    cy.contains('Back to Login').click();
    
    // Verify redirect to login page
    cy.url().should('include', '/login');
  });

  it('handles server errors gracefully', () => {
    // Mock server error
    cy.intercept('POST', '/api/auth/request-otp', {
      statusCode: 500,
      body: {
        success: false,
        message: 'Server error, please try again later'
      }
    }).as('requestOtp');

    // Enter valid email and submit
    cy.get('input[type="email"]').type('test@example.com');
    cy.get('button').contains('Send Reset Link').click();
    
    // Wait for request
    cy.wait('@requestOtp');
    
    // Verify error message
    cy.contains('Server error, please try again later').should('be.visible');
  });
});