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

# Create a placeholder .env for prisma generate during build
RUN echo 'DATABASE_URL=postgresql://placeholder:placeholder@localhost:5432/placeholder' > .env

# Generate Prisma client (required for the app to work)
RUN npx prisma generate --schema=./prisma/schema.prisma

# Remove the placeholder .env
RUN rm -f .env

# Expose port
EXPOSE 3000

# Make start script executable
RUN chmod +x start.sh

# Start command
CMD ["./start.sh"]
