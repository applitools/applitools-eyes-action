require('dotenv').config();

const fs = require('fs').promises;
const core = require('@actions/core');
const github = require('@actions/github');
const cypress = require('cypress');

const { promiseToCrawl, promiseToGetAndReadSitemap, waitFor200 } = require('./lib/util');
const { getBatchByPointerId } = require('./lib/applitools');

const prefix = `[Applitools Eyes Action]`;

const applitoolsHomeUrl = 'https://info.applitools.com/udhLl'
const apptliioolsLogoUrl = 'https://user-images.githubusercontent.com/1045274/115064087-822c9e80-9eba-11eb-9137-653bb32c9b0b.png';

async function run() {
  const key = core.getInput('APPLITOOLS_API_KEY') || process.env.APPLITOOLS_API_KEY;
  const batchId = core.getInput('APPLITOOLS_BATCH_ID') || process.env.APPLITOOLS_BATCH_ID;
  const githubToken = core.getInput('GITHUB_TOKEN') || process.env.GITHUB_TOKEN;

  const { context = {} } = github;
  const { ref } = context;
  const { ref, pull_request, repository } = context.payload;
  const isPullRequest = pull_request && pull_request.number;
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

  console.log(`${prefix} --Start context--`);
  console.log(JSON.stringify(context, null, 2));
  console.log(`${prefix} --End context--`);

  let ignoreSelector = core.getInput('ignoreSelector');
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

  ignoreSelector = ignoreSelector ? ignoreSelector.split(',').map(selector => ({ selector: selector.trim() })) : []

  core.exportVariable('APPLITOOLS_API_KEY', key);

  if ( batchId ) {
    core.exportVariable('APPLITOOLS_BATCH_ID', batchId);
  }

  const applitoolsConfig = {
    testConcurrency: concurrency && parseInt(concurrency),
    baselineBranchName: `${repository.full_name}/${ref.replace('refs/heads/', '')}`
  }

  if ( isPullRequest ) {
    applitoolsConfig.parentBranchName = `${repository.full_name}/`;
  }

  console.log(`${prefix} --Start Applitools Config--`);
  console.log(JSON.stringify(applitoolsConfig, null, 2));
  console.log(`${prefix} --End Applitools config--`);

  console.log(`${prefix} Writing applitools.config.js`);

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
        APPLITOOLS_IGNORE_SELECTOR: ignoreSelector,
        PAGES_TO_CHECK: pagesToCheck
      },
      headless: true,
      record: false,
    });

    console.log(`${prefix} --Start Cypress Results--`);
    console.log(JSON.stringify(results, null, 2));
    console.log(`${prefix} --End Cypress Results--`);
  } catch(error) {
    errors.push(`Failed to run Eyes check: ${error.message}`)
  }


  if ( octokit ) {
    try {
      const batchResults = await waitFor200(() => getBatchByPointerId(batchId))

      console.log(`${prefix} --Start Applitools Results--`);
      console.log(JSON.stringify(batchResults, null, 2))
      console.log(`${prefix} --End Applitools Results--`);

      const { completedCount, failedCount, passedCount, unresolvedCount } = batchResults;

      await octokit.repos.createCommitStatus({
        ...context.repo,
        sha: batchId,
        state: failedCount > 0 ? 'failure' : 'success'
      });

      if ( isPullRequest ) {

        const bodyReturn = "\n";
        let bodyParts = [
          `## <a href="${applitoolsHomeUrl}"><img width="140" src="${apptliioolsLogoUrl}" alt="Applitools"></a>`
        ];

        if ( completedCount > 1 ) {
          bodyParts.push(`${completedCount} visual tests have completed.`)
        } else if ( completedCount === 1 ) {
          bodyParts.push(`${completedCount} visual test has completed.`)
        } else {
          bodyParts.push(`No visual tests ran.`)
        }

        bodyParts.push(bodyReturn);

        if ( completedCount > 0 ) {
          bodyParts = bodyParts.concat([
            `✅ Passed: ${passedCount} / ${completedCount}`,
            `❌ Failed: ${failedCount} / ${completedCount}`,
            `⚠️ Unresolved: ${unresolvedCount} / ${completedCount}`
          ])
        }

        bodyParts.push(bodyReturn);

        bodyParts.push(`[Log in at applitools.com](${applitoolsHomeUrl}) for more details!`)

        await octokit.issues.createComment({
          ...context.repo,
          issue_number: pull_request.number,
          body: bodyParts.join(bodyReturn)
        });
      }
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