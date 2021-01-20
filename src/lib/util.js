const fs = require('fs');
const fetch = require('node-fetch');
const core = require('@actions/core');
const io = require('@actions/io');
const { parseString } = require('xml2js');
const SitemapGenerator = require('sitemap-generator');

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

module.exports.promiseToConvertXmlToJson = promiseToConvertXmlToJson;

/**
 * promiseToCrawl
 */

function promiseToCrawl({ url, maxDepth }) {
  const errorBase = `Failed to crawl url ${url}`;
  return new Promise((resolve, reject) => {
    const filepath = `${SITEMAP_FILE_LOCATION}${SITEMAP_FILENAME}`;

    core.debug(`Storing sitemap at: ${filepath}`);

    const generator = SitemapGenerator(url, {
      stripQuerystring: false,
      filepath,
      maxDepth
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

      sitemap = await promiseToConvertXmlToJson(sitemap);

      sitemap = convertSitemapXmlToSiteList(sitemap)

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

module.exports.promiseToCrawl = promiseToCrawl;

/**
 * promiseToGetAndReadSitemap
 */

async function promiseToGetAndReadSitemap(url) {
  const response = await fetch(url);
  const body = await response.text();

  let sitemap = await promiseToConvertXmlToJson(body);

  return convertSitemapXmlToSiteList(sitemap);
}

module.exports.promiseToGetAndReadSitemap = promiseToGetAndReadSitemap;


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

module.exports.promiseToReadFile = promiseToReadFile;

/**
 * convertSitemapXmlToSiteList
 */

function convertSitemapXmlToSiteList(xml = {}) {
    const { urlset } = xml;
    return urlset.url.map(({ loc }) => loc && loc[0]).filter(loc => !!loc);
}