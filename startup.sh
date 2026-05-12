#!/bin/bash
echo "KRA Navigator App Service Startup Script"
echo "========================================"
echo "Current directory: $(pwd)"
echo "Node version: $(node --version)"
echo "npm version: $(npm --version)"
echo ""

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
  echo "Installing dependencies..."
  npm ci --production
  echo "Dependencies installed ✓"
else
  echo "Dependencies already present ✓"
fi

# Check if dist/client exists
if [ ! -d "dist/client" ]; then
  echo "ERROR: dist/client directory not found!"
  echo "Please rebuild the application"
  exit 1
else
  echo "Build artifacts found ✓"
  echo "dist/client contents:"
  ls -la dist/client/ | head -10
fi

echo ""
echo "Starting application..."
node server.js
