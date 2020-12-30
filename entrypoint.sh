#!/bin/sh -l

cd $GITHUB_WORKSPACE

npm ci

node /src/action.js