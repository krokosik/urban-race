# Stage 1: Build the application
FROM node:22.4.0-alpine AS builder

WORKDIR /usr/src/app

RUN apk update && apk add --no-cache libc6-compat

COPY package.json .
COPY package-lock.json .

COPY apps/backend/package.json ./apps/backend/package.json
COPY apps/frontend/package.json ./apps/frontend/package.json

RUN npm ci

COPY . .

RUN npm run build

RUN npm prune --production

# Stage 2: Setup production environment
FROM builder AS production

WORKDIR /usr/src/app

COPY --from=builder /usr/src/app .

ENV NODE_ENV=production

CMD ["npm", "run", "start"]