FROM cypress/browsers:node12.18.3-chrome87-ff82

ENV NPM_CACHE_FOLDER=/root/.cache/npm
ENV CYPRESS_CACHE_FOLDER=/root/.cache/Cypress

RUN git clone https://github.com/colbyfayock/applitools-eyes-action && cd applitools-eyes-action

WORKDIR .
COPY . .

RUN npm ci

ENTRYPOINT ["node", "/src/action.js"]
