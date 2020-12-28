FROM cypress/base:12

COPY . .

RUN npm ci
RUN npm run crawl
RUN cat sitemap.xml
run npm test

ENTRYPOINT ["node", "/src/action.js"]
