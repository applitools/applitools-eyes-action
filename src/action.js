const fs = require('fs');
const core = require('@actions/core');
const exec = require('@actions/exec');
const io = require('@actions/io');
const { parseString } = require('xml2js');
const SitemapGenerator = require('sitemap-generator');
const cypress = require('cypress');

const SITEMAP_FILE_LOCATION = './';
const SITEMAP_FILENAME = 'EYES-SITEMAP.xml';

/**
 * promiseToConvertXmlToJson
 */

function promiseToConvertXmlToJson(xml) {
  const errorBase = `Failed to convert XML to JSON`;
  return new Promise((resolve, reject) => {
    parseString(xml, function (error, result) {
      if ( error ) {
        reject(`${errorBase} ${error}`);
        return;
      }
      resolve(result);
    });
  })
}

/**
 * promiseToCrawl
 */

function promiseToCrawl({ url, depth }) {
  const errorBase = `Failed to crawl url ${url}`;
  return new Promise((resolve, reject) => {
    const filepath = `${SITEMAP_FILE_LOCATION}${SITEMAP_FILENAME}`;
    
    core.debug(`Storing sitemap at: ${filepath}`);

    const generator = SitemapGenerator(url, {
      stripQuerystring: false,
      filepath,
      maxDepth: depth
    });

    generator.on('done', async () => {
      core.debug(`Sitemap successfully created`);

      let sitemap;
      
      try {
        sitemap = await promiseToReadFile(filepath);
      } catch(e) {
        reject(e);
        return;
      }

      await io.rmRF(filepath);

      const { urlset } = await promiseToConvertXmlToJson(sitemap)

      sitemap = urlset.url.map(({ loc }) => loc && loc[0]).filter(loc => !!loc);
      
      resolve(sitemap);
    });

    generator.on('error', (error) => {
      core.debug(`Sitemap produced an error: ${JSON.stringify(error)}`);

      if ( error.url === url ) {
        reject(`${errorBase}: ${error.message}`);
      }
    });

    generator.start();
  });
}

/**
 * promiseToReadFile
 */

function promiseToReadFile(file) {
  return new Promise((resolve, reject) => {
    fs.readFile(file, 'utf8' , (error, data) => {
      if (error) {
        reject(error);
        return;
      }
      resolve(data);
    })
  })
}

async function run() {

  const depth = 1;
  const url = 'https://colbyfayock.com';
  const key = 'TESTINGARANDOMKEY';
  let sitemap;

  try {
    core.debug(`Crawling ${url}`);
    sitemap = await promiseToCrawl({
      url,
      depth
    });
  } catch(e) {
    console.log(e);
    return;
  }

  console.log('sitemap', sitemap);

  core.exportVariable('TEST_KEY', 'testing');

  core.setSecret(key);
  core.exportVariable('APPLITOOLS_API_KEY', key);

  const results = await cypress.run({
    config: {
      baseUrl: url
    },
    env: {
      // APPLITOOLS_BROWSERS: JSON.stringify(inputs.browser),
      // APPLITOOLS_FAIL_BUILD_ON_DIFF: inputs.failBuildOnDiff,
      // APPLITOOLS_SERVER_URL: inputs.serverUrl,
      // APPLITOOLS_IGNORE_SELECTOR: inputs.ignoreSelector
      //   ? inputs.ignoreSelector
      //       .split(',')
      //       .map((selector) => ({ selector: selector.trim() }))
      //   : [],
      APPLITOOLS_CONCURRENCY: 5, // inputs.concurrency,
      PAGES_TO_CHECK: sitemap,
      CYPRESS_CACHE_FOLDER: '/github/home/.cache/Cypress'
    },
    record: false,
  });    

  console.log('results', results);
}

run();