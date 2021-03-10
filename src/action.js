require('dotenv').config();

const core = require('@actions/core');
const cypress = require('cypress');

const { promiseToCrawl, promiseToGetAndReadSitemap } = require('./lib/util');

const prefix = `[Applitools Eyes Action]`;

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
  const errorOnFailure = core.getInput('errorOnFailure');
  const maxDepth = core.getInput('maxDepth');
  const serverUrl = core.getInput('serverUrl') || process.env.APPLITOOLS_SERVER_URL;

  let pagesToCheck = [];

  if ( baseUrl ) {
    console.log(`${prefix} Found baseUrl: ${baseUrl}`);
    if ( maxDepth === 1 ) {
      console.log(`${prefix} maxDepth set to 1, skipping crawl of ${baseUrl}`);
      pagesToCheck.push(baseUrl);
    } else {
      try {
        console.log(`${prefix} Crawling ${baseUrl}`);
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
    console.log(`${prefix} Found sitemapUrl: ${sitemapUrl}`);
    try {
      const sitemapList = await promiseToGetAndReadSitemap(sitemapUrl);
      pagesToCheck = pagesToCheck.concat(sitemapList);
    } catch(error) {
      throw new Error(`Failed to get sitemap ${sitemapUrl}: ${error.message}`);
    }
  }

  core.exportVariable('APPLITOOLS_API_KEY', key);

  core.exportVariable('APPLITOOLS_CONCURRENCY', concurrency);
  console.log(`${prefix} Concurrency set to ${process.env.APPLITOOLS_CONCURRENCY}`);

  let results;

  try {
    results = await cypress.run({
      browser: cypressBrowser,
      config: {
        baseUrl
      },
      env: {
        APPLITOOLS_APP_NAME: appName,
        APPLITOOLS_BATCH_NAME: batchName,
        APPLITOOLS_SERVER_URL: serverUrl,
        PAGES_TO_CHECK: pagesToCheck
      },
      headless: true,
      record: false,
    });    
  
    console.log('${prefix} --Start Cypress Results--');
    console.log(JSON.stringify(results, null, 2));
    console.log('${prefix} --End Cypress Results--'); 
  } catch(error) {
    throw new Error(`Failed to run Eyes check: ${error.message}`);
  }

  if ( errorOnFailure && results.totalFailed > 0 ) {
    throw new Error(`${prefix} Unsuccessful with ${results.totalFailed} failing tests!`)
  }

  console.log(`${prefix} Success!`);
}

try {
  run();
} catch(error) {
  console.log(`${prefix} ERROR: ${error.message}`);
  core.setFailed(error.message);
}