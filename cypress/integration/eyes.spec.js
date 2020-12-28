describe('check the site for visual regressions', () => {
  const pagesToCheck = Cypress.env('PAGES_TO_CHECK');

  pagesToCheck.forEach((route) => {
    it(`Visual Diff for ${route}`, () => {

      cy.eyesOpen({
        appName: process.env.SITE_NAME || 'localhost-test',
        batchName: process.env.SITE_NAME || 'localhost-test',
        // browser: JSON.parse(Cypress.env('APPLITOOLS_BROWSERS')),
        // failBuildOnDiff: Boolean(Cypress.env('APPLITOOLS_FAIL_BUILD_ON_DIFF')),
        // serverUrl: Cypress.env('APPLITOOLS_SERVER_URL'),
        concurrency: Number(Cypress.env('APPLITOOLS_CONCURRENCY')),
      });

      // const selector = Cypress.env('APPLITOOLS_IGNORE_SELECTOR');
      cy.visit(route);
      
      cy.eyesCheckWindow({
        tag: route,
        // ignore: Cypress.env('APPLITOOLS_IGNORE_SELECTOR'),
      });

      cy.eyesClose();
    });
  });
});