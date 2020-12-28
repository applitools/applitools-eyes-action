FROM node:slim

RUN npm install --production

ENTRYPOINT ["node", "/src/action.js"]
