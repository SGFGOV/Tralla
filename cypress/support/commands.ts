// ***********************************************
// This example commands.js shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************

// Custom command to login
Cypress.Commands.add('login', (email: string, password: string) => {
  cy.visit('/login')
  cy.get('input[placeholder*="user@example.com"]').type(email)
  cy.get('input[type="password"]').type(password)
  cy.get('button').contains('Sign In').click()
})

// Custom command to register a new user
Cypress.Commands.add('register', (displayName: string, email: string, password: string) => {
  cy.visit('/register')
  cy.get('input[placeholder*="Display Name"]').type(displayName)
  cy.get('input[placeholder*="Email"]').type(email)
  cy.get('input[type="password"]').eq(0).type(password)
  cy.get('input[type="password"]').eq(1).type(password)
  cy.get('button').contains('Sign Up').click()
})

// Custom command to check if user is logged in (e.g. by checking for certain elements on the dashboard)
Cypress.Commands.add('shouldBeLoggedIn', () => {
  cy.url().should('include', '/nearby')
  // Add more assertions here based on elements that should be visible when logged in
})

declare global {
  namespace Cypress {
    interface Chainable {
      login(email: string, password: string): Chainable<void>
      register(displayName: string, email: string, password: string): Chainable<void>
      shouldBeLoggedIn(): Chainable<void>
    }
  }
}

export {}  // Makes this a module