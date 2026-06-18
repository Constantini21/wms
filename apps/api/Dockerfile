FROM oven/bun:1.3-slim AS base
WORKDIR /app

FROM base AS deps
COPY package.json bun.lock* ./
COPY apps/api/package.json apps/api/package.json
RUN bun install

FROM base AS build
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/api/node_modules ./apps/api/node_modules
COPY . .
WORKDIR /app/apps/api
RUN bunx prisma generate
RUN bun run build

FROM oven/bun:1.3-slim AS runner
WORKDIR /app/apps/api
ENV NODE_ENV=production

RUN apt-get update && apt-get install -y nodejs && rm -rf /var/lib/apt/lists/*

COPY --from=build /app/node_modules /app/node_modules
COPY --from=build /app/apps/api/node_modules ./node_modules
COPY --from=build /app/apps/api/dist ./dist
COPY --from=build /app/apps/api/prisma ./prisma
COPY apps/api/package.json ./package.json
COPY apps/api/docker-entrypoint.sh ./docker-entrypoint.sh
RUN chmod +x ./docker-entrypoint.sh

EXPOSE 3001
ENTRYPOINT ["./docker-entrypoint.sh"]
