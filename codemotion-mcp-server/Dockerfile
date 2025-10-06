FROM node:18-alpine

WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Build TypeScript
RUN npx tsc

# Expose port
EXPOSE 3000

# Command to run the application
CMD ["node", "dist/src/index.js"]