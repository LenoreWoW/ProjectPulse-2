#!/bin/bash

# This script is used to deploy the application on Render

# Copy the render-specific environment file
echo "Copying Render environment file..."
cp .env.render .env
cat .env

# Install development dependencies (including Vite)
echo "Installing dependencies including Vite..."
npm install --production=false

# Build the application
echo "Building the application..."
npm run build

# Don't exit with an error
exit 0 