# Use Node.js LTS version
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Install Nest CLI globally (optional but good for debugging)
RUN npm install -g @nestjs/cli

# Copy rest of the code
COPY . .

# Generate Prisma Client
RUN npx prisma generate

# Build NestJS app
RUN npm run build

# Sanity check: ensure dist/main.js exists
RUN ls -lh dist

# Expose backend port
EXPOSE 3001

# Run in production mode
CMD ["npm", "run", "start:dev"]
