/// <reference types="Cypress" />

describe('Visual Regression Tests', () => {
  const pagesToCheck = Cypress.env('PAGES_TO_CHECK');

  const eyesConfig = {
    appName: Cypress.env('APPLITOOLS_APP_NAME'),
    batchName: Cypress.env('APPLITOOLS_BATCH_NAME'),
    testConcurrency: Number(Cypress.env('APPLITOOLS_CONCURRENCY')),
    serverUrl: Cypress.env('APPLITOOLS_SERVER_URL'),
  }

  console.log('process.env.APPLITOOLS_CONCURRENCY', process.env.APPLITOOLS_CONCURRENCY);

  console.log(`Eyes config: ${JSON.stringify(eyesConfig, null, 2)}`);

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