/// <reference types="Cypress" />

describe('Visual Regression Tests', () => {
  const pagesToCheck = Cypress.env('PAGES_TO_CHECK');

  pagesToCheck.forEach((route) => {
    it(`Visual Diff for ${route}`, () => {

      cy.eyesOpen({
        appName: process.env.APPLITOOLS_APP_NAME,
        batchName: process.env.BATCH_APP_NAME,
        concurrency: Number(Cypress.env('APPLITOOLS_CONCURRENCY')),
        serverUrl: Cypress.env('APPLITOOLS_SERVER_URL'),
      });

      cy.visit(route);
      
      cy.eyesCheckWindow({
        tag: route
      });

      cy.eyesClose();
    });
  });
});