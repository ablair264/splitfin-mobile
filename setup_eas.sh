#!/bin/bash
# Quick EAS Setup Script

echo "Setting up EAS Build for Splitfin Mobile..."

# 1. Check if EAS CLI is installed
if ! command -v eas &> /dev/null; then
    echo "Installing EAS CLI..."
    npm install -g eas-cli
fi

# 2. Check if logged in
echo "Checking EAS login status..."
eas whoami || eas login

# 3. Configure the project
echo "Configuring EAS for your project..."
eas build:configure

# 4. Show next steps
echo ""
echo "✅ EAS is configured!"
echo ""
echo "Next steps:"
echo "1. Download your Firebase config files from Firebase Console"
echo "2. Place them in the project root:"
echo "   - google-services.json"
echo "   - GoogleService-Info.plist"
echo ""
echo "3. Run: eas build --profile development --platform all"
echo ""
echo "This will create a development build with Firebase already configured!"
