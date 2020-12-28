FROM cypress/base:12

COPY . .

ENV CYPRESS_CACHE_FOLDER /github/home/.cache/Cypress

RUN npm ci

ENTRYPOINT ["node", "/src/action.js"]
