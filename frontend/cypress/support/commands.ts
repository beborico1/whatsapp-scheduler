/// <reference types="cypress" />

// Import testing library commands
import '@testing-library/cypress/add-commands';

// Custom command to login (placeholder for future auth implementation)
Cypress.Commands.add('login', (username: string, password: string) => {
  // For now, just visit the home page
  // In the future, this would handle authentication
  cy.visit('/');
});

// Custom command to create a message via API
Cypress.Commands.add('createMessage', (title: string, content: string) => {
  return cy.request('POST', '/api/messages/', {
    title,
    content,
  }).then((response) => {
    expect(response.status).to.equal(200);
    return response.body;
  });
});

// Custom command to create a recipient via API
Cypress.Commands.add('createRecipient', (name: string, phone: string) => {
  return cy.request('POST', '/api/recipients/', {
    name,
    phone_number: phone,
  }).then((response) => {
    expect(response.status).to.equal(200);
    return response.body;
  });
});

// Custom command to create a group via API
Cypress.Commands.add('createGroup', (name: string, recipientIds: number[]) => {
  return cy.request('POST', '/api/recipients/groups/', {
    name,
    recipient_ids: recipientIds,
  }).then((response) => {
    expect(response.status).to.equal(200);
    return response.body;
  });
});

// Type definitions for custom commands
declare global {
  namespace Cypress {
    interface Chainable {
      login(username: string, password: string): Chainable<void>;
      createMessage(title: string, content: string): Chainable<any>;
      createRecipient(name: string, phone: string): Chainable<any>;
      createGroup(name: string, recipientIds: number[]): Chainable<any>;
    }
  }
}

export {};