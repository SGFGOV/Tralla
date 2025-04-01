describe('Payment Integration', () => {
  beforeEach(() => {
    // Login as a test user
    cy.intercept('POST', '/api/auth/login', {
      statusCode: 200,
      body: {
        id: 1,
        email: 'test@example.com',
        displayName: 'Test User'
      }
    })
    
    cy.intercept('GET', '/api/user', {
      statusCode: 200,
      body: {
        id: 1,
        email: 'test@example.com',
        displayName: 'Test User'
      }
    })
    
    cy.login('test@example.com', 'password123')
  })

  describe('One-time Payment', () => {
    beforeEach(() => {
      // Mock Stripe payment intent creation
      cy.intercept('POST', '/api/payment/create-intent', {
        statusCode: 200,
        body: {
          clientSecret: 'pi_test_secret_client_123',
          amount: 1999,
          currency: 'usd'
        }
      }).as('createPaymentIntent')
      
      cy.visit('/checkout')
      cy.wait('@createPaymentIntent')
    })

    it('displays the checkout form', () => {
      cy.contains('Payment Information').should('be.visible')
      
      // Check for Stripe Elements
      cy.get('iframe[name^="__privateStripeFrame"]').should('be.visible')
      cy.get('button').contains(/submit|pay/i, { matchCase: false }).should('be.visible')
    })

    it('handles payment submission', () => {
      // This test is a bit tricky as Stripe Elements are in an iframe
      // We'll just check that the form can be submitted and the success handler is called
      
      // Mock the Stripe.js confirmPayment method
      cy.window().then(win => {
        // Create a stub for the stripe.confirmPayment method
        win.mockStripeConfirmPayment = cy.stub().resolves({ paymentIntent: { status: 'succeeded' } })
        win.mockStripeElements = {
          getElement: cy.stub().returns(true)
        }
        
        // Replace stripe.confirmPayment with our stub
        if (!win.stripe) win.stripe = {}
        win.stripe.confirmPayment = win.mockStripeConfirmPayment
        win.stripe.elements = win.mockStripeElements
      })

      // Submit the payment form
      cy.get('button').contains(/submit|pay/i, { matchCase: false }).click()
      
      // Verify our mock was called
      cy.window().then(win => {
        expect(win.mockStripeConfirmPayment).to.be.called
      })
      
      // Should show success message
      cy.contains('Payment successful').should('be.visible')
    })

    it('handles payment errors', () => {
      // Mock a failed payment
      cy.window().then(win => {
        win.mockStripeConfirmPayment = cy.stub().resolves({ 
          error: { message: 'Your card was declined' } 
        })
        win.mockStripeElements = {
          getElement: cy.stub().returns(true)
        }
        
        if (!win.stripe) win.stripe = {}
        win.stripe.confirmPayment = win.mockStripeConfirmPayment
        win.stripe.elements = win.mockStripeElements
      })

      // Submit the payment form
      cy.get('button').contains(/submit|pay/i, { matchCase: false }).click()
      
      // Verify our mock was called
      cy.window().then(win => {
        expect(win.mockStripeConfirmPayment).to.be.called
      })
      
      // Should show error message
      cy.contains('Your card was declined').should('be.visible')
    })
  })

  describe('Subscription', () => {
    beforeEach(() => {
      // Mock Stripe subscription setup
      cy.intercept('POST', '/api/payment/create-subscription', {
        statusCode: 200,
        body: {
          subscriptionId: 'sub_123',
          clientSecret: 'pi_sub_secret_client_123'
        }
      }).as('createSubscription')
      
      cy.visit('/subscribe')
      cy.wait('@createSubscription')
    })

    it('displays the subscription form', () => {
      cy.contains('Choose a Plan').should('be.visible')
      
      // Check for plan options
      cy.get('.plan-option').should('have.length.at.least', 1)
      
      // Check for Stripe Elements
      cy.get('iframe[name^="__privateStripeFrame"]').should('be.visible')
      cy.get('button').contains(/subscribe|start/i, { matchCase: false }).should('be.visible')
    })

    it('handles subscription submission', () => {
      // Similar to one-time payment, mock the Stripe.js confirmPayment method
      cy.window().then(win => {
        win.mockStripeConfirmPayment = cy.stub().resolves({ paymentIntent: { status: 'succeeded' } })
        win.mockStripeElements = {
          getElement: cy.stub().returns(true)
        }
        
        if (!win.stripe) win.stripe = {}
        win.stripe.confirmPayment = win.mockStripeConfirmPayment
        win.stripe.elements = win.mockStripeElements
      })

      // Select a plan if needed
      cy.get('.plan-option').first().click()
      
      // Submit the subscription form
      cy.get('button').contains(/subscribe|start/i, { matchCase: false }).click()
      
      // Verify our mock was called
      cy.window().then(win => {
        expect(win.mockStripeConfirmPayment).to.be.called
      })
      
      // Should show success message
      cy.contains('Subscription successful').should('be.visible')
    })
  })
})