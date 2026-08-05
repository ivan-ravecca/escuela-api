FROM node:22-bookworm-slim AS build

WORKDIR /app

COPY package*.json ./
RUN npm ci --ignore-scripts

COPY tsconfig.json ./
COPY src ./src
COPY README.md ./README.md
COPY ASSISTANT_README.md ./ASSISTANT_README.md
COPY ARCHITECTURE.md ./ARCHITECTURE.md

RUN npm run build

FROM node:22-bookworm-slim AS runtime

WORKDIR /app
ENV NODE_ENV=production

COPY package*.json ./
RUN npm ci --omit=dev --ignore-scripts && npm cache clean --force

COPY --from=build /app/dist ./dist
COPY src/templates ./src/templates
COPY docker-entrypoint.sh ./docker-entrypoint.sh

RUN chmod +x ./docker-entrypoint.sh

EXPOSE 3000

ENTRYPOINT ["./docker-entrypoint.sh"]