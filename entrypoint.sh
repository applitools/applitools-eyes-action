#!/bin/sh -l

cd $GITHUB_WORKSPACE

git clone https://github.com/colbyfayock/applitools-eyes-action
mv applitools-eyes-action/* .
rm -rf applitools-eyes-action

npm ci

node /src/action.js