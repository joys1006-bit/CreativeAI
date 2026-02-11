# Base image with Node.js 18
FROM node:18-slim

# Install FFmpeg (Critical for audio processing)
RUN apt-get update && \
    apt-get install -y ffmpeg python3 make g++ && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy package files first for caching
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Create uploads directory
RUN mkdir -p uploads temp

# Expose port
EXPOSE 8000

# Start command
CMD ["npm", "start"]
