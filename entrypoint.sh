#!/bin/sh -l

cd $GITHUB_WORKSPACE

ls -la

git clone https://github.com/colbyfayock/applitools-eyes-action
cd applitools-eyes-action

npm ci

node ./src/action.js