# Use Node.js LTS version (lightweight image)
FROM node:20-alpine

# Install PostgreSQL client for readiness checks
RUN apk add --no-cache postgresql-client

# Set working directory
WORKDIR /app

# Copy only dependency files for better Docker cache
COPY package*.json ./

# Install all dependencies (dev + prod)
RUN npm install

# Copy Prisma schema files
COPY prisma ./prisma/

# Generate Prisma Client
RUN npx prisma generate

# Copy rest of the backend source code
COPY . .

# Copy and create root .env file
COPY .env.example .env

# Build the application (NestJS → dist/)
RUN npm run build

# Optional: verify output
RUN ls -la dist/

# Expose NestJS app port
EXPOSE 3001

# JSON-style CMD to:
# 1. Wait for PostgreSQL to be ready
# 2. Run `prisma db push` to sync schema
# 3. Start the app
CMD ["sh", "-c", "echo 'Waiting for database...' && \
  until pg_isready -h db -p 5432 -U postgres; do sleep 2; done && \
  echo 'Database ready! Setting up schema...' && \
  npx prisma db push && \
  echo 'Starting application...' && \
  npm run start:dev"]
