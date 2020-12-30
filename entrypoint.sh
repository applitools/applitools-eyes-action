#!/bin/sh -l

cd $GITHUB_WORKSPACE

git clone https://github.com/colbyfayock/applitools-eyes-action
cd applitools-eyes-action

npm ci

ls -la

node ./src/action.js