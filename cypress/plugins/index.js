/// <reference types="cypress" />

/**
 * @type {Cypress.PluginConfig}
 */
module.exports = (on, config) => {
  require('cypress-log-to-output').install(on)
}


require('@applitools/eyes-cypress')(module);
