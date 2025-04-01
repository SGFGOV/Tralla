describe('Profile Functionality', () => {
  // Mock user data
  const currentUser = {
    id: 1,
    email: 'test@example.com',
    phone: '+919876543210',
    displayName: 'Test User',
    avatar: 'https://example.com/test-user.jpg',
    bio: 'Software developer passionate about travel and photography',
    interests: ['Travel', 'Photography', 'Technology'],
    birthday: '1990-01-15T00:00:00.000Z',
    location: {
      latitude: 12.9716,
      longitude: 77.5946,
      address: 'Bangalore, India'
    },
    online: true,
    lastActive: new Date().toISOString(),
    createdAt: '2022-05-10T00:00:00.000Z'
  };

  // Mock privacy settings
  const mockPrivacySettings = {
    id: 1,
    userId: 1,
    showOnlineStatus: true,
    showLastActive: true,
    allowFriendRequests: true,
    allowProximityDiscovery: true,
    showBirthday: false,
    showEmail: false,
    showPhone: false,
    showFullName: true,
    messagesFromNonFriends: false
  };

  // Mock social media accounts
  const mockSocialAccounts = [
    {
      id: 1,
      userId: 1,
      platform: 'facebook',
      username: 'testuser',
      displayName: 'Test User',
      profileUrl: 'https://facebook.com/testuser',
      isVerified: true,
      isPublic: true
    },
    {
      id: 2,
      userId: 1,
      platform: 'instagram',
      username: 'test.user',
      displayName: 'Test User',
      profileUrl: 'https://instagram.com/test.user',
      isVerified: true,
      isPublic: true
    },
    {
      id: 3,
      userId: 1,
      platform: 'twitter',
      username: 'testuser',
      displayName: 'Test User',
      profileUrl: 'https://twitter.com/testuser',
      isVerified: false,
      isPublic: false
    }
  ];

  // Mock friends list
  const mockFriends = [
    {
      id: 2,
      displayName: 'Jane Doe',
      avatar: 'https://example.com/jane.jpg',
      online: true,
      relationshipStatus: 'friends',
      lastInteraction: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      interactionCount: 42
    },
    {
      id: 3,
      displayName: 'John Smith',
      avatar: 'https://example.com/john.jpg',
      online: false,
      lastActive: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
      relationshipStatus: 'friends',
      lastInteraction: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      interactionCount: 27
    },
    {
      id: 4,
      displayName: 'Alice Johnson',
      avatar: 'https://example.com/alice.jpg',
      online: false,
      lastActive: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      relationshipStatus: 'friends',
      lastInteraction: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
      interactionCount: 18
    }
  ];

  // Mock friend requests
  const mockFriendRequests = [
    {
      userId: 1,
      friendId: 5,
      status: 'pending',
      createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      user: {
        id: 5,
        displayName: 'Bob Wilson',
        avatar: 'https://example.com/bob.jpg',
        online: true
      }
    },
    {
      userId: 6,
      friendId: 1,
      status: 'pending',
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      user: {
        id: 6,
        displayName: 'Emily Davis',
        avatar: 'https://example.com/emily.jpg',
        online: false,
        lastActive: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString()
      }
    }
  ];

  // Mock language preferences
  const mockLanguagePreferences = {
    id: 1,
    userId: 1,
    primaryLanguage: 'en',
    secondaryLanguages: ['hi', 'te'],
    autoTranslate: true,
    autoDetectLanguage: true
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

    // Mock current user profile
    cy.intercept('GET', '/api/users/1', {
      statusCode: 200,
      body: currentUser
    }).as('getUserProfile');

    // Mock other user profile
    cy.intercept('GET', '/api/users/2', {
      statusCode: 200,
      body: {
        id: 2,
        displayName: 'Jane Doe',
        avatar: 'https://example.com/jane.jpg',
        bio: 'Travel enthusiast and foodie',
        interests: ['Travel', 'Food', 'Music'],
        online: true,
        lastActive: new Date().toISOString()
      }
    }).as('getOtherUserProfile');

    // Mock privacy settings
    cy.intercept('GET', '/api/users/*/privacy-settings', {
      statusCode: 200,
      body: mockPrivacySettings
    }).as('getPrivacySettings');

    // Mock social media accounts
    cy.intercept('GET', '/api/users/*/social-media-accounts', {
      statusCode: 200,
      body: mockSocialAccounts
    }).as('getSocialAccounts');

    // Mock friends list
    cy.intercept('GET', '/api/users/*/friends', {
      statusCode: 200,
      body: mockFriends
    }).as('getFriends');

    // Mock friend requests
    cy.intercept('GET', '/api/users/*/friend-requests', {
      statusCode: 200,
      body: mockFriendRequests
    }).as('getFriendRequests');

    // Mock language preferences
    cy.intercept('GET', '/api/users/*/language-preferences', {
      statusCode: 200,
      body: mockLanguagePreferences
    }).as('getLanguagePreferences');

    // Mock profile update
    cy.intercept('PATCH', '/api/users/*', (req) => {
      const updatedUser = {
        ...currentUser,
        ...req.body
      };
      req.reply({
        statusCode: 200,
        body: updatedUser
      });
    }).as('updateProfile');

    // Mock privacy settings update
    cy.intercept('PATCH', '/api/users/*/privacy-settings', (req) => {
      const updatedSettings = {
        ...mockPrivacySettings,
        ...req.body
      };
      req.reply({
        statusCode: 200,
        body: updatedSettings
      });
    }).as('updatePrivacySettings');

    // Mock social media account creation
    cy.intercept('POST', '/api/social-media-accounts', (req) => {
      const newAccount = {
        id: 4,
        userId: 1,
        platform: req.body.platform,
        username: req.body.username,
        displayName: req.body.displayName || currentUser.displayName,
        profileUrl: req.body.profileUrl,
        isVerified: false,
        isPublic: req.body.isPublic || false
      };
      req.reply({
        statusCode: 201,
        body: newAccount
      });
    }).as('createSocialAccount');

    // Mock language preferences update
    cy.intercept('PATCH', '/api/users/*/language-preferences', (req) => {
      const updatedPreferences = {
        ...mockLanguagePreferences,
        ...req.body
      };
      req.reply({
        statusCode: 200,
        body: updatedPreferences
      });
    }).as('updateLanguagePreferences');

    // Mock friend request send
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

    // Mock friend request response
    cy.intercept('PATCH', '/api/friend-requests/*/*/status', (req) => {
      req.reply({
        statusCode: 200,
        body: {
          status: req.body.status
        }
      });
    }).as('respondToFriendRequest');

    // Login before each test
    cy.login('test@example.com', 'password123');
  });

  it('displays the current user profile', () => {
    cy.visit('/profile');
    cy.wait('@getUserProfile');

    // Verify profile details
    cy.contains('Test User').should('be.visible');
    cy.get('img[alt="Test User"]').should('be.visible');
    cy.contains('Software developer passionate about travel and photography').should('be.visible');
    
    // Verify interests
    cy.contains('Travel').should('be.visible');
    cy.contains('Photography').should('be.visible');
    cy.contains('Technology').should('be.visible');
    
    // Verify edit button is shown for own profile
    cy.contains('Edit Profile').should('be.visible');
  });

  it('edits the user profile', () => {
    cy.visit('/profile');
    cy.wait('@getUserProfile');

    // Click edit profile
    cy.contains('Edit Profile').click();
    
    // Check that edit form is displayed
    cy.get('form').should('be.visible');
    
    // Edit display name
    cy.get('input[name="displayName"]').clear().type('Updated Test User');
    
    // Edit bio
    cy.get('textarea[name="bio"]').clear().type('Software developer, traveler, and amateur photographer');
    
    // Edit interests (might be implemented differently based on UI)
    // This example assumes a select component with available tags
    cy.get('select[name="interests"]').select(['Travel', 'Photography', 'Technology', 'Cooking']);
    
    // Submit form
    cy.get('button').contains('Save Changes').click();
    
    // Wait for update request
    cy.wait('@updateProfile');
    
    // Verify updated profile is displayed
    cy.contains('Updated Test User').should('be.visible');
    cy.contains('Software developer, traveler, and amateur photographer').should('be.visible');
    cy.contains('Cooking').should('be.visible');
  });

  it('updates privacy settings', () => {
    cy.visit('/profile');
    cy.wait('@getUserProfile');

    // Navigate to privacy settings
    cy.contains('Privacy Settings').click();
    cy.wait('@getPrivacySettings');
    
    // Verify initial settings
    cy.get('input[name="showOnlineStatus"]').should('be.checked');
    cy.get('input[name="showLastActive"]').should('be.checked');
    cy.get('input[name="showBirthday"]').should('not.be.checked');
    
    // Change settings
    cy.get('input[name="showOnlineStatus"]').uncheck();
    cy.get('input[name="showBirthday"]').check();
    
    // Save changes
    cy.get('button').contains('Save Privacy Settings').click();
    
    // Wait for update request
    cy.wait('@updatePrivacySettings');
    
    // Verify success message
    cy.contains('Privacy settings updated successfully').should('be.visible');
    
    // Verify settings are updated in the UI
    cy.get('input[name="showOnlineStatus"]').should('not.be.checked');
    cy.get('input[name="showBirthday"]').should('be.checked');
  });

  it('manages social media accounts', () => {
    cy.visit('/profile');
    cy.wait('@getUserProfile');

    // Navigate to social accounts
    cy.contains('Social Accounts').click();
    cy.wait('@getSocialAccounts');
    
    // Verify existing accounts
    cy.contains('Facebook').should('be.visible');
    cy.contains('Instagram').should('be.visible');
    cy.contains('Twitter').should('be.visible');
    
    // Add new account
    cy.contains('Add Social Account').click();
    
    // Fill form
    cy.get('select[name="platform"]').select('linkedin');
    cy.get('input[name="username"]').type('testuser');
    cy.get('input[name="profileUrl"]').type('https://linkedin.com/in/testuser');
    cy.get('input[name="isPublic"]').check();
    
    // Submit form
    cy.get('button').contains('Add Account').click();
    
    // Wait for creation request
    cy.wait('@createSocialAccount');
    
    // Verify success message
    cy.contains('Social account added successfully').should('be.visible');
    
    // New account should be visible
    cy.contains('LinkedIn').should('be.visible');
  });

  it('updates language preferences', () => {
    cy.visit('/profile');
    cy.wait('@getUserProfile');

    // Navigate to language preferences
    cy.contains('Language Preferences').click();
    cy.wait('@getLanguagePreferences');
    
    // Verify initial preferences
    cy.get('select[name="primaryLanguage"]').should('have.value', 'en');
    cy.get('input[name="autoTranslate"]').should('be.checked');
    
    // Change preferences
    cy.get('select[name="primaryLanguage"]').select('hi');
    cy.get('select[name="secondaryLanguages"]').select(['en', 'kn']);
    
    // Save changes
    cy.get('button').contains('Save Language Preferences').click();
    
    // Wait for update request
    cy.wait('@updateLanguagePreferences');
    
    // Verify success message
    cy.contains('Language preferences updated successfully').should('be.visible');
    
    // Verify preferences are updated in the UI
    cy.get('select[name="primaryLanguage"]').should('have.value', 'hi');
  });

  it('displays other user profile', () => {
    cy.visit('/profile/2');
    cy.wait('@getOtherUserProfile');

    // Verify profile details
    cy.contains('Jane Doe').should('be.visible');
    cy.get('img[alt="Jane Doe"]').should('be.visible');
    cy.contains('Travel enthusiast and foodie').should('be.visible');
    
    // Verify interests
    cy.contains('Travel').should('be.visible');
    cy.contains('Food').should('be.visible');
    cy.contains('Music').should('be.visible');
    
    // For other user's profile, connect button should be visible
    cy.contains('Connect').should('be.visible');
    
    // But edit button should not be visible
    cy.contains('Edit Profile').should('not.exist');
  });

  it('sends a friend request', () => {
    cy.visit('/profile/2');
    cy.wait('@getOtherUserProfile');

    // Click connect button
    cy.contains('Connect').click();
    
    // Wait for request to be sent
    cy.wait('@sendFriendRequest');
    
    // Verify success message
    cy.contains('Friend request sent').should('be.visible');
    
    // Connect button should change to "Request Sent"
    cy.contains('Request Sent').should('be.visible');
  });

  it('displays friends list', () => {
    cy.visit('/profile');
    cy.wait('@getUserProfile');

    // Navigate to friends
    cy.contains('Friends').click();
    cy.wait('@getFriends');
    
    // Verify friends list
    cy.get('[data-testid="friend-item"]').should('have.length', 3);
    
    // Check specific friends
    cy.contains('Jane Doe').should('be.visible');
    cy.contains('John Smith').should('be.visible');
    cy.contains('Alice Johnson').should('be.visible');
  });

  it('handles friend requests', () => {
    cy.visit('/profile');
    cy.wait('@getUserProfile');

    // Navigate to friend requests
    cy.contains('Friend Requests').click();
    cy.wait('@getFriendRequests');
    
    // Verify friend requests
    cy.contains('Bob Wilson wants to connect').should('be.visible');
    cy.contains('Emily Davis wants to connect').should('be.visible');
    
    // Accept a request
    cy.contains('Bob Wilson')
      .parents('[data-testid="friend-request-item"]')
      .contains('Accept')
      .click();
    
    // Wait for request response
    cy.wait('@respondToFriendRequest');
    
    // Verify success message
    cy.contains('Friend request accepted').should('be.visible');
    
    // Reject a request
    cy.contains('Emily Davis')
      .parents('[data-testid="friend-request-item"]')
      .contains('Decline')
      .click();
    
    // Wait for request response
    cy.wait('@respondToFriendRequest');
    
    // Verify success message
    cy.contains('Friend request declined').should('be.visible');
  });

  it('uploads a profile picture', () => {
    // Mock file upload
    cy.intercept('POST', '/api/users/*/avatar', {
      statusCode: 200,
      body: {
        avatar: 'https://example.com/new-avatar.jpg'
      }
    }).as('uploadAvatar');

    cy.visit('/profile');
    cy.wait('@getUserProfile');

    // Click on avatar or edit avatar button
    cy.get('[data-testid="avatar-edit"]').click();
    
    // Upload file (cypress can't directly interact with file inputs that are hidden)
    cy.get('input[type="file"]').selectFile('cypress/fixtures/avatar.jpg', { force: true });
    
    // Wait for upload request
    cy.wait('@uploadAvatar');
    
    // Verify success message
    cy.contains('Profile picture updated successfully').should('be.visible');
    
    // Avatar should be updated
    cy.get('img[alt="Test User"]').should('have.attr', 'src', 'https://example.com/new-avatar.jpg');
  });

  it('updates the user location', () => {
    // Mock location update
    cy.intercept('PATCH', '/api/users/*/location', {
      statusCode: 200,
      body: {
        latitude: 19.0760,
        longitude: 72.8777,
        address: 'Mumbai, India'
      }
    }).as('updateLocation');

    cy.visit('/profile');
    cy.wait('@getUserProfile');

    // Navigate to location settings
    cy.contains('Location Settings').click();
    
    // Update location manually
    cy.get('input[name="address"]').clear().type('Mumbai, India');
    
    // Submit location update
    cy.get('button').contains('Update Location').click();
    
    // Wait for location update request
    cy.wait('@updateLocation');
    
    // Verify success message
    cy.contains('Location updated successfully').should('be.visible');
    
    // Location should be updated
    cy.contains('Mumbai, India').should('be.visible');
  });

  it('changes the user password', () => {
    // Mock password update
    cy.intercept('POST', '/api/auth/change-password', {
      statusCode: 200,
      body: {
        success: true
      }
    }).as('changePassword');

    cy.visit('/profile');
    cy.wait('@getUserProfile');

    // Navigate to security settings
    cy.contains('Security').click();
    
    // Fill password form
    cy.get('input[name="currentPassword"]').type('password123');
    cy.get('input[name="newPassword"]').type('newPassword123');
    cy.get('input[name="confirmPassword"]').type('newPassword123');
    
    // Submit form
    cy.get('button').contains('Change Password').click();
    
    // Wait for password change request
    cy.wait('@changePassword');
    
    // Verify success message
    cy.contains('Password changed successfully').should('be.visible');
  });
});