FROM node:18-slim

# Install OpenSCAD and dependencies
RUN apt-get update && apt-get install -y \
    openscad \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy application files
COPY . .

# Create temp directory for STL generation
RUN mkdir -p temp

# Expose port
EXPOSE 3000

# Start server
CMD ["node", "server.js"]

