/// <reference types="Cypress" />

describe('Visual Regression Tests', () => {
  const pagesToCheck = Cypress.env('PAGES_TO_CHECK');

  const eyesConfig = {
    appName: Cypress.env('APPLITOOLS_APP_NAME'),
    batchName: Cypress.env('APPLITOOLS_BATCH_NAME'),
    batchId: Cypress.env('APPLITOOLS_BATCH_ID'),
    serverUrl: Cypress.env('APPLITOOLS_SERVER_URL'),
  }

  console.log('Eyes Config', eyesConfig);

  pagesToCheck.forEach((route) => {
    it(`Visual Diff for ${route}`, () => {
      cy.eyesOpen(eyesConfig);

      cy.visit(route);
      
      cy.eyesCheckWindow({
        tag: route
      });

      cy.eyesClose();
    });
  });
});