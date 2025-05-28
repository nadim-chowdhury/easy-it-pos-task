# Use Node.js 20 to match backend
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install --legacy-peer-deps

# Copy the rest of the app
COPY . .

# Copy and create root .env file
COPY .env.example .env

# Build the Next.js app
RUN npm run build

# Verify build output
RUN ls -la .next/ || echo "Next.js build output not found"

# Expose frontend port
EXPOSE 3000

# Start the Next.js app
CMD ["npm", "run", "start"]