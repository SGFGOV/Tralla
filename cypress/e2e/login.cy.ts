describe('Login Page', () => {
  beforeEach(() => {
    cy.visit('/login')
  })

  it('displays the login form', () => {
    cy.contains('Tralla').should('be.visible')
    cy.contains('Sign in to connect with people nearby').should('be.visible')
    cy.get('input[placeholder*="user@example.com"]').should('be.visible')
    cy.get('input[type="password"]').should('be.visible')
    cy.get('button').contains('Sign In').should('be.visible')
  })

  it('shows validation errors for empty fields', () => {
    cy.get('button').contains('Sign In').click()
    cy.contains('Email or phone number is required').should('be.visible')
    cy.contains('Password is required').should('be.visible')
  })

  it('handles invalid login credentials', () => {
    cy.intercept('POST', '/api/auth/login', {
      statusCode: 401,
      body: { message: 'Invalid credentials' }
    }).as('loginAttempt')

    cy.get('input[placeholder*="user@example.com"]').type('wrong@example.com')
    cy.get('input[type="password"]').type('wrongPassword')
    cy.get('button').contains('Sign In').click()

    cy.wait('@loginAttempt')
    cy.contains('Login Error').should('be.visible')
  })

  it('successfully logs in with valid credentials', () => {
    // Mock a successful login response
    cy.intercept('POST', '/api/auth/login', {
      statusCode: 200,
      body: {
        id: 1,
        email: 'test@example.com',
        displayName: 'Test User'
      }
    }).as('loginAttempt')

    // Also mock the user endpoint that might get called after login
    cy.intercept('GET', '/api/user', {
      statusCode: 200,
      body: {
        id: 1,
        email: 'test@example.com',
        displayName: 'Test User'
      }
    })

    cy.get('input[placeholder*="user@example.com"]').type('test@example.com')
    cy.get('input[type="password"]').type('password123')
    cy.get('button').contains('Sign In').click()

    cy.wait('@loginAttempt')
    cy.url().should('include', '/nearby')
  })

  it('navigates to the registration page', () => {
    cy.contains('Don\'t have an account? Register').click()
    cy.url().should('include', '/register')
  })

  it('can switch between password and OTP tabs', () => {
    // Click on the OTP tab
    cy.contains('OTP').click()
    cy.get('input[placeholder*="+91"]').should('be.visible')
    cy.get('button').contains('Send OTP').should('be.visible')

    // Switch back to password tab
    cy.contains('Password').click()
    cy.get('input[placeholder*="user@example.com"]').should('be.visible')
    cy.get('input[type="password"]').should('be.visible')
  })

  it('handles OTP flow correctly', () => {
    // Click on OTP tab
    cy.contains('OTP').click()

    // Mock OTP request
    cy.intercept('POST', '/api/auth/request-otp', {
      statusCode: 200,
      body: { success: true }
    }).as('otpRequest')

    // Enter phone and request OTP
    cy.get('input[placeholder*="+91"]').type('9876543210')
    cy.get('button').contains('Send OTP').click()

    cy.wait('@otpRequest')
    // Verify that OTP input is now shown
    cy.contains('We\'ve sent a verification code').should('be.visible')
    
    // Simulate entering OTP
    // This part might need adjustment based on how your OTP input is implemented
    cy.get('.otp-input').find('input').each(($input, index) => {
      cy.wrap($input).type(index.toString())
    })

    // Mock OTP verification
    cy.intercept('POST', '/api/auth/verify-otp', {
      statusCode: 200,
      body: {
        id: 1,
        email: 'test@example.com',
        displayName: 'Test User'
      }
    }).as('otpVerify')

    cy.get('button').contains('Verify & Login').click()
    cy.wait('@otpVerify')
    cy.url().should('include', '/nearby')
  })
})