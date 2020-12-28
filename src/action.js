const core = require('@actions/core');

async function run() {
  core.debug(`Hello world!`);
  console.log('hello world');
}

run();