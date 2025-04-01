describe('Vendor Portal', () => {
  // Mock vendor data
  const testVendor = {
    email: 'test-restaurant@example.com',
    password: 'password123',
    name: 'Test Restaurant',
    businessType: 'restaurant',
  };

  beforeEach(() => {
    // Intercept vendor authentication API call
    cy.intercept('POST', '/api/vendor/login', {
      statusCode: 200,
      body: {
        vendor: {
          id: 1,
          email: testVendor.email,
          name: testVendor.name,
          businessType: testVendor.businessType,
          businessId: 1,
          verified: true,
          active: true,
        },
        token: 'mock-jwt-token'
      }
    }).as('vendorLogin');

    // Intercept profile fetch
    cy.intercept('GET', '/api/vendor/profile', {
      statusCode: 200,
      body: {
        id: 1,
        email: testVendor.email,
        name: testVendor.name,
        businessType: testVendor.businessType,
        businessId: 1,
        verified: true,
        active: true,
      }
    }).as('vendorProfile');
  });

  it('should successfully log in a vendor', () => {
    cy.visit('/vendor/login');
    
    // Verify login form elements
    cy.contains('Vendor Login').should('be.visible');
    cy.get('input[type="email"]').should('be.visible');
    cy.get('input[type="password"]').should('be.visible');
    cy.get('button').contains('Sign In').should('be.visible');
    
    // Fill and submit the form
    cy.get('input[type="email"]').type(testVendor.email);
    cy.get('input[type="password"]').type(testVendor.password);
    cy.get('button').contains('Sign In').click();
    
    // Wait for API call and check redirect
    cy.wait('@vendorLogin');
    cy.url().should('include', '/vendor/dashboard');
  });

  it('should show validation errors on login form', () => {
    cy.visit('/vendor/login');
    
    // Submit without filling
    cy.get('button').contains('Sign In').click();
    
    // Check validation errors
    cy.contains('Email is required').should('be.visible');
    cy.contains('Password is required').should('be.visible');
    
    // Fill invalid email
    cy.get('input[type="email"]').type('not-an-email');
    cy.get('button').contains('Sign In').click();
    cy.contains('Invalid email').should('be.visible');
  });

  it('should handle failed login', () => {
    // Mock failed login
    cy.intercept('POST', '/api/vendor/login', {
      statusCode: 401,
      body: { error: 'Invalid email or password' }
    }).as('vendorLoginFailed');
    
    cy.visit('/vendor/login');
    
    // Fill and submit the form
    cy.get('input[type="email"]').type(testVendor.email);
    cy.get('input[type="password"]').type('wrong-password');
    cy.get('button').contains('Sign In').click();
    
    // Wait for API call and check error message
    cy.wait('@vendorLoginFailed');
    cy.contains('Invalid email or password').should('be.visible');
  });

  it('should show the dashboard after login', () => {
    // Mock additional dashboard data
    cy.intercept('GET', '/api/vendor/restaurants', {
      statusCode: 200,
      body: [{
        id: 1,
        name: 'Test Restaurant',
        location: '123 Test St',
        cuisine: 'Italian',
        priceRange: '$$',
        rating: 4.5,
      }]
    }).as('vendorRestaurants');
    
    cy.intercept('GET', '/api/vendor/restaurants/1/stats', {
      statusCode: 200,
      body: {
        total: 25,
        pending: 5,
        confirmed: 15,
        canceled: 3,
        completed: 2,
        todayReservations: 8,
        upcomingReservations: 20,
      }
    }).as('restaurantStats');
    
    // Log in the vendor
    cy.visit('/vendor/login');
    cy.get('input[type="email"]').type(testVendor.email);
    cy.get('input[type="password"]').type(testVendor.password);
    cy.get('button').contains('Sign In').click();
    cy.wait('@vendorLogin');
    
    // Check dashboard elements
    cy.contains('Vendor Dashboard').should('be.visible');
    cy.contains('Test Restaurant').should('be.visible');
    cy.contains('Recent Reservations').should('be.visible');
    cy.contains('Today: 8 reservations').should('be.visible');
    cy.contains('Upcoming: 20 reservations').should('be.visible');
  });

  it('should navigate to restaurant management page', () => {
    // Mock reservations data
    cy.intercept('GET', '/api/vendor/restaurants/1/reservations', {
      statusCode: 200,
      body: [
        {
          id: 1,
          userId: 1,
          reservationDate: new Date().toISOString(),
          partySize: 4,
          status: 'pending',
          specialRequests: 'Window seat please',
          user: {
            id: 1,
            displayName: 'John Doe',
            email: 'john@example.com'
          }
        },
        {
          id: 2,
          userId: 2,
          reservationDate: new Date().toISOString(),
          partySize: 2,
          status: 'confirmed',
          tableNumber: 'A12',
          user: {
            id: 2,
            displayName: 'Jane Smith',
            email: 'jane@example.com'
          }
        }
      ]
    }).as('restaurantReservations');
    
    // Log in and navigate to restaurant management
    cy.visit('/vendor/login');
    cy.get('input[type="email"]').type(testVendor.email);
    cy.get('input[type="password"]').type(testVendor.password);
    cy.get('button').contains('Sign In').click();
    cy.wait('@vendorLogin');
    
    // Click on restaurant management link
    cy.contains('Manage Restaurant').click();
    cy.url().should('include', '/vendor/restaurant/1');
    
    // Check restaurant management elements
    cy.contains('Restaurant Management').should('be.visible');
    cy.contains('Reservations').should('be.visible');
    cy.contains('John Doe').should('be.visible');
    cy.contains('Jane Smith').should('be.visible');
    cy.contains('Pending').should('be.visible');
    cy.contains('Confirmed').should('be.visible');
  });

  it('should handle reservation confirmation', () => {
    // Mock update reservation
    cy.intercept('PATCH', '/api/vendor/reservations/1', {
      statusCode: 200,
      body: {
        id: 1,
        status: 'confirmed',
        tableNumber: 'B14',
      }
    }).as('updateReservation');
    
    // Log in and navigate to restaurant management
    cy.visit('/vendor/login');
    cy.get('input[type="email"]').type(testVendor.email);
    cy.get('input[type="password"]').type(testVendor.password);
    cy.get('button').contains('Sign In').click();
    cy.wait('@vendorLogin');
    cy.contains('Manage Restaurant').click();
    
    // Find and confirm a reservation
    cy.contains('tr', 'John Doe').within(() => {
      cy.contains('Confirm').click();
    });
    
    // Enter table number in modal
    cy.get('.modal').should('be.visible');
    cy.get('.modal input[placeholder="Table Number"]').type('B14');
    cy.get('.modal button').contains('Confirm Reservation').click();
    
    // Wait for update and check status change
    cy.wait('@updateReservation');
    cy.contains('tr', 'John Doe').should('contain', 'Confirmed');
    cy.contains('tr', 'John Doe').should('contain', 'B14');
  });

  it('should create a discount code', () => {
    // Mock create discount code
    cy.intercept('POST', '/api/vendor/discount-codes', {
      statusCode: 201,
      body: {
        id: 1,
        code: 'SUMMER20',
        description: 'Summer discount',
        discountType: 'percentage',
        discountValue: 20,
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 30*24*60*60*1000).toISOString(),
        active: true,
      }
    }).as('createDiscount');
    
    // Log in and navigate to discounts
    cy.visit('/vendor/login');
    cy.get('input[type="email"]').type(testVendor.email);
    cy.get('input[type="password"]').type(testVendor.password);
    cy.get('button').contains('Sign In').click();
    cy.wait('@vendorLogin');
    cy.contains('Discount Codes').click();
    
    // Click create discount
    cy.contains('Create Discount').click();
    
    // Fill discount form
    cy.get('input[name="code"]').type('SUMMER20');
    cy.get('input[name="description"]').type('Summer discount');
    cy.get('select[name="discountType"]').select('percentage');
    cy.get('input[name="discountValue"]').type('20');
    cy.get('input[name="minPurchase"]').type('50');
    
    // Set dates
    const today = new Date();
    const nextMonth = new Date(today);
    nextMonth.setMonth(today.getMonth() + 1);
    
    cy.get('input[name="startDate"]').type(today.toISOString().split('T')[0]);
    cy.get('input[name="endDate"]').type(nextMonth.toISOString().split('T')[0]);
    
    // Submit form
    cy.get('button').contains('Save Discount').click();
    
    // Wait for creation and check result
    cy.wait('@createDiscount');
    cy.contains('Discount code created successfully').should('be.visible');
    cy.contains('SUMMER20').should('be.visible');
  });

  it('should register a new vendor', () => {
    // Mock vendor registration
    cy.intercept('POST', '/api/vendor/register', {
      statusCode: 201,
      body: {
        id: 2,
        email: 'new-theater@example.com',
        name: 'New Movie Theater',
        businessType: 'movie_theater',
        verified: false,
        active: true,
      }
    }).as('vendorRegister');
    
    cy.visit('/vendor/register');
    
    // Verify registration form elements
    cy.contains('Vendor Registration').should('be.visible');
    cy.get('input[name="name"]').should('be.visible');
    cy.get('input[name="email"]').should('be.visible');
    cy.get('input[name="password"]').should('be.visible');
    cy.get('input[name="confirmPassword"]').should('be.visible');
    cy.get('select[name="businessType"]').should('be.visible');
    cy.get('button').contains('Register').should('be.visible');
    
    // Fill and submit the form
    cy.get('input[name="name"]').type('New Movie Theater');
    cy.get('input[name="email"]').type('new-theater@example.com');
    cy.get('input[name="password"]').type('password123');
    cy.get('input[name="confirmPassword"]').type('password123');
    cy.get('select[name="businessType"]').select('movie_theater');
    cy.get('button').contains('Register').click();
    
    // Wait for API call and check redirect
    cy.wait('@vendorRegister');
    cy.contains('Registration successful').should('be.visible');
    cy.contains('Please check your email to verify your account').should('be.visible');
  });

  it('should validate the vendor registration form', () => {
    cy.visit('/vendor/register');
    
    // Submit empty form
    cy.get('button').contains('Register').click();
    
    // Check validation errors
    cy.contains('Name is required').should('be.visible');
    cy.contains('Email is required').should('be.visible');
    cy.contains('Password is required').should('be.visible');
    cy.contains('Please confirm your password').should('be.visible');
    cy.contains('Business type is required').should('be.visible');
    
    // Type mismatched passwords
    cy.get('input[name="password"]').type('password123');
    cy.get('input[name="confirmPassword"]').type('password456');
    cy.get('button').contains('Register').click();
    
    cy.contains('Passwords do not match').should('be.visible');
  });

  // Test for movie theater vendor
  it('should navigate and manage movie theater content', () => {
    // Update test vendor to be a movie theater
    testVendor.businessType = 'movie_theater';
    
    // Mock movie data
    cy.intercept('GET', '/api/vendor/movies', {
      statusCode: 200,
      body: [
        {
          id: 1,
          title: 'Test Movie',
          description: 'A test movie',
          duration: 120,
          releaseDate: new Date().toISOString(),
          genre: ['Action', 'Adventure'],
          rating: 'PG-13',
          posterUrl: 'https://example.com/poster.jpg'
        }
      ]
    }).as('movies');
    
    // Mock showtimes
    cy.intercept('GET', '/api/vendor/theaters/1/showings', {
      statusCode: 200,
      body: [
        {
          id: 1,
          movieId: 1,
          theaterId: 1,
          showtime: new Date().toISOString(),
          endTime: new Date(Date.now() + 2*60*60*1000).toISOString(),
          screenNumber: 'Screen 1',
          format: 'Standard',
          totalSeats: 100,
          availableSeats: 75,
          price: 12.99,
          status: 'scheduled'
        }
      ]
    }).as('showings');
    
    // Log in as movie theater vendor
    cy.visit('/vendor/login');
    cy.get('input[type="email"]').type(testVendor.email);
    cy.get('input[type="password"]').type(testVendor.password);
    cy.get('button').contains('Sign In').click();
    cy.wait('@vendorLogin');
    
    // Check movie theater specific navigation
    cy.contains('Movies').should('be.visible');
    cy.contains('Showtimes').should('be.visible');
    cy.contains('Concessions').should('be.visible');
    
    // Navigate to movies page
    cy.contains('Movies').click();
    cy.url().should('include', '/vendor/movies');
    cy.wait('@movies');
    
    // Check movie listing
    cy.contains('Test Movie').should('be.visible');
    cy.contains('PG-13').should('be.visible');
    cy.contains('Action, Adventure').should('be.visible');
    cy.contains('120 min').should('be.visible');
    
    // Navigate to showtimes
    cy.contains('Showtimes').click();
    cy.url().should('include', '/vendor/showtimes');
    cy.wait('@showings');
    
    // Check showtimes listing
    cy.contains('Test Movie').should('be.visible');
    cy.contains('Screen 1').should('be.visible');
    cy.contains('Standard').should('be.visible');
    cy.contains('$12.99').should('be.visible');
    cy.contains('75/100 seats available').should('be.visible');
  });

  it('should add a new movie showing', () => {
    // Mock movie data for dropdown
    cy.intercept('GET', '/api/vendor/movies', {
      statusCode: 200,
      body: [
        {
          id: 1,
          title: 'Test Movie',
          duration: 120
        }
      ]
    }).as('movies');
    
    // Mock create showing
    cy.intercept('POST', '/api/vendor/theaters/1/showings', {
      statusCode: 201,
      body: {
        id: 2,
        movieId: 1,
        theaterId: 1,
        showtime: '2025-04-15T18:00:00Z',
        endTime: '2025-04-15T20:00:00Z',
        screenNumber: 'Screen 2',
        format: 'IMAX',
        totalSeats: 80,
        availableSeats: 80,
        price: 15.99,
        status: 'scheduled'
      }
    }).as('createShowing');
    
    // Log in as movie theater vendor
    cy.visit('/vendor/login');
    cy.get('input[type="email"]').type(testVendor.email);
    cy.get('input[type="password"]').type(testVendor.password);
    cy.get('button').contains('Sign In').click();
    cy.wait('@vendorLogin');
    
    // Navigate to showtimes
    cy.contains('Showtimes').click();
    
    // Click add showing
    cy.contains('Add Showing').click();
    
    // Fill showing form
    cy.get('select[name="movieId"]').select('Test Movie');
    cy.get('input[name="showtime"]').type('2025-04-15T18:00:00');
    cy.get('input[name="screenNumber"]').type('Screen 2');
    cy.get('select[name="format"]').select('IMAX');
    cy.get('input[name="totalSeats"]').type('80');
    cy.get('input[name="price"]').type('15.99');
    
    // Submit form
    cy.get('button').contains('Add Showing').click();
    
    // Wait for creation and check result
    cy.wait('@createShowing');
    cy.contains('Showing added successfully').should('be.visible');
  });
});