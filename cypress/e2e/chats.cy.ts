describe('Chats Functionality', () => {
  // Mock user data
  const currentUser = {
    id: 1,
    email: 'test@example.com',
    displayName: 'Test User'
  };

  // Mock chat data
  const mockChats = [
    {
      id: 1,
      userId: 2,
      lastMessage: {
        id: 101,
        content: 'Hey, how are you?',
        timestamp: new Date().toISOString(),
        read: true,
        senderId: 2
      },
      unreadCount: 0,
      user: {
        id: 2,
        displayName: 'Jane Doe',
        avatar: 'https://example.com/jane.jpg',
        online: true
      }
    },
    {
      id: 2,
      userId: 3,
      lastMessage: {
        id: 102,
        content: 'Are you coming to the event?',
        timestamp: new Date(Date.now() - 3600000).toISOString(),
        read: false,
        senderId: 3
      },
      unreadCount: 2,
      user: {
        id: 3,
        displayName: 'John Smith',
        avatar: 'https://example.com/john.jpg',
        online: false,
        lastActive: new Date(Date.now() - 1800000).toISOString()
      }
    }
  ];

  // Mock messages for a specific chat
  const mockMessages = [
    {
      id: 201,
      content: 'Hello there!',
      timestamp: new Date(Date.now() - 7200000).toISOString(),
      senderId: 1,
      receiverId: 2,
      read: true
    },
    {
      id: 202,
      content: 'Hi! How are you doing?',
      timestamp: new Date(Date.now() - 7000000).toISOString(),
      senderId: 2,
      receiverId: 1,
      read: true
    },
    {
      id: 203,
      content: 'I\'m good, thanks for asking!',
      timestamp: new Date(Date.now() - 6800000).toISOString(),
      senderId: 1,
      receiverId: 2,
      read: true
    },
    {
      id: 204,
      content: 'Hey, how are you?',
      timestamp: new Date(Date.now() - 100000).toISOString(),
      senderId: 2,
      receiverId: 1,
      read: true
    }
  ];

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

    // Mock chats list
    cy.intercept('GET', '/api/users/*/chats', {
      statusCode: 200,
      body: mockChats
    }).as('getChats');

    // Mock specific chat messages
    cy.intercept('GET', '/api/messages/*/2', {
      statusCode: 200,
      body: mockMessages
    }).as('getChatMessages');

    // Mock sending a message
    cy.intercept('POST', '/api/messages', (req) => {
      const newMessage = {
        id: 205,
        content: req.body.content,
        timestamp: new Date().toISOString(),
        senderId: currentUser.id,
        receiverId: req.body.receiverId,
        read: false
      };
      req.reply({
        statusCode: 201,
        body: newMessage
      });
    }).as('sendMessage');

    // Login before each test
    cy.login('test@example.com', 'password123');
  });

  it('displays the chats list', () => {
    cy.visit('/chats');
    cy.wait('@getChats');

    // Verify chat list elements
    cy.contains('Messages').should('be.visible');
    cy.get('[data-testid="chat-list-item"]').should('have.length', 2);
    
    // Check first chat details
    cy.get('[data-testid="chat-list-item"]').first().within(() => {
      cy.contains('Jane Doe').should('be.visible');
      cy.contains('Hey, how are you?').should('be.visible');
      cy.get('.online-indicator').should('have.class', 'online');
    });
    
    // Check second chat details with unread messages
    cy.get('[data-testid="chat-list-item"]').eq(1).within(() => {
      cy.contains('John Smith').should('be.visible');
      cy.contains('Are you coming to the event?').should('be.visible');
      cy.get('.unread-badge').should('contain', '2');
    });
  });

  it('filters chats by search term', () => {
    cy.visit('/chats');
    cy.wait('@getChats');

    // Type in search field
    cy.get('input[placeholder*="Search"]').type('Jane');
    
    // Should only show chats with Jane
    cy.get('[data-testid="chat-list-item"]').should('have.length', 1);
    cy.contains('Jane Doe').should('be.visible');
    cy.contains('John Smith').should('not.exist');
    
    // Clear search and all chats should appear
    cy.get('input[placeholder*="Search"]').clear();
    cy.get('[data-testid="chat-list-item"]').should('have.length', 2);
  });

  it('navigates to chat detail view', () => {
    cy.visit('/chats');
    cy.wait('@getChats');

    // Click on a chat
    cy.contains('Jane Doe').click();
    
    // URL should change to chat detail
    cy.url().should('include', '/chat/');
    
    // Wait for messages to load
    cy.wait('@getChatMessages');
    
    // Verify chat detail elements
    cy.contains('Jane Doe').should('be.visible');
    cy.get('[data-testid="message-bubble"]').should('have.length.at.least', 4);
    cy.get('textarea, input[type="text"]').should('be.visible');
    cy.get('button').contains(/send|🚀/i, { matchCase: false }).should('be.visible');
  });

  it('displays messages in chat detail correctly', () => {
    cy.visit('/chat/2'); // Visit Jane's chat directly
    cy.wait('@getChatMessages');

    // Check that messages are displayed and formatted correctly
    cy.get('[data-testid="message-bubble"].outgoing').should('have.length', 2);
    cy.get('[data-testid="message-bubble"].incoming').should('have.length', 2);
    
    // Check message content
    cy.contains('Hello there!').should('be.visible');
    cy.contains('Hi! How are you doing?').should('be.visible');
    
    // Check timestamp formatting
    cy.get('[data-testid="message-timestamp"]').should('have.length.at.least', 4);
  });

  it('sends a new message', () => {
    cy.visit('/chat/2');
    cy.wait('@getChatMessages');

    // Type and send a message
    const newMessage = 'This is a test message';
    cy.get('textarea, input[type="text"]').type(newMessage);
    cy.get('button').contains(/send|🚀/i, { matchCase: false }).click();
    
    // Wait for the message to be sent
    cy.wait('@sendMessage');
    
    // Verify the new message appears in the chat
    cy.contains(newMessage).should('be.visible');
    cy.get('[data-testid="message-bubble"].outgoing').should('have.length', 3);
  });

  it('shows virtual interaction buttons', () => {
    cy.visit('/chat/2');
    cy.wait('@getChatMessages');

    // Check for virtual interaction buttons
    cy.get('[data-testid="virtual-interaction-buttons"]').should('be.visible');
    cy.contains('Virtual Hug').should('be.visible');
    cy.contains('Virtual Kiss').should('be.visible');
  });

  it('sends a virtual interaction', () => {
    // Mock sending a virtual interaction
    cy.intercept('POST', '/api/messages', (req) => {
      if (req.body.type === 'virtual_hug') {
        const newInteraction = {
          id: 206,
          type: 'virtual_hug',
          content: '',
          timestamp: new Date().toISOString(),
          senderId: currentUser.id,
          receiverId: req.body.receiverId,
          read: false
        };
        req.reply({
          statusCode: 201,
          body: newInteraction
        });
      }
    }).as('sendInteraction');

    cy.visit('/chat/2');
    cy.wait('@getChatMessages');

    // Click on virtual hug button
    cy.contains('Virtual Hug').click();
    
    // Wait for the interaction to be sent
    cy.wait('@sendInteraction');
    
    // Verify the interaction appears in the chat
    cy.contains('You sent a Virtual Hug').should('be.visible');
    // Or check for a specific icon or element representing the hug
    cy.get('[data-testid="virtual-hug-icon"]').should('be.visible');
  });
});