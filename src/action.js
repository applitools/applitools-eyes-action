require('dotenv').config();

const fs = require('fs').promises;
const core = require('@actions/core');
const github = require('@actions/github');
const cypress = require('cypress');

const { promiseToCrawl, promiseToGetAndReadSitemap, waitFor200 } = require('./lib/util');
const { getBatchByPointerId } = require('./lib/applitools');

const prefix = `[Applitools Eyes Action]`;

async function run() {
  const key = core.getInput('APPLITOOLS_API_KEY') || process.env.APPLITOOLS_API_KEY;
  const batchId = core.getInput('APPLITOOLS_BATCH_ID') || process.env.APPLITOOLS_BATCH_ID;
  const githubToken = core.getInput('GITHUB_TOKEN') || process.env.GITHUB_TOKEN;

  const { context = {} } = github;
  let octokit;

  if ( !key ) {
    throw new Error(`Invalid API key: did you remember to set the APPLITOOLS_API_KEY option?`)
  }

  if ( githubToken) {
    octokit = github.getOctokit(githubToken);
  }

  if ( octokit ) {
    await octokit.repos.createCommitStatus({
      ...context.repo,
      sha: batchId,
      state: 'pending'
    });
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

  if ( batchId ) {
    core.exportVariable('APPLITOOLS_BATCH_ID', batchId);
  }

  const applitoolsConfig = {
    testConcurrency: concurrency && parseInt(concurrency)
  }

  console.log(`${prefix} Writing applitools.config.js`);
  console.log(JSON.stringify(applitoolsConfig, null, 2));

  await fs.writeFile('./applitools.config.js', `module.exports = ${JSON.stringify(applitoolsConfig)}`, 'utf8');

  let results;
  let errors = [];

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
  
    console.log(`${prefix} --Start Cypress Results-`);
    console.log(JSON.stringify(results, null, 2));
    console.log(`${prefix} --End Cypress Results--`); 
  } catch(error) {
    errors.push(`Failed to run Eyes check: ${error.message}`)
  }  


  if ( octokit ) {
    try {
      console.log('octokit');

      const batchResults = await waitFor200(getBatchByPointerId(batchId))
      const { failedCount } = batchResults;
      console.log('batchResults', JSON.stringify(batchResults, null, 2))

      await octokit.repos.createCommitStatus({
        ...context.repo,
        sha: batchId,
        state: failedCount > 0 ? 'failure' : 'success'
      });
    } catch(error) {
      errors.push(`Failed to get Eyes batch: ${error.message}`)
    }
  }  

  if ( errorOnFailure && results.totalFailed > 0 ) {
    errors.push(`${prefix} Unsuccessful with ${results.totalFailed} failing tests!`);
  }

  if ( errors.length > 0 ) {

    if ( octokit ) {
      await octokit.repos.createCommitStatus({
        ...context.repo,
        sha: batchId,
        state: 'error'
      });
    }

    core.setFailed(errors.join(';'));
    return;
  }


  if ( octokit ) {
    await octokit.repos.createCommitStatus({
      ...context.repo,
      sha: batchId,
      state: 'success'
    });
  }

  console.log(`${prefix} Success!`);
}

try {
  run();
} catch(error) {
  console.log(`${prefix} ERROR: ${error.message}`);
  core.setFailed(error.message);
}