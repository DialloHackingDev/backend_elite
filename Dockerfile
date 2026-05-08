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

# Expose port
EXPOSE 3000

# Make start script executable
RUN chmod +x start.sh

# Start command
CMD ["./start.sh"]
