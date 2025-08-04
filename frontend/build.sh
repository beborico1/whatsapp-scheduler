#!/bin/bash
# Build script for Railway to ensure environment variables are set

echo "Building with API URL: ${REACT_APP_API_URL:-not set}"

# If REACT_APP_API_URL is not set, use production default
if [ -z "$REACT_APP_API_URL" ]; then
  export REACT_APP_API_URL="https://web-production-f5270.up.railway.app/api"
fi

# Build the app
npm run build