FROM node:slim

COPY . .

RUN npm ci

ENTRYPOINT ["node", "/src/action.js"]
