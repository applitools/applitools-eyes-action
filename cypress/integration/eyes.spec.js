/// <reference types="Cypress" />

describe('Visual Regression Tests', () => {
  const pagesToCheck = Cypress.env('PAGES_TO_CHECK');

  const eyesConfig = {
    appName: Cypress.env('APPLITOOLS_APP_NAME'),
    batchName: Cypress.env('APPLITOOLS_BATCH_NAME'),
    serverUrl: Cypress.env('APPLITOOLS_SERVER_URL'),
  }

  pagesToCheck.forEach((route) => {
    it(`Visual Diff for ${route}`, () => {

      console.log(`process.env.APPLITOOLS_CONCURRENCY: ${process.env.APPLITOOLS_CONCURRENCY}`);

      console.log(`Eyes config: ${JSON.stringify(eyesConfig, null, 2)}`);

      cy.eyesOpen(eyesConfig);

      cy.visit(route);
      
      cy.eyesCheckWindow({
        tag: route
      });

      cy.eyesClose();
    });
  });
});