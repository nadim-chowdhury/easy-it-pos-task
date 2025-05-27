# Multi-stage build for production optimization
FROM node:18-alpine AS base
RUN apk add --no-cache libc6-compat openssl curl
WORKDIR /app

# Development stage
FROM base AS development
# Copy package files first for better caching
COPY package.json package-lock.json* ./

# Install all dependencies (including dev dependencies)
RUN npm ci

# Copy source code
COPY . .

# Generate Prisma client
RUN npx prisma generate
RUN npx prisma migrate dev --name init --skip-seed
# RUN npx prisma db push

EXPOSE 3001

# Use npm script instead of npx
CMD ["npm", "run", "start:dev"]

# Production dependencies only
FROM base AS deps
COPY package.json package-lock.json* ./
RUN npm ci --only=production && npm cache clean --force

# Build stage
FROM base AS builder
COPY package.json package-lock.json* ./
RUN npm ci
COPY . .
RUN npx prisma generate
RUN npm run build

# Production stage
FROM base AS production
ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nestjs

# Copy necessary files
COPY --from=deps /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/prisma ./prisma
COPY package.json ./

# Set ownership
RUN chown -R nestjs:nodejs /app

USER nestjs

EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3001 || exit 1

CMD ["node", "dist/main.js"]