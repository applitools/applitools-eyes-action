FROM node:slim

RUN npm ci

ENTRYPOINT ["node", "/src/action.js"]