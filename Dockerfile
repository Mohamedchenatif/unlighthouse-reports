FROM ghcr.io/puppeteer/puppeteer:21.6.0

# Set working directory
WORKDIR /app

# Set environment variables
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/google-chrome-stable

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy application files
COPY . .

# Create necessary directories
RUN mkdir -p reports public

# Expose port
EXPOSE 3000

# Start the application
CMD ["npm", "start"]
