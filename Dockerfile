FROM cypress/base:12
RUN --mount=type=cache,target=/github/home/.cache/Cypress

COPY . .

ENV CYPRESS_CACHE_FOLDER /github/home/.cache/Cypress

RUN npm ci

ENTRYPOINT ["node", "/src/action.js"]
