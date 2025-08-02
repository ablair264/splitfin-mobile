#!/bin/bash

echo "🔍 Checking your environment..."
echo ""
echo "Node version: $(node --version)"
echo "NPM version: $(npm --version)"
echo ""

# Check if Node version is 22 or higher
NODE_MAJOR_VERSION=$(node --version | cut -d'.' -f1 | sed 's/v//')

if [ "$NODE_MAJOR_VERSION" -ge 22 ]; then
    echo "❌ You're using Node.js v$NODE_MAJOR_VERSION"
    echo "   React Native Firebase has issues with Node 22+"
    echo ""
    echo "🛠️  Solutions:"
    echo ""
    echo "1. Use Node 20 LTS (Recommended):"
    echo "   brew install node@20 && brew link --overwrite node@20"
    echo ""
    echo "2. Use EAS Build (No local setup needed):"
    echo "   eas build --profile development --platform all"
    echo ""
    echo "3. Use nvm to switch Node versions:"
    echo "   nvm install 20 && nvm use 20"
else
    echo "✅ Your Node version should work with React Native Firebase"
    echo ""
    echo "Try running:"
    echo "npx expo prebuild --clean"
fi
