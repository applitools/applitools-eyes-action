require('dotenv').config();

const core = require('@actions/core');
const cypress = require('cypress');

const { promiseToCrawl, promiseToGetAndReadSitemap } = require('./lib/util');


async function run() {
  const key = core.getInput('APPLITOOLS_API_KEY') || process.env.APPLITOOLS_API_KEY;

  if ( !key ) {
    throw new Error(`Invalid API key: did you remember to set the APPLITOOLS_API_KEY option?`)
  }

  const baseUrl = core.getInput('baseUrl') || process.env.APPLITOOLS_BASE_URL;
  const sitemapUrl = core.getInput('sitemapUrl') || process.env.APPLITOOLS_SITEMAP_URL;

  if ( !baseUrl && !sitemapUrl ) {
    throw new Error(`Invalid URL: did you remember to set a baseUrl or sitemapUrl option?`);
  }

  const appName = core.getInput('appName');
  const batchName = core.getInput('batchName');
  const concurrency = core.getInput('concurrency');
  const cypressBrowser = core.getInput('cypressBrowser');
  const maxDepth = core.getInput('maxDepth');
  const serverUrl = core.getInput('serverUrl') || process.env.APPLITOOLS_SERVER_URL;

  let pagesToCheck = [];

  if ( baseUrl ) {
    if ( maxDepth === 1 ) {
      core.debug(`maxDepth set to 1, skipping crawl of ${baseUrl}`);
      pagesToCheck.push(baseUrl);
    } else {
      try {
        core.debug(`Crawling ${baseUrl}`);
        const crawledPages = await promiseToCrawl({
          url: baseUrl,
          maxDepth
        });
        pagesToCheck = pagesToCheck.concat(crawledPages);
      } catch(error) {
        throw new Error(`Failed to crawl ${url}: ${error.message}`);
      }
    }
  }

  if ( sitemapUrl ) {
    try {
      const sitemapList = await promiseToGetAndReadSitemap(sitemapUrl);
      pagesToCheck = pagesToCheck.concat(sitemapList);
    } catch(error) {
      throw new Error(`Failed to get sitemap ${sitemapUrl}: ${error.message}`);
    }
  }

  core.exportVariable('APPLITOOLS_API_KEY', key);

  try {
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
        PAGES_TO_CHECK: pagesToCheck
      },
      headless: true,
      record: false,
    });    
  
    core.debug('--Start Cypress Results--');
    core.debug(JSON.stringify(results, null, 2));
    core.debug('--End Cypress Results--'); 
  } catch(error) {
    throw new Error(`Failed to run Eyes check: ${error.message}`);
  }
}

try {
  run();
} catch(error) {
  core.setFailed(error.message);
}