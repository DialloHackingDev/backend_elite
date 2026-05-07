FROM node:20-alpine

# Set working directory
WORKDIR /usr/src/app

# Install openssl (required for Prisma)
RUN apk add --no-cache openssl

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy the rest of the application code
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Expose port
EXPOSE 3000

# Copy and make start script executable
COPY start.sh .
RUN chmod +x start.sh

# Start command
CMD ["./start.sh"]
