require('dotenv').config();

const core = require('@actions/core');
const cypress = require('cypress');

const { promiseToCrawl } = require('./lib/util');


async function run() {
  const key = core.getInput('APPLITOOLS_API_KEY') || process.env.APPLITOOLS_API_KEY;

  if ( !key ) {
    throw new Error(`Invalid API key: did you remember to set the APPLITOOLS_API_KEY option?`)
  }

  const baseUrl = core.getInput('baseUrl') || process.env.APPLITOOLS_BASE_URL;

  if ( !baseUrl ) {
    throw new Error(`Invalid URL: did you remember to set the url option?`)
  }

  const appName = core.getInput('appName');
  const batchName = core.getInput('batchName');
  const concurrency = core.getInput('concurrency');
  const cypressBrowser = core.getInput('cypressBrowser');
  const maxDepth = core.getInput('maxDepth');
  const serverUrl = core.getInput('serverUrl') || process.env.APPLITOOLS_SERVER_URL;

  let sitemap;

  if ( maxDepth === 1 ) {
    core.debug(`maxDepth set to 1, skipping crawl of ${baseUrl}`);
    sitemap = [baseUrl];
  } else {
    try {
      core.debug(`Crawling ${baseUrl}`);
      sitemap = await promiseToCrawl({
        url: baseUrl,
        maxDepth
      });
    } catch(error) {
      throw new Error(`Failed to crawl ${url}: ${error.message}`);
    }

  }

  core.exportVariable('APPLITOOLS_API_KEY', key);

  const results = await cypress.run({
    browser: cypressBrowser,
    config: {
      baseUrl
    },
    env: {
      APPLITOOLS_APP_NAME: appName,
      APPLITOOLS_BATCH_NAME: batchName,
      APPLITOOLS_CONCURRENCY: concurrency,
      APPLITOOLS_SERVER_URL: serverUrl,
      PAGES_TO_CHECK: sitemap
    },
    headless: true,
    record: false,
  });    

  core.debug('--Start Cypress Results--');
  core.debug(JSON.stringify(results, null, 2));
  core.debug('--End Cypress Results--'); 
}

try {
  run();
} catch(error) {
  core.setFailed(error.message);
}