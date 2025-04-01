describe('Trips Functionality', () => {
  // Mock user data
  const currentUser = {
    id: 1,
    email: 'test@example.com',
    displayName: 'Test User'
  };

  // Mock trips data
  const mockTrips = [
    {
      id: 1,
      name: 'Goa Beach Vacation',
      description: 'A weekend getaway to the beautiful beaches of Goa',
      startDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
      endDate: new Date(Date.now() + 18 * 24 * 60 * 60 * 1000).toISOString(),
      location: 'Goa, India',
      creatorId: 1,
      createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      participants: [
        {
          id: 1,
          displayName: 'Test User',
          avatar: 'https://example.com/test-user.jpg'
        },
        {
          id: 2,
          displayName: 'Jane Doe',
          avatar: 'https://example.com/jane.jpg'
        },
        {
          id: 3,
          displayName: 'John Smith',
          avatar: 'https://example.com/john.jpg'
        }
      ],
      coverImage: 'https://example.com/goa.jpg',
      status: 'upcoming'
    },
    {
      id: 2,
      name: 'Manali Trek',
      description: 'Adventurous trek in the Himalayan mountains',
      startDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString(),
      endDate: new Date(Date.now() + 52 * 24 * 60 * 60 * 1000).toISOString(),
      location: 'Manali, Himachal Pradesh',
      creatorId: 3,
      createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
      participants: [
        {
          id: 1,
          displayName: 'Test User',
          avatar: 'https://example.com/test-user.jpg'
        },
        {
          id: 3,
          displayName: 'John Smith',
          avatar: 'https://example.com/john.jpg'
        },
        {
          id: 4,
          displayName: 'Alice Johnson',
          avatar: 'https://example.com/alice.jpg'
        }
      ],
      coverImage: 'https://example.com/manali.jpg',
      status: 'upcoming'
    }
  ];

  // Mock trip activities
  const mockTripActivities = [
    {
      id: 101,
      name: 'Beach Day at Calangute',
      description: 'Day at the most popular beach in Goa',
      date: new Date(Date.now() + 16 * 24 * 60 * 60 * 1000).toISOString(),
      location: 'Calangute Beach, Goa',
      tripId: 1,
      creatorId: 1,
      participants: [
        {
          userId: 1,
          status: 'going'
        },
        {
          userId: 2,
          status: 'going'
        },
        {
          userId: 3,
          status: 'maybe'
        }
      ]
    },
    {
      id: 102,
      name: 'Water Sports at Baga',
      description: 'Parasailing and jet skiing adventure',
      date: new Date(Date.now() + 17 * 24 * 60 * 60 * 1000).toISOString(),
      location: 'Baga Beach, Goa',
      tripId: 1,
      creatorId: 2,
      participants: [
        {
          userId: 1,
          status: 'going'
        },
        {
          userId: 2,
          status: 'going'
        },
        {
          userId: 3,
          status: 'going'
        }
      ]
    }
  ];

  // Mock trip expenses
  const mockTripExpenses = [
    {
      id: 201,
      name: 'Hotel Booking',
      amount: 15000,
      currency: 'INR',
      payerId: 1,
      date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      tripId: 1,
      settled: false,
      payer: {
        id: 1,
        displayName: 'Test User'
      },
      participants: [
        {
          userId: 1,
          displayName: 'Test User',
          share: 5000,
          paid: true
        },
        {
          userId: 2,
          displayName: 'Jane Doe',
          share: 5000,
          paid: false
        },
        {
          userId: 3,
          displayName: 'John Smith',
          share: 5000,
          paid: false
        }
      ]
    },
    {
      id: 202,
      name: 'Flight Tickets',
      amount: 24000,
      currency: 'INR',
      payerId: 3,
      date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
      tripId: 1,
      settled: true,
      payer: {
        id: 3,
        displayName: 'John Smith'
      },
      participants: [
        {
          userId: 1,
          displayName: 'Test User',
          share: 8000,
          paid: true
        },
        {
          userId: 2,
          displayName: 'Jane Doe',
          share: 8000,
          paid: true
        },
        {
          userId: 3,
          displayName: 'John Smith',
          share: 8000,
          paid: true
        }
      ]
    }
  ];

  // Mock trip tasks
  const mockTripTasks = [
    {
      id: 301,
      title: 'Pack Sunscreen',
      description: 'Don\'t forget to pack sunscreen for the beach',
      dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
      tripId: 1,
      assigneeId: 1,
      creatorId: 1,
      status: 'pending',
      priority: 'high',
      assignee: {
        id: 1,
        displayName: 'Test User'
      }
    },
    {
      id: 302,
      title: 'Confirm Hotel Reservation',
      description: 'Call hotel to confirm our reservation',
      dueDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
      tripId: 1,
      assigneeId: 2,
      creatorId: 1,
      status: 'completed',
      priority: 'medium',
      assignee: {
        id: 2,
        displayName: 'Jane Doe'
      }
    },
    {
      id: 303,
      title: 'Rent Car',
      description: 'Book a car for local travel',
      dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
      tripId: 1,
      assigneeId: 3,
      creatorId: 1,
      status: 'pending',
      priority: 'medium',
      assignee: {
        id: 3,
        displayName: 'John Smith'
      }
    }
  ];

  // Mock packing list
  const mockPackingItems = [
    {
      id: 401,
      name: 'Clothes',
      tripId: 1,
      items: [
        { id: 4011, name: 'T-shirts', checked: true, assigneeId: null },
        { id: 4012, name: 'Shorts', checked: true, assigneeId: null },
        { id: 4013, name: 'Swimwear', checked: false, assigneeId: null },
        { id: 4014, name: 'Sandals', checked: false, assigneeId: null }
      ]
    },
    {
      id: 402,
      name: 'Toiletries',
      tripId: 1,
      items: [
        { id: 4021, name: 'Toothbrush', checked: true, assigneeId: null },
        { id: 4022, name: 'Toothpaste', checked: true, assigneeId: null },
        { id: 4023, name: 'Shampoo', checked: false, assigneeId: null },
        { id: 4024, name: 'Soap', checked: false, assigneeId: null }
      ]
    },
    {
      id: 403,
      name: 'Electronics',
      tripId: 1,
      items: [
        { id: 4031, name: 'Phone Charger', checked: true, assigneeId: null },
        { id: 4032, name: 'Camera', checked: false, assigneeId: null },
        { id: 4033, name: 'Power Bank', checked: false, assigneeId: null }
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

    // Mock trips list
    cy.intercept('GET', '/api/users/*/trips', {
      statusCode: 200,
      body: mockTrips
    }).as('getTrips');

    // Mock specific trip details
    cy.intercept('GET', '/api/trips/1', {
      statusCode: 200,
      body: mockTrips[0]
    }).as('getTripDetails');

    // Mock trip activities
    cy.intercept('GET', '/api/trips/*/activities', {
      statusCode: 200,
      body: mockTripActivities
    }).as('getTripActivities');

    // Mock trip expenses
    cy.intercept('GET', '/api/trips/*/expenses', {
      statusCode: 200,
      body: mockTripExpenses
    }).as('getTripExpenses');

    // Mock trip tasks
    cy.intercept('GET', '/api/trips/*/tasks', {
      statusCode: 200,
      body: mockTripTasks
    }).as('getTripTasks');

    // Mock trip packing list
    cy.intercept('GET', '/api/trips/*/packing-list', {
      statusCode: 200,
      body: mockPackingItems
    }).as('getTripPackingList');

    // Mock creating a trip
    cy.intercept('POST', '/api/trips', (req) => {
      const newTrip = {
        id: 3,
        name: req.body.name,
        description: req.body.description,
        startDate: req.body.startDate,
        endDate: req.body.endDate,
        location: req.body.location,
        creatorId: currentUser.id,
        createdAt: new Date().toISOString(),
        participants: [
          {
            id: currentUser.id,
            displayName: currentUser.displayName,
            avatar: 'https://example.com/test-user.jpg'
          }
        ],
        status: 'upcoming'
      };
      req.reply({
        statusCode: 201,
        body: newTrip
      });
    }).as('createTrip');

    // Mock creating a trip activity
    cy.intercept('POST', '/api/activities', (req) => {
      const newActivity = {
        id: 103,
        name: req.body.name,
        description: req.body.description,
        date: req.body.date,
        location: req.body.location,
        tripId: req.body.tripId,
        creatorId: currentUser.id,
        participants: req.body.participants || []
      };
      req.reply({
        statusCode: 201,
        body: newActivity
      });
    }).as('createActivity');

    // Mock creating a trip expense
    cy.intercept('POST', '/api/expenses', (req) => {
      const newExpense = {
        id: 203,
        name: req.body.name,
        amount: req.body.amount,
        currency: req.body.currency || 'INR',
        payerId: currentUser.id,
        date: new Date().toISOString(),
        tripId: req.body.tripId,
        settled: false,
        payer: {
          id: currentUser.id,
          displayName: currentUser.displayName
        },
        participants: req.body.participants || []
      };
      req.reply({
        statusCode: 201,
        body: newExpense
      });
    }).as('createExpense');

    // Mock creating a trip task
    cy.intercept('POST', '/api/tasks', (req) => {
      const newTask = {
        id: 304,
        title: req.body.title,
        description: req.body.description,
        dueDate: req.body.dueDate,
        tripId: req.body.tripId,
        assigneeId: req.body.assigneeId,
        creatorId: currentUser.id,
        status: 'pending',
        priority: req.body.priority || 'medium',
        assignee: {
          id: req.body.assigneeId,
          displayName: req.body.assigneeId === 1 ? 'Test User' : 
                       req.body.assigneeId === 2 ? 'Jane Doe' : 'John Smith'
        }
      };
      req.reply({
        statusCode: 201,
        body: newTask
      });
    }).as('createTask');

    // Mock adding a packing list item
    cy.intercept('POST', '/api/packing-list/items', (req) => {
      const newItem = {
        id: 4034,
        name: req.body.name,
        checked: false,
        assigneeId: req.body.assigneeId || null,
        categoryId: req.body.categoryId
      };
      req.reply({
        statusCode: 201,
        body: newItem
      });
    }).as('addPackingItem');

    // Login before each test
    cy.login('test@example.com', 'password123');
  });

  it('displays the trips list', () => {
    cy.visit('/trips');
    cy.wait('@getTrips');

    // Verify trips list elements
    cy.contains('My Trips').should('be.visible');
    cy.get('[data-testid="trip-card"]').should('have.length', 2);
    
    // Check first trip details
    cy.get('[data-testid="trip-card"]').first().within(() => {
      cy.contains('Goa Beach Vacation').should('be.visible');
      cy.contains('Goa, India').should('be.visible');
      cy.contains('3 Travelers').should('be.visible');
    });
  });

  it('creates a new trip', () => {
    cy.visit('/trips');
    cy.wait('@getTrips');

    // Click create trip button
    cy.contains('Create Trip').click();
    
    // Fill in trip details
    cy.get('input[name="name"]').type('Bangkok City Break');
    cy.get('textarea[name="description"]').type('Exploring the vibrant city of Bangkok');
    
    // Set dates
    const startDate = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000);
    const endDate = new Date(Date.now() + 65 * 24 * 60 * 60 * 1000);
    
    cy.get('input[name="startDate"]').type(startDate.toISOString().split('T')[0]);
    cy.get('input[name="endDate"]').type(endDate.toISOString().split('T')[0]);
    
    // Set location
    cy.get('input[name="location"]').type('Bangkok, Thailand');
    
    // Submit form
    cy.get('button').contains('Create Trip').click();
    
    // Wait for trip creation request
    cy.wait('@createTrip');
    
    // Should show success message
    cy.contains('Trip created successfully').should('be.visible');
    
    // Should redirect to the trip detail page
    cy.url().should('include', '/trip/3');
  });

  it('navigates to trip detail view', () => {
    cy.visit('/trips');
    cy.wait('@getTrips');

    // Click on a trip
    cy.contains('Goa Beach Vacation').click();
    
    // URL should change to trip detail
    cy.url().should('include', '/trip/1');
    
    // Wait for trip details to load
    cy.wait('@getTripDetails');
    
    // Verify trip detail elements
    cy.contains('Goa Beach Vacation').should('be.visible');
    cy.contains('A weekend getaway to the beautiful beaches of Goa').should('be.visible');
    cy.contains('Goa, India').should('be.visible');
  });

  it('displays trip activities correctly', () => {
    cy.visit('/trip/1');
    cy.wait('@getTripDetails');

    // Navigate to activities tab if needed
    cy.contains('Activities').click();
    cy.wait('@getTripActivities');
    
    // Check that activities are displayed correctly
    cy.get('[data-testid="activity-card"]').should('have.length', 2);
    
    // Check activity details
    cy.contains('Beach Day at Calangute').should('be.visible');
    cy.contains('Day at the most popular beach in Goa').should('be.visible');
    cy.contains('Calangute Beach, Goa').should('be.visible');
    
    cy.contains('Water Sports at Baga').should('be.visible');
  });

  it('creates a new trip activity', () => {
    cy.visit('/trip/1');
    cy.wait('@getTripDetails');

    // Navigate to activities tab
    cy.contains('Activities').click();
    cy.wait('@getTripActivities');
    
    // Click add activity button
    cy.contains('Add Activity').click();
    
    // Fill in activity details
    cy.get('input[name="name"]').type('Night Market Visit');
    cy.get('textarea[name="description"]').type('Exploring the famous Goa night market');
    
    // Set date
    const activityDate = new Date(Date.now() + 17 * 24 * 60 * 60 * 1000);
    cy.get('input[name="date"]').type(activityDate.toISOString().split('T')[0]);
    
    // Set location
    cy.get('input[name="location"]').type('Anjuna Beach, Goa');
    
    // Submit form
    cy.get('button').contains('Save Activity').click();
    
    // Wait for activity creation request
    cy.wait('@createActivity');
    
    // Should show success message
    cy.contains('Activity added successfully').should('be.visible');
    
    // New activity should be visible in the list
    cy.contains('Night Market Visit').should('be.visible');
  });

  it('displays trip expenses correctly', () => {
    cy.visit('/trip/1');
    cy.wait('@getTripDetails');

    // Navigate to expenses tab
    cy.contains('Expenses').click();
    cy.wait('@getTripExpenses');
    
    // Check that expenses are displayed correctly
    cy.get('[data-testid="expense-item"]').should('have.length', 2);
    
    // Check expense details
    cy.contains('Hotel Booking').should('be.visible');
    cy.contains('₹15,000').should('be.visible');
    cy.contains('Paid by Test User').should('be.visible');
    
    cy.contains('Flight Tickets').should('be.visible');
    cy.contains('₹24,000').should('be.visible');
    cy.contains('Paid by John Smith').should('be.visible');
    cy.contains('Settled').should('be.visible');
  });

  it('creates a new trip expense', () => {
    cy.visit('/trip/1');
    cy.wait('@getTripDetails');

    // Navigate to expenses tab
    cy.contains('Expenses').click();
    cy.wait('@getTripExpenses');
    
    // Click add expense button
    cy.contains('Add Expense').click();
    
    // Fill in expense details
    cy.get('input[name="name"]').type('Dinner at Beach Shack');
    cy.get('input[name="amount"]').type('4500');
    cy.get('select[name="currency"]').select('INR');
    
    // Select participants (all should be selected by default)
    cy.get('[data-testid="expense-participant"]').should('have.length', 3);
    
    // Submit form
    cy.get('button').contains('Save Expense').click();
    
    // Wait for expense creation request
    cy.wait('@createExpense');
    
    // Should show success message
    cy.contains('Expense added successfully').should('be.visible');
    
    // New expense should be visible in the list
    cy.contains('Dinner at Beach Shack').should('be.visible');
    cy.contains('₹4,500').should('be.visible');
  });

  it('displays trip tasks correctly', () => {
    cy.visit('/trip/1');
    cy.wait('@getTripDetails');

    // Navigate to tasks tab
    cy.contains('Tasks').click();
    cy.wait('@getTripTasks');
    
    // Check that tasks are displayed correctly
    cy.get('[data-testid="task-item"]').should('have.length', 3);
    
    // Check task details
    cy.contains('Pack Sunscreen').should('be.visible');
    cy.contains('Don\'t forget to pack sunscreen for the beach').should('be.visible');
    cy.contains('Assigned to Test User').should('be.visible');
    cy.contains('High Priority').should('be.visible');
    
    cy.contains('Confirm Hotel Reservation').should('be.visible')
      .parents('[data-testid="task-item"]')
      .should('have.class', 'completed');
  });

  it('creates a new trip task', () => {
    cy.visit('/trip/1');
    cy.wait('@getTripDetails');

    // Navigate to tasks tab
    cy.contains('Tasks').click();
    cy.wait('@getTripTasks');
    
    // Click add task button
    cy.contains('Add Task').click();
    
    // Fill in task details
    cy.get('input[name="title"]').type('Book Restaurant for Dinner');
    cy.get('textarea[name="description"]').type('Make reservation at a beach restaurant');
    
    // Set due date
    const dueDate = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000);
    cy.get('input[name="dueDate"]').type(dueDate.toISOString().split('T')[0]);
    
    // Select assignee
    cy.get('select[name="assigneeId"]').select('Jane Doe');
    
    // Set priority
    cy.get('select[name="priority"]').select('High');
    
    // Submit form
    cy.get('button').contains('Save Task').click();
    
    // Wait for task creation request
    cy.wait('@createTask');
    
    // Should show success message
    cy.contains('Task added successfully').should('be.visible');
    
    // New task should be visible in the list
    cy.contains('Book Restaurant for Dinner').should('be.visible');
    cy.contains('Assigned to Jane Doe').should('be.visible');
  });

  it('toggles task completion status', () => {
    // Mock updating a task
    cy.intercept('PATCH', '/api/tasks/*', {
      statusCode: 200,
      body: {
        id: 301,
        status: 'completed'
      }
    }).as('updateTask');

    cy.visit('/trip/1');
    cy.wait('@getTripDetails');

    // Navigate to tasks tab
    cy.contains('Tasks').click();
    cy.wait('@getTripTasks');
    
    // Find the task and click the completion checkbox
    cy.contains('Pack Sunscreen')
      .parents('[data-testid="task-item"]')
      .find('input[type="checkbox"]')
      .click();
    
    // Wait for task update request
    cy.wait('@updateTask');
    
    // Task should now be marked as completed
    cy.contains('Pack Sunscreen')
      .parents('[data-testid="task-item"]')
      .should('have.class', 'completed');
  });

  it('displays packing list correctly', () => {
    cy.visit('/trip/1');
    cy.wait('@getTripDetails');

    // Navigate to packing list tab
    cy.contains('Packing List').click();
    cy.wait('@getTripPackingList');
    
    // Check that packing list categories are displayed correctly
    cy.get('[data-testid="packing-category"]').should('have.length', 3);
    
    // Check first category
    cy.contains('Clothes').should('be.visible')
      .parents('[data-testid="packing-category"]')
      .within(() => {
        cy.get('[data-testid="packing-item"]').should('have.length', 4);
        cy.contains('T-shirts').should('be.visible');
        // Two items should be checked
        cy.get('input[type="checkbox"]:checked').should('have.length', 2);
      });
    
    // Check second category
    cy.contains('Toiletries').should('be.visible');
    
    // Check third category
    cy.contains('Electronics').should('be.visible');
  });

  it('adds a new packing list item', () => {
    cy.visit('/trip/1');
    cy.wait('@getTripDetails');

    // Navigate to packing list tab
    cy.contains('Packing List').click();
    cy.wait('@getTripPackingList');
    
    // Click add item in the Electronics category
    cy.contains('Electronics')
      .parents('[data-testid="packing-category"]')
      .contains('Add Item')
      .click();
    
    // Type new item name
    cy.get('input[placeholder="Item name"]').type('Headphones');
    
    // Submit form
    cy.get('button').contains('Add').click();
    
    // Wait for item creation request
    cy.wait('@addPackingItem');
    
    // New item should be visible in the list
    cy.contains('Electronics')
      .parents('[data-testid="packing-category"]')
      .contains('Headphones')
      .should('be.visible');
  });

  it('toggles packing list item status', () => {
    // Mock updating a packing list item
    cy.intercept('PATCH', '/api/packing-list/items/*', {
      statusCode: 200,
      body: {
        id: 4013,
        checked: true
      }
    }).as('updatePackingItem');

    cy.visit('/trip/1');
    cy.wait('@getTripDetails');

    // Navigate to packing list tab
    cy.contains('Packing List').click();
    cy.wait('@getTripPackingList');
    
    // Find the Swimwear item and check it
    cy.contains('Swimwear')
      .parent()
      .find('input[type="checkbox"]')
      .click();
    
    // Wait for item update request
    cy.wait('@updatePackingItem');
    
    // Item should now be checked
    cy.contains('Swimwear')
      .parent()
      .find('input[type="checkbox"]')
      .should('be.checked');
  });
});