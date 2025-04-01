describe('Nearby People Functionality', () => {
  // Mock user data
  const currentUser = {
    id: 1,
    email: 'test@example.com',
    displayName: 'Test User',
    avatar: 'https://example.com/test-user.jpg',
    online: true
  };

  // Mock nearby users data
  const mockNearbyUsers = [
    {
      id: 2,
      displayName: 'Jane Doe',
      avatar: 'https://example.com/jane.jpg',
      distance: 15, // meters
      online: true,
      bio: 'Travel enthusiast and foodie',
      interests: ['Travel', 'Food', 'Music'],
      matchScore: 85, // percentage match based on interests
      lastSeen: null
    },
    {
      id: 3,
      displayName: 'John Smith',
      avatar: 'https://example.com/john.jpg',
      distance: 45, // meters
      online: false,
      lastSeen: new Date(Date.now() - 30 * 60 * 1000).toISOString(), // 30 minutes ago
      bio: 'Software developer and hiking enthusiast',
      interests: ['Technology', 'Hiking', 'Photography'],
      matchScore: 70
    },
    {
      id: 4,
      displayName: 'Alice Johnson',
      avatar: 'https://example.com/alice.jpg',
      distance: 120, // meters
      online: true,
      bio: 'Artist and yoga instructor',
      interests: ['Art', 'Yoga', 'Travel'],
      matchScore: 60
    }
  ];

  // Mock proximity settings
  const mockProximitySettings = {
    id: 1,
    userId: 1,
    radius: 500, // meters
    visible: true,
    shareLocation: true,
    notifyWhenNearby: true,
    autoConnect: false
  };

  // Mock facial recognition results
  const mockFaceRecognition = {
    identified: true,
    users: [
      {
        id: 2,
        displayName: 'Jane Doe',
        score: 0.95,
        profileImage: 'https://example.com/jane.jpg',
        distance: 15
      },
      {
        id: 3,
        displayName: 'John Smith',
        score: 0.88,
        profileImage: 'https://example.com/john.jpg',
        distance: 45
      }
    ]
  };

  beforeEach(() => {
    // Set up auth mocks
    cy.intercept('GET', '/api/user', {
      statusCode: 200,
      body: currentUser
    }).as('getUser');

    // Login
    cy.intercept('POST', '/api/auth/login', {
      statusCode: 200,
      body: currentUser
    });

    // Mock nearby users
    cy.intercept('GET', '/api/users/*/nearby', {
      statusCode: 200,
      body: mockNearbyUsers
    }).as('getNearbyUsers');

    // Mock proximity settings
    cy.intercept('GET', '/api/users/*/proximity-settings', {
      statusCode: 200,
      body: mockProximitySettings
    }).as('getProximitySettings');

    // Mock updating proximity settings
    cy.intercept('PATCH', '/api/users/*/proximity-settings', (req) => {
      const updatedSettings = {
        ...mockProximitySettings,
        ...req.body
      };
      req.reply({
        statusCode: 200,
        body: updatedSettings
      });
    }).as('updateProximitySettings');

    // Mock location update
    cy.intercept('POST', '/api/users/*/location', {
      statusCode: 200,
      body: {
        success: true
      }
    }).as('updateLocation');

    // Mock facial recognition
    cy.intercept('POST', '/api/facial-recognition/identify', {
      statusCode: 200,
      body: mockFaceRecognition
    }).as('faceIdentify');

    // Mock sending friend request
    cy.intercept('POST', '/api/friend-requests', (req) => {
      const newRequest = {
        userId: 1,
        friendId: req.body.friendId,
        status: 'pending',
        createdAt: new Date().toISOString()
      };
      req.reply({
        statusCode: 201,
        body: newRequest
      });
    }).as('sendFriendRequest');

    // Mock WebSocket for real-time updates
    cy.intercept('GET', '/ws', {
      statusCode: 101 // Switching protocols status
    }).as('websocket');

    // Login before each test
    cy.login('test@example.com', 'password123');
  });

  it('displays the nearby page with location-based results', () => {
    cy.visit('/nearby');
    cy.wait('@getNearbyUsers');
    cy.wait('@getProximitySettings');

    // Verify page elements
    cy.contains('People Nearby').should('be.visible');
    
    // Verify tabs for different view modes
    cy.contains('List View').should('be.visible');
    cy.contains('Map View').should('be.visible');
    cy.contains('Camera View').should('be.visible');
    
    // Default should be list view
    cy.get('[data-testid="nearby-list"]').should('be.visible');
    
    // Check nearby users are displayed
    cy.get('[data-testid="nearby-user-card"]').should('have.length', 3);
    
    // Check first user details
    cy.get('[data-testid="nearby-user-card"]').first().within(() => {
      cy.contains('Jane Doe').should('be.visible');
      cy.contains('15m away').should('be.visible');
      cy.contains('85% Match').should('be.visible');
      cy.get('.online-indicator').should('have.class', 'online');
    });
    
    // Check filter and sorting options
    cy.contains('Filter').should('be.visible');
    cy.contains('Sort By').should('be.visible');
  });

  it('filters nearby people by distance', () => {
    // Mock filtered results
    cy.intercept('GET', '/api/users/*/nearby?*', {
      statusCode: 200,
      body: mockNearbyUsers.filter(user => user.distance <= 50)
    }).as('filteredNearbyUsers');

    cy.visit('/nearby');
    cy.wait('@getNearbyUsers');
    
    // Open filter dialog
    cy.contains('Filter').click();
    
    // Set distance filter
    cy.get('input[type="range"][name="maxDistance"]').invoke('val', 50).trigger('change');
    
    // Apply filter
    cy.contains('Apply Filters').click();
    
    // Wait for filtered results
    cy.wait('@filteredNearbyUsers');
    
    // Should only show users within 50m
    cy.get('[data-testid="nearby-user-card"]').should('have.length', 2);
    cy.contains('Jane Doe').should('be.visible');
    cy.contains('John Smith').should('be.visible');
    cy.contains('Alice Johnson').should('not.exist');
  });

  it('sorts nearby people by distance', () => {
    cy.visit('/nearby');
    cy.wait('@getNearbyUsers');
    
    // Open sort options
    cy.contains('Sort By').click();
    
    // Select sort by distance
    cy.contains('Distance').click();
    
    // First user should be closest
    cy.get('[data-testid="nearby-user-card"]').first().should('contain', 'Jane Doe');
    cy.get('[data-testid="nearby-user-card"]').first().should('contain', '15m away');
    
    // Last user should be furthest
    cy.get('[data-testid="nearby-user-card"]').last().should('contain', 'Alice Johnson');
    cy.get('[data-testid="nearby-user-card"]').last().should('contain', '120m away');
  });

  it('sorts nearby people by match score', () => {
    cy.visit('/nearby');
    cy.wait('@getNearbyUsers');
    
    // Open sort options
    cy.contains('Sort By').click();
    
    // Select sort by match score
    cy.contains('Match Score').click();
    
    // First user should have highest match score
    cy.get('[data-testid="nearby-user-card"]').first().should('contain', 'Jane Doe');
    cy.get('[data-testid="nearby-user-card"]').first().should('contain', '85% Match');
    
    // Last user should have lowest match score
    cy.get('[data-testid="nearby-user-card"]').last().should('contain', 'Alice Johnson');
    cy.get('[data-testid="nearby-user-card"]').last().should('contain', '60% Match');
  });

  it('switches to map view', () => {
    cy.visit('/nearby');
    cy.wait('@getNearbyUsers');
    
    // Switch to map view
    cy.contains('Map View').click();
    
    // Map container should be visible
    cy.get('[data-testid="map-container"]').should('be.visible');
    
    // User markers should be visible on the map
    cy.get('[data-testid="user-marker"]').should('have.length', 3);
    
    // Current user marker should also be visible
    cy.get('[data-testid="current-user-marker"]').should('be.visible');
  });

  it('switches to camera view and shows facial recognition results', () => {
    cy.visit('/nearby');
    cy.wait('@getNearbyUsers');
    
    // Switch to camera view
    cy.contains('Camera View').click();
    
    // Camera container should be visible
    cy.get('video').should('be.visible');
    
    // Trigger facial recognition
    cy.wait('@faceIdentify');
    
    // Faces identified should be shown
    cy.get('[data-testid="recognized-face"]').should('have.length', 2);
    
    // Face cards should have user details
    cy.get('[data-testid="recognized-face"]').first().within(() => {
      cy.contains('Jane Doe').should('be.visible');
      cy.contains('15m away').should('be.visible');
    });
  });

  it('updates proximity settings', () => {
    cy.visit('/nearby');
    cy.wait('@getNearbyUsers');
    cy.wait('@getProximitySettings');
    
    // Open proximity settings
    cy.contains('Proximity Settings').click();
    
    // Change settings
    cy.get('input[name="radius"]').clear().type('250');
    cy.get('input[name="notifyWhenNearby"]').uncheck();
    cy.get('input[name="autoConnect"]').check();
    
    // Save settings
    cy.get('button').contains('Save Settings').click();
    
    // Wait for update request
    cy.wait('@updateProximitySettings');
    
    // Verify success message
    cy.contains('Proximity settings updated successfully').should('be.visible');
  });

  it('toggles visibility in nearby results', () => {
    cy.visit('/nearby');
    cy.wait('@getNearbyUsers');
    cy.wait('@getProximitySettings');
    
    // Open proximity settings
    cy.contains('Proximity Settings').click();
    
    // Toggle visibility
    cy.get('input[name="visible"]').uncheck();
    
    // Save settings
    cy.get('button').contains('Save Settings').click();
    
    // Wait for update request
    cy.wait('@updateProximitySettings');
    
    // Verify success message
    cy.contains('Proximity settings updated successfully').should('be.visible');
    
    // Status should show as invisible
    cy.contains('You are not visible to others nearby').should('be.visible');
  });

  it('sends a friend request from nearby list', () => {
    cy.visit('/nearby');
    cy.wait('@getNearbyUsers');
    
    // Click connect button on first user
    cy.get('[data-testid="nearby-user-card"]').first().contains('Connect').click();
    
    // Wait for request to be sent
    cy.wait('@sendFriendRequest');
    
    // Verify success message
    cy.contains('Friend request sent to Jane Doe').should('be.visible');
    
    // Connect button should change to "Request Sent"
    cy.get('[data-testid="nearby-user-card"]').first().contains('Request Sent').should('be.visible');
  });

  it('views profile details from nearby list', () => {
    // Mock user profile
    cy.intercept('GET', '/api/users/2', {
      statusCode: 200,
      body: {
        id: 2,
        displayName: 'Jane Doe',
        avatar: 'https://example.com/jane.jpg',
        bio: 'Travel enthusiast and foodie',
        interests: ['Travel', 'Food', 'Music'],
        online: true
      }
    }).as('getUserProfile');

    cy.visit('/nearby');
    cy.wait('@getNearbyUsers');
    
    // Click on user name or view profile button
    cy.get('[data-testid="nearby-user-card"]').first().contains('View Profile').click();
    
    // Wait for profile data to load
    cy.wait('@getUserProfile');
    
    // URL should change to profile view
    cy.url().should('include', '/profile/2');
    
    // Profile details should be visible
    cy.contains('Jane Doe').should('be.visible');
    cy.contains('Travel enthusiast and foodie').should('be.visible');
    
    // Interests should be visible
    cy.contains('Travel').should('be.visible');
    cy.contains('Food').should('be.visible');
    cy.contains('Music').should('be.visible');
  });

  it('sends a message from nearby list', () => {
    // Mock sending a message
    cy.intercept('POST', '/api/messages', {
      statusCode: 201,
      body: {
        id: 101,
        senderId: 1,
        receiverId: 2,
        content: 'Hello, noticed you\'re nearby!',
        timestamp: new Date().toISOString(),
        read: false
      }
    }).as('sendMessage');

    cy.visit('/nearby');
    cy.wait('@getNearbyUsers');
    
    // Click message button on first user
    cy.get('[data-testid="nearby-user-card"]').first().contains('Message').click();
    
    // URL should change to chat detail
    cy.url().should('include', '/chat/2');
    
    // Send a message
    cy.get('textarea, input[type="text"]').type('Hello, noticed you\'re nearby!');
    cy.get('button').contains(/send|🚀/i, { matchCase: false }).click();
    
    // Wait for message to be sent
    cy.wait('@sendMessage');
    
    // Message should appear in the chat
    cy.contains('Hello, noticed you\'re nearby!').should('be.visible');
  });

  it('refreshes location and nearby users', () => {
    // Mock location API
    cy.window().then((win) => {
      cy.stub(win.navigator.geolocation, 'getCurrentPosition').callsFake((success) => {
        return success({
          coords: {
            latitude: 12.9716,
            longitude: 77.5946,
            accuracy: 10
          }
        });
      });
    });

    cy.visit('/nearby');
    cy.wait('@getNearbyUsers');
    
    // Click refresh button
    cy.get('[data-testid="refresh-location"]').click();
    
    // Wait for location update
    cy.wait('@updateLocation');
    
    // Wait for new nearby users
    cy.wait('@getNearbyUsers');
    
    // Verify refresh success message
    cy.contains('Location updated').should('be.visible');
  });

  it('handles no nearby users state', () => {
    // Mock empty nearby users
    cy.intercept('GET', '/api/users/*/nearby', {
      statusCode: 200,
      body: []
    }).as('emptyNearbyUsers');

    cy.visit('/nearby');
    cy.wait('@emptyNearbyUsers');
    
    // Should show empty state message
    cy.contains('No one nearby right now').should('be.visible');
    cy.contains('Try increasing your search radius').should('be.visible');
  });

  it('handles location permission denied', () => {
    // Mock geolocation permission denied
    cy.window().then((win) => {
      cy.stub(win.navigator.geolocation, 'getCurrentPosition').callsFake((success, error) => {
        return error({
          code: 1, // Permission denied
          message: 'User denied the request for Geolocation'
        });
      });
    });

    cy.visit('/nearby');
    
    // Should show permission denied message
    cy.contains('Location permission denied').should('be.visible');
    cy.contains('Please enable location services to see people nearby').should('be.visible');
  });
});