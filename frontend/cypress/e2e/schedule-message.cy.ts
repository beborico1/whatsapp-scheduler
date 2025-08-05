describe('Schedule Message E2E Tests', () => {
  beforeEach(() => {
    // Visit the home page before each test
    cy.visit('/');
  });

  it('displays the scheduler page with all required elements', () => {
    // Check main elements are present
    cy.contains('Schedule Message').should('be.visible');
    cy.get('form').should('exist');
    
    // Check form fields
    cy.contains('label', 'Message').should('be.visible');
    cy.contains('label', 'Recipient Group').should('be.visible');
    cy.contains('label', 'Schedule Date & Time').should('be.visible');
    
    // Check buttons
    cy.contains('button', 'New Message').should('be.visible');
    cy.contains('button', 'New Group').should('be.visible');
    cy.contains('button', 'Schedule Message').should('be.visible');
  });

  it('shows error when trying to schedule without filling all fields', () => {
    // Click schedule without filling fields
    cy.contains('button', 'Schedule Message').click();
    
    // Should show error message
    cy.contains('Please fill in all fields').should('be.visible');
  });

  it('creates a new message and schedules it', () => {
    // Create test data via API
    cy.createRecipient('John Doe', '+1234567890').then((recipient) => {
      cy.createGroup('Test Group', [recipient.id]).then((group) => {
        // Click new message button
        cy.contains('button', 'New Message').click();
        
        // Fill message form
        cy.get('input[id="title"]').type('Test Message');
        cy.get('textarea[id="content"]').type('This is a test message content');
        cy.contains('button', 'Create Message').click();
        
        // Message should be created and modal closed
        cy.contains('Test Message').should('not.exist'); // Modal should close
        
        // Select the created message
        cy.get('select').first().select('Test Message');
        
        // Select the group
        cy.get('select').eq(1).select(`Test Group (1 recipients)`);
        
        // Select future date/time
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        cy.get('input[type="datetime-local"]').type(tomorrow.toISOString().slice(0, 16));
        
        // Schedule the message
        cy.contains('button', 'Schedule Message').click();
        
        // Should show success message
        cy.contains('Message scheduled successfully').should('be.visible');
      });
    });
  });

  it('navigates to recipients page when clicking new group', () => {
    cy.contains('button', 'New Group').click();
    cy.url().should('include', '/recipients');
    cy.url().should('include', 'tab=groups');
  });

  it('cancels message creation', () => {
    // Open new message modal
    cy.contains('button', 'New Message').click();
    
    // Modal should be visible
    cy.contains('Create New Message').should('be.visible');
    
    // Fill some data
    cy.get('input[id="title"]').type('Test');
    
    // Click cancel
    cy.contains('button', 'Cancel').click();
    
    // Modal should close
    cy.contains('Create New Message').should('not.exist');
  });

  it('validates past dates are not allowed', () => {
    // Create test data
    cy.createMessage('Test Message', 'Content').then((message) => {
      cy.createRecipient('Jane Doe', '+9876543210').then((recipient) => {
        cy.createGroup('Another Group', [recipient.id]).then((group) => {
          // Select message and group
          cy.get('select').first().select(message.title);
          cy.get('select').eq(1).select(`${group.name} (1 recipients)`);
          
          // Try to select past date
          const yesterday = new Date();
          yesterday.setDate(yesterday.getDate() - 1);
          cy.get('input[type="datetime-local"]').type(yesterday.toISOString().slice(0, 16));
          
          // Try to schedule
          cy.contains('button', 'Schedule Message').click();
          
          // Should show error
          cy.contains('Scheduled time must be in the future').should('be.visible');
        });
      });
    });
  });

  it('handles API errors gracefully', () => {
    // Intercept API call and force error
    cy.intercept('POST', '/api/schedules/', {
      statusCode: 500,
      body: { detail: 'Internal server error' }
    }).as('scheduleError');

    // Create test data and fill form
    cy.createMessage('Error Test', 'Content').then((message) => {
      cy.createRecipient('Error User', '+1111111111').then((recipient) => {
        cy.createGroup('Error Group', [recipient.id]).then((group) => {
          // Fill form
          cy.get('select').first().select(message.title);
          cy.get('select').eq(1).select(`${group.name} (1 recipients)`);
          
          const tomorrow = new Date();
          tomorrow.setDate(tomorrow.getDate() + 1);
          cy.get('input[type="datetime-local"]').type(tomorrow.toISOString().slice(0, 16));
          
          // Try to schedule
          cy.contains('button', 'Schedule Message').click();
          
          // Wait for error response
          cy.wait('@scheduleError');
          
          // Should show error message
          cy.contains('Internal server error').should('be.visible');
        });
      });
    });
  });

  it('shows loading state while scheduling', () => {
    // Intercept API call with delay
    cy.intercept('POST', '/api/schedules/', (req) => {
      req.reply((res) => {
        res.delay(1000); // 1 second delay
        res.send({ statusCode: 200, body: { id: 1 } });
      });
    }).as('scheduleDelay');

    // Create test data and fill form
    cy.createMessage('Loading Test', 'Content').then((message) => {
      cy.createRecipient('Loading User', '+2222222222').then((recipient) => {
        cy.createGroup('Loading Group', [recipient.id]).then((group) => {
          // Fill form
          cy.get('select').first().select(message.title);
          cy.get('select').eq(1).select(`${group.name} (1 recipients)`);
          
          const tomorrow = new Date();
          tomorrow.setDate(tomorrow.getDate() + 1);
          cy.get('input[type="datetime-local"]').type(tomorrow.toISOString().slice(0, 16));
          
          // Click schedule
          cy.contains('button', 'Schedule Message').click();
          
          // Should show loading state
          cy.contains('Scheduling...').should('be.visible');
          cy.get('button[disabled]').should('contain', 'Scheduling...');
          
          // Wait for completion
          cy.wait('@scheduleDelay');
          
          // Should show success
          cy.contains('Message scheduled successfully').should('be.visible');
        });
      });
    });
  });
});

describe('Multi-language Support', () => {
  it('switches between English and Spanish', () => {
    cy.visit('/');
    
    // Default should be English
    cy.contains('Schedule Message').should('be.visible');
    
    // Find and click language switcher (assuming it exists)
    // This test would need to be updated based on actual implementation
    cy.get('[data-testid="language-switcher"]').click();
    cy.contains('Español').click();
    
    // Check Spanish translation
    cy.contains('Programar Mensaje').should('be.visible');
    
    // Switch back to English
    cy.get('[data-testid="language-switcher"]').click();
    cy.contains('English').click();
    
    // Should be back to English
    cy.contains('Schedule Message').should('be.visible');
  });
});