FROM cypress/base:12

WORKDIR .
COPY . .

ENV NPM_CACHE_FOLDER=/root/.cache/npm
ENV CYPRESS_CACHE_FOLDER=/root/.cache/Cypress

RUN npm ci

ENTRYPOINT ["node", "/src/action.js"]
