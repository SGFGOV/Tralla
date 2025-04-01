describe('Groups Functionality', () => {
  // Mock user data
  const currentUser = {
    id: 1,
    email: 'test@example.com',
    displayName: 'Test User'
  };

  // Mock groups data
  const mockGroups = [
    {
      id: 1,
      name: 'Travel Buddies',
      description: 'Group for planning our next trip',
      creatorId: 1,
      createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      icon: 'https://example.com/travel-icon.jpg',
      memberCount: 4,
      lastMessage: {
        content: 'Let\'s finalize our plan',
        timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
        senderName: 'Jane Doe'
      }
    },
    {
      id: 2,
      name: 'Foodies Club',
      description: 'Exploring new restaurants together',
      creatorId: 3,
      createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      icon: 'https://example.com/food-icon.jpg',
      memberCount: 8,
      lastMessage: {
        content: 'Anyone free for lunch tomorrow?',
        timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        senderName: 'John Smith'
      }
    }
  ];

  // Mock group members
  const mockGroupMembers = [
    {
      id: 101,
      userId: 1,
      groupId: 1,
      role: 'admin',
      joinedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      user: {
        id: 1,
        displayName: 'Test User',
        avatar: 'https://example.com/test-user.jpg',
        online: true
      }
    },
    {
      id: 102,
      userId: 2,
      groupId: 1,
      role: 'member',
      joinedAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
      user: {
        id: 2,
        displayName: 'Jane Doe',
        avatar: 'https://example.com/jane.jpg',
        online: true
      }
    },
    {
      id: 103,
      userId: 3,
      groupId: 1,
      role: 'member',
      joinedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      user: {
        id: 3,
        displayName: 'John Smith',
        avatar: 'https://example.com/john.jpg',
        online: false,
        lastActive: new Date(Date.now() - 1800000).toISOString()
      }
    },
    {
      id: 104,
      userId: 4,
      groupId: 1,
      role: 'member',
      joinedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      user: {
        id: 4,
        displayName: 'Alice Johnson',
        avatar: 'https://example.com/alice.jpg',
        online: true
      }
    }
  ];

  // Mock group messages
  const mockGroupMessages = [
    {
      id: 201,
      content: 'Hello everyone!',
      timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      senderId: 1,
      groupId: 1,
      sender: {
        id: 1,
        displayName: 'Test User',
        avatar: 'https://example.com/test-user.jpg'
      }
    },
    {
      id: 202,
      content: 'Hey there! Looking forward to our trip',
      timestamp: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
      senderId: 2,
      groupId: 1,
      sender: {
        id: 2,
        displayName: 'Jane Doe',
        avatar: 'https://example.com/jane.jpg'
      }
    },
    {
      id: 203,
      content: 'Has everyone booked their tickets?',
      timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      senderId: 3,
      groupId: 1,
      sender: {
        id: 3,
        displayName: 'John Smith',
        avatar: 'https://example.com/john.jpg'
      }
    },
    {
      id: 204,
      content: 'Let\'s finalize our plan',
      timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
      senderId: 2,
      groupId: 1,
      sender: {
        id: 2,
        displayName: 'Jane Doe',
        avatar: 'https://example.com/jane.jpg'
      }
    }
  ];

  // Mock group expenses
  const mockGroupExpenses = [
    {
      id: 301,
      name: 'Hotel Booking',
      amount: 1200,
      payerId: 1,
      date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      settled: false,
      payer: {
        id: 1,
        displayName: 'Test User'
      },
      participants: [
        {
          userId: 1,
          displayName: 'Test User',
          share: 300,
          paid: true
        },
        {
          userId: 2,
          displayName: 'Jane Doe',
          share: 300,
          paid: false
        },
        {
          userId: 3,
          displayName: 'John Smith',
          share: 300,
          paid: false
        },
        {
          userId: 4,
          displayName: 'Alice Johnson',
          share: 300,
          paid: false
        }
      ]
    },
    {
      id: 302,
      name: 'Dinner Reservation',
      amount: 240,
      payerId: 3,
      date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      settled: false,
      payer: {
        id: 3,
        displayName: 'John Smith'
      },
      participants: [
        {
          userId: 1,
          displayName: 'Test User',
          share: 60,
          paid: false
        },
        {
          userId: 2,
          displayName: 'Jane Doe',
          share: 60,
          paid: false
        },
        {
          userId: 3,
          displayName: 'John Smith',
          share: 60,
          paid: true
        },
        {
          userId: 4,
          displayName: 'Alice Johnson',
          share: 60,
          paid: true
        }
      ]
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

    // Mock groups list
    cy.intercept('GET', '/api/users/*/groups', {
      statusCode: 200,
      body: mockGroups
    }).as('getGroups');

    // Mock specific group details
    cy.intercept('GET', '/api/groups/1', {
      statusCode: 200,
      body: mockGroups[0]
    }).as('getGroupDetails');

    // Mock group members
    cy.intercept('GET', '/api/groups/*/members', {
      statusCode: 200,
      body: mockGroupMembers
    }).as('getGroupMembers');

    // Mock group messages
    cy.intercept('GET', '/api/groups/*/messages', {
      statusCode: 200,
      body: mockGroupMessages
    }).as('getGroupMessages');

    // Mock group expenses
    cy.intercept('GET', '/api/groups/*/expenses', {
      statusCode: 200,
      body: mockGroupExpenses
    }).as('getGroupExpenses');

    // Mock creating a group
    cy.intercept('POST', '/api/groups', (req) => {
      const newGroup = {
        id: 3,
        name: req.body.name,
        description: req.body.description,
        creatorId: currentUser.id,
        createdAt: new Date().toISOString(),
        icon: req.body.icon || null,
        memberCount: 1
      };
      req.reply({
        statusCode: 201,
        body: newGroup
      });
    }).as('createGroup');

    // Mock sending a group message
    cy.intercept('POST', '/api/groups/*/messages', (req) => {
      const newMessage = {
        id: 205,
        content: req.body.content,
        timestamp: new Date().toISOString(),
        senderId: currentUser.id,
        groupId: parseInt(req.url.split('/')[3]),
        sender: {
          id: currentUser.id,
          displayName: currentUser.displayName,
          avatar: 'https://example.com/test-user.jpg'
        }
      };
      req.reply({
        statusCode: 201,
        body: newMessage
      });
    }).as('sendGroupMessage');

    // Mock creating an expense
    cy.intercept('POST', '/api/expenses', (req) => {
      const newExpense = {
        id: 303,
        name: req.body.name,
        amount: req.body.amount,
        payerId: currentUser.id,
        date: new Date().toISOString(),
        groupId: req.body.groupId,
        settled: false,
        payer: {
          id: currentUser.id,
          displayName: currentUser.displayName
        },
        participants: req.body.participants
      };
      req.reply({
        statusCode: 201,
        body: newExpense
      });
    }).as('createExpense');

    // Login before each test
    cy.login('test@example.com', 'password123');
  });

  it('displays the groups list', () => {
    cy.visit('/groups');
    cy.wait('@getGroups');

    // Verify groups list elements
    cy.contains('Groups').should('be.visible');
    cy.get('[data-testid="group-list-item"]').should('have.length', 2);
    
    // Check first group details
    cy.get('[data-testid="group-list-item"]').first().within(() => {
      cy.contains('Travel Buddies').should('be.visible');
      cy.contains('Group for planning our next trip').should('be.visible');
      cy.contains('4 members').should('be.visible');
      cy.contains('Let\'s finalize our plan').should('be.visible');
    });
  });

  it('creates a new group', () => {
    cy.visit('/groups');
    cy.wait('@getGroups');

    // Click create group button
    cy.contains('Create Group').click();
    
    // Fill in group details
    cy.get('input[name="name"]').type('Weekend Hikers');
    cy.get('textarea[name="description"]').type('Planning weekend hiking trips');
    
    // Submit form
    cy.get('button').contains('Create').click();
    
    // Wait for group creation request
    cy.wait('@createGroup');
    
    // Should show success message
    cy.contains('Group created successfully').should('be.visible');
    
    // Should redirect to the group detail page
    cy.url().should('include', '/group/3');
  });

  it('navigates to group detail view', () => {
    cy.visit('/groups');
    cy.wait('@getGroups');

    // Click on a group
    cy.contains('Travel Buddies').click();
    
    // URL should change to group detail
    cy.url().should('include', '/group/1');
    
    // Wait for group details to load
    cy.wait('@getGroupDetails');
    cy.wait('@getGroupMembers');
    cy.wait('@getGroupMessages');
    
    // Verify group detail elements
    cy.contains('Travel Buddies').should('be.visible');
    cy.contains('Group for planning our next trip').should('be.visible');
    cy.contains('4 members').should('be.visible');
  });

  it('displays group messages correctly', () => {
    cy.visit('/group/1');
    cy.wait('@getGroupDetails');
    cy.wait('@getGroupMembers');
    cy.wait('@getGroupMessages');

    // Check messages tab is active or navigate to it
    cy.contains('Messages').click();
    
    // Check that messages are displayed correctly
    cy.get('[data-testid="group-message"]').should('have.length', 4);
    
    // Check message content
    cy.contains('Hello everyone!').should('be.visible');
    cy.contains('Let\'s finalize our plan').should('be.visible');
    
    // Check sender information
    cy.contains('Jane Doe').should('be.visible');
    cy.contains('John Smith').should('be.visible');
  });

  it('sends a new group message', () => {
    cy.visit('/group/1');
    cy.wait('@getGroupDetails');
    cy.wait('@getGroupMembers');
    cy.wait('@getGroupMessages');

    // Navigate to messages tab if needed
    cy.contains('Messages').click();
    
    // Type and send a message
    const newMessage = 'I\'m excited about our trip!';
    cy.get('textarea, input[type="text"]').type(newMessage);
    cy.get('button').contains(/send|🚀/i, { matchCase: false }).click();
    
    // Wait for the message to be sent
    cy.wait('@sendGroupMessage');
    
    // Verify the new message appears in the chat
    cy.contains(newMessage).should('be.visible');
  });

  it('displays group members correctly', () => {
    cy.visit('/group/1');
    cy.wait('@getGroupDetails');
    cy.wait('@getGroupMembers');
    cy.wait('@getGroupMessages');

    // Navigate to members tab
    cy.contains('Members').click();
    
    // Check that members are displayed correctly
    cy.get('[data-testid="group-member"]').should('have.length', 4);
    
    // Check member details
    cy.contains('Test User').should('be.visible').parent().contains('Admin').should('be.visible');
    cy.contains('Jane Doe').should('be.visible');
    cy.contains('John Smith').should('be.visible');
    cy.contains('Alice Johnson').should('be.visible');
  });

  it('invites a new member to the group', () => {
    // Mock searching for users
    cy.intercept('GET', '/api/users?search=*', {
      statusCode: 200,
      body: [
        {
          id: 5,
          displayName: 'Bob Wilson',
          email: 'bob@example.com',
          avatar: 'https://example.com/bob.jpg'
        }
      ]
    }).as('searchUsers');

    // Mock adding a member
    cy.intercept('POST', '/api/groups/*/members', {
      statusCode: 201,
      body: {
        id: 105,
        userId: 5,
        groupId: 1,
        role: 'member',
        joinedAt: new Date().toISOString(),
        user: {
          id: 5,
          displayName: 'Bob Wilson',
          avatar: 'https://example.com/bob.jpg',
          online: false
        }
      }
    }).as('addMember');

    cy.visit('/group/1');
    cy.wait('@getGroupDetails');
    cy.wait('@getGroupMembers');

    // Navigate to members tab
    cy.contains('Members').click();
    
    // Click invite member button
    cy.contains('Invite Member').click();
    
    // Search for a user
    cy.get('input[placeholder*="Search"]').type('Bob');
    cy.wait('@searchUsers');
    
    // Select the user from results
    cy.contains('Bob Wilson').click();
    
    // Confirm invitation
    cy.get('button').contains('Invite').click();
    
    // Wait for member addition request
    cy.wait('@addMember');
    
    // Should show success message
    cy.contains('Member invited successfully').should('be.visible');
    
    // New member should be visible in the list
    cy.contains('Bob Wilson').should('be.visible');
  });

  it('displays group expenses correctly', () => {
    cy.visit('/group/1');
    cy.wait('@getGroupDetails');
    cy.wait('@getGroupMembers');

    // Navigate to expenses tab
    cy.contains('Expenses').click();
    cy.wait('@getGroupExpenses');
    
    // Check that expenses are displayed correctly
    cy.get('[data-testid="expense-item"]').should('have.length', 2);
    
    // Check expense details
    cy.contains('Hotel Booking').should('be.visible');
    cy.contains('$1,200.00').should('be.visible');
    cy.contains('Paid by Test User').should('be.visible');
    
    cy.contains('Dinner Reservation').should('be.visible');
    cy.contains('$240.00').should('be.visible');
    cy.contains('Paid by John Smith').should('be.visible');
  });

  it('creates a new expense', () => {
    cy.visit('/group/1');
    cy.wait('@getGroupDetails');
    cy.wait('@getGroupMembers');

    // Navigate to expenses tab
    cy.contains('Expenses').click();
    cy.wait('@getGroupExpenses');
    
    // Click add expense button
    cy.contains('Add Expense').click();
    
    // Fill in expense details
    cy.get('input[name="name"]').type('Airport Taxi');
    cy.get('input[name="amount"]').type('50');
    
    // Select participants (all members should be selected by default)
    // Confirm participants are selected
    cy.get('[data-testid="expense-participant"]').should('have.length', 4);
    
    // Submit form
    cy.get('button').contains('Save Expense').click();
    
    // Wait for expense creation request
    cy.wait('@createExpense');
    
    // Should show success message
    cy.contains('Expense added successfully').should('be.visible');
    
    // New expense should be visible in the list
    cy.contains('Airport Taxi').should('be.visible');
    cy.contains('$50.00').should('be.visible');
  });

  it('marks an expense as settled', () => {
    // Mock updating an expense
    cy.intercept('PATCH', '/api/expenses/*', {
      statusCode: 200,
      body: {
        id: 301,
        settled: true
      }
    }).as('updateExpense');

    cy.visit('/group/1');
    cy.wait('@getGroupDetails');
    cy.wait('@getGroupMembers');

    // Navigate to expenses tab
    cy.contains('Expenses').click();
    cy.wait('@getGroupExpenses');
    
    // Click settle button on first expense
    cy.contains('Hotel Booking')
      .parents('[data-testid="expense-item"]')
      .contains('Settle')
      .click();
    
    // Confirm settlement
    cy.get('button').contains('Confirm').click();
    
    // Wait for expense update request
    cy.wait('@updateExpense');
    
    // Should show success message
    cy.contains('Expense marked as settled').should('be.visible');
    
    // Expense should be marked as settled
    cy.contains('Hotel Booking')
      .parents('[data-testid="expense-item"]')
      .contains('Settled')
      .should('be.visible');
  });
});