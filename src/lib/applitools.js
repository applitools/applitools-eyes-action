const fetch = require('node-fetch');

const API_HOSTNAME = 'eyesapi.applitools.com';

/**
 * getBatchById
 */

async function getBatchById(id) {
  const apiKey = process.env.APPLITOOLS_API_KEY;
  const url = `https://${API_HOSTNAME}/api/Sessions/batches/${id}/batch?apiKey=${apiKey}`;
  const response = await fetch(url);
  const json = await response.json();
  return json;
}

module.exports.getBatchById = getBatchById;