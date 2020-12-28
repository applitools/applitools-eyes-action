FROM node:slim

COPY . .

RUN npm ci
RUN npm run crawl
RUN cat sitemap.xml
run npm test

ENTRYPOINT ["node", "/src/action.js"]
