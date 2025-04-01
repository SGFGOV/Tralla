describe('Registration Page', () => {
  beforeEach(() => {
    cy.visit('/register')
  })

  it('displays the registration form', () => {
    cy.contains('Tralla').should('be.visible')
    cy.contains('Create an account to connect').should('be.visible')
    cy.get('input[placeholder*="Your Display Name"]').should('be.visible')
    cy.get('input[placeholder*="user@example.com"]').should('be.visible')
    cy.get('input[type="password"]').should('have.length', 2)
    cy.get('button').contains('Sign Up').should('be.visible')
  })

  it('shows validation errors for empty fields', () => {
    cy.get('button').contains('Sign Up').click()
    cy.contains('Display name is required').should('be.visible')
    cy.contains('Email is required').should('be.visible')
    cy.contains('Password is required').should('be.visible')
  })

  it('shows validation error for mismatched passwords', () => {
    cy.get('input[placeholder*="Your Display Name"]').type('Test User')
    cy.get('input[placeholder*="user@example.com"]').type('test@example.com')
    cy.get('input[type="password"]').eq(0).type('password123')
    cy.get('input[type="password"]').eq(1).type('different')
    cy.get('button').contains('Sign Up').click()

    cy.contains('Passwords do not match').should('be.visible')
  })

  it('shows validation error for invalid email', () => {
    cy.get('input[placeholder*="Your Display Name"]').type('Test User')
    cy.get('input[placeholder*="user@example.com"]').type('invalid-email')
    cy.get('input[type="password"]').eq(0).type('password123')
    cy.get('input[type="password"]').eq(1).type('password123')
    cy.get('button').contains('Sign Up').click()

    cy.contains('Must be a valid email').should('be.visible')
  })

  it('handles when email is already taken', () => {
    // Mock a failed registration due to duplicate email
    cy.intercept('POST', '/api/auth/register', {
      statusCode: 400,
      body: { message: 'Email already in use' }
    }).as('registerAttempt')

    cy.get('input[placeholder*="Your Display Name"]').type('Test User')
    cy.get('input[placeholder*="user@example.com"]').type('existing@example.com')
    cy.get('input[type="password"]').eq(0).type('password123')
    cy.get('input[type="password"]').eq(1).type('password123')
    cy.get('button').contains('Sign Up').click()

    cy.wait('@registerAttempt')
    cy.contains('Email already in use').should('be.visible')
  })

  it('successfully registers a new user', () => {
    // Mock a successful registration
    cy.intercept('POST', '/api/auth/register', {
      statusCode: 201,
      body: {
        id: 1,
        email: 'new@example.com',
        displayName: 'New User'
      }
    }).as('registerAttempt')

    cy.get('input[placeholder*="Your Display Name"]').type('New User')
    cy.get('input[placeholder*="user@example.com"]').type('new@example.com')
    cy.get('input[type="password"]').eq(0).type('password123')
    cy.get('input[type="password"]').eq(1).type('password123')
    cy.get('button').contains('Sign Up').click()

    cy.wait('@registerAttempt')
    cy.url().should('include', '/nearby')
  })

  it('can toggle password visibility', () => {
    // Find the password field and its toggle button
    cy.get('input[type="password"]').eq(0).as('passwordField')
    cy.get('@passwordField').next().find('button').as('toggleButton')
    
    // Initially the password should be hidden
    cy.get('@passwordField').should('have.attr', 'type', 'password')
    
    // Click the toggle and password should be visible
    cy.get('@toggleButton').click()
    cy.get('@passwordField').should('have.attr', 'type', 'text')
    
    // Click again and password should be hidden
    cy.get('@toggleButton').click()
    cy.get('@passwordField').should('have.attr', 'type', 'password')
  })

  it('navigates to the login page', () => {
    cy.contains('Already have an account? Sign in').click()
    cy.url().should('include', '/login')
  })
})