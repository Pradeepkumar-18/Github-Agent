# Base stage
FROM node:20-alpine AS base
RUN npm install -g pnpm
WORKDIR /app

# Dependencies stage
FROM base AS dependencies
COPY package.json pnpm-lock.yaml* ./
RUN pnpm install --frozen-lockfile

# Build stage
FROM dependencies AS build
COPY . .
RUN pnpm run build

# Production stage
FROM base AS production
ENV NODE_ENV=production
COPY --from=dependencies /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/package.json ./package.json

EXPOSE 3000
CMD ["node", "dist/main"]
