# Applitools Eyes GitHub Action

Instantly add AI-powered visual regression testing to your site with Applitools Eyes and GitHub Actions.

*Not officially supported by Applitools*

## Getting Started

Include the package as a step directly in an Action Workflow:

```
steps:
- uses: colbyfayock/applitools-eyes-action@main
  with:
    APPLITOOLS_API_KEY: ${{secrets.APPLITOOLS_API_KEY}}
    baseUrl: https://demo.applitools.com/
```

The action requires 2 parameters to work:
* `APPLITOOLS_API_KEY`: your Applitools API Key (recommend to be stored in a GitHub secret)
* `baseUrl`: the URL of the website or web app that you want to test

## What's Inside

This Action relies on 3 core pieces to provide visual testing coverage to a website or web app:
* [Cypress](https://www.cypress.io/)
* [Sitemap Generator](https://github.com/lgraubner/sitemap-generator)
* [Applitools](https://applitools.com/)

Cypress is used as the test runner, providing the ability to spin up an instance of Chrome (or other configured browser) to run visual regression testing.

Sitemap Generator is used to crawl the website (`baseUrl`), providing a sitemap of pages to test in the app.

> Note: the `maxDepth` option of the crawler defaults to `1` meaning it will only capture the `baseUrl` page by default

Applitools Eyes is used to provide AI-powered visual regression testing capabilities to the action.

## Options

The following options can be used as parameters by using the `with` block in the Action Workflow:

| Name               | Required | Default                | Description                                                           |
| ------------------ | -------- | ---------------------- | --------------------------------------------------------------------- |
| APPLITOOLS_API_KEY | Yes      | -                      | Unique API key from your Applitools account                           |
| appName            | No       | Web App                | Name of the website or applitcation                                   |
| baseUrl            | Yes*     | -                      | The website URL to be craweled for visual regression testing          |
| batchName          | No       | GitHub Action Workflow | Name of the batch of tests (for display purpose only).                |
| concurrency        | No       | 5                      | Number of Eyes tests that this Runner will run concurrently           |
| cypressBrowser     | No       | chrome                 | Browser Cypress uses to run tests                                     |
| maxDepth           | No       | 1                      | How many steps deep do you want to crawl the given website?           |
| serverUrl          | No       | -                      | The URL of Eyes server                                                |
| sitemapUrl         | Yes*     | -                      | The URL of a website sitemap to be used for visual regression testing |

*Either a `baseUrl` or `sitemapUrl` URL is required for the action

## Development

### Requirements
* [node](https://nodejs.org/en/)
* [Docker](https://www.docker.com/)*
* [VirtualBox](https://www.virtualbox.org/)*

_*Needed for testing locally_

### Installation

Run the following to install all dependencies:

```
npm install
```

### Testing Locally

The easiest way to test this locally is to use [nektos/act](https://github.com/nektos/act) which spins up a virtual environment locally to run the workflow like it would on GitHub.

> You'll need to have [Docker](https://www.docker.com/) and [VirtualBox](https://www.virtualbox.org/) installed in order for act to spin up the environments.
> 
> [How to install Docker on Mac OS with Homebrew](https://medium.com/crowdbotics/a-complete-one-by-one-guide-to-install-docker-on-your-mac-os-using-homebrew-e818eb4cfc3)

1. Head over to the act repo and follow the installation instructions:

https://github.com/nektos/act

2. Create an `.env` file with an Applitools API Key and Base URL

```
# .env
APPLITOOLS_API_KEY="[Your API Key]"
APPLITOOLS_BASE_URL="[Your Website]"
```

3. Run the act command locally:

```
$ act
```

If you'd like to test that it's running properly before running the tests themselves, you can pass in the `-n` flag to dry run the workflow:

```
$ act -n
```
