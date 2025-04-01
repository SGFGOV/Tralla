describe('Facial Recognition', () => {
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
    
    // Setup mock response for facial recognition
    cy.intercept('POST', '/api/facial-recognition/identify', {
      statusCode: 200,
      body: {
        identified: true,
        users: [
          {
            id: 2,
            displayName: 'Jane Doe',
            score: 0.95,
            profileImage: 'https://example.com/jane.jpg'
          },
          {
            id: 3,
            displayName: 'John Smith',
            score: 0.88,
            profileImage: 'https://example.com/john.jpg'
          }
        ]
      }
    }).as('faceIdentify')
    
    // Visit the nearby page which should have the facial recognition feature
    cy.visit('/nearby')
  })

  it('should display the camera feed', () => {
    // Check that the video element for camera feed is visible
    cy.get('video').should('be.visible')
    cy.contains('Nearby People').should('be.visible')
  })

  it('should identify people in the camera feed', () => {
    // Simulate a face detection by triggering the face identify API
    // This might need to be adjusted based on how your app triggers facial recognition
    cy.wait('@faceIdentify')
    
    // Check that identified users are displayed
    cy.contains('Jane Doe').should('be.visible')
    cy.contains('John Smith').should('be.visible')
  })

  it('should display profile cards for identified people', () => {
    cy.wait('@faceIdentify')
    
    // Check that profile cards have the right elements
    cy.get('.profile-card').should('have.length', 2)
    
    cy.get('.profile-card').first().within(() => {
      cy.contains('Jane Doe').should('be.visible')
      cy.get('img').should('have.attr', 'src', 'https://example.com/jane.jpg')
      cy.get('button').contains('Connect').should('be.visible')
    })
  })

  it('should allow swiping through identified profiles', () => {
    cy.wait('@faceIdentify')
    
    // Prepare a stub for the swipe action
    // This depends on how your swipe functionality is implemented
    cy.window().then((win) => {
      cy.stub(win, 'nextProfile').as('nextProfileStub')
      cy.stub(win, 'previousProfile').as('previousProfileStub')
    })
    
    // Simulate swipe right
    cy.get('.profile-card').first().trigger('touchstart', { touches: [{ clientX: 100, clientY: 150 }] })
      .trigger('touchmove', { touches: [{ clientX: 300, clientY: 150 }] })
      .trigger('touchend')
    
    cy.get('@nextProfileStub').should('have.been.called')
    
    // Simulate swipe left
    cy.get('.profile-card').first().trigger('touchstart', { touches: [{ clientX: 300, clientY: 150 }] })
      .trigger('touchmove', { touches: [{ clientX: 100, clientY: 150 }] })
      .trigger('touchend')
    
    cy.get('@previousProfileStub').should('have.been.called')
  })

  it('should handle no faces detected', () => {
    // Override the mock to return no users
    cy.intercept('POST', '/api/facial-recognition/identify', {
      statusCode: 200,
      body: {
        identified: false,
        users: []
      }
    }).as('noFacesIdentify')
    
    // Refresh the page to trigger the new mock
    cy.reload()
    cy.wait('@noFacesIdentify')
    
    // Check that an appropriate message is displayed
    cy.contains('No people detected nearby').should('be.visible')
  })

  it('should handle errors in facial recognition', () => {
    // Override the mock to return an error
    cy.intercept('POST', '/api/facial-recognition/identify', {
      statusCode: 500,
      body: {
        message: 'Server error processing facial recognition'
      }
    }).as('faceIdentifyError')
    
    // Refresh the page to trigger the new mock
    cy.reload()
    cy.wait('@faceIdentifyError')
    
    // Check that an error message is displayed
    cy.contains('Error identifying nearby people').should('be.visible')
  })
})