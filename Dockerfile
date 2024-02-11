# Build Stage
FROM node:16 AS build

# Set working directory
WORKDIR /usr/src/app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy necessary files for build
COPY . .
RUN mkdir logs && npm run build

# Final Stage
FROM node:16

# Install system dependencies
RUN apt-get update && apt-get install -y \
    poppler-utils \
    libreoffice \
    libpoppler-cpp-dev \
    pkg-config \
    python3-pip \
    && pip3 install pdftotext \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Create a non-root user
RUN useradd -m appuser

# Set working directory
WORKDIR /usr/src/app

# Copy necessary files from build stage
COPY --from=build /usr/src/app /usr/src/app

# Change ownership of the logs directory to appuser
RUN chown -R appuser:appuser /usr/src/app/

# Switch to non-root user
USER appuser

# Expose necessary ports
EXPOSE 4000

# Start the application
CMD ["npm", "start"]
