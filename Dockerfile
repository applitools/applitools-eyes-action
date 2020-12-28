FROM cypress/base:12

COPY . .

RUN npm ci

ENTRYPOINT ["node", "/src/action.js"]
