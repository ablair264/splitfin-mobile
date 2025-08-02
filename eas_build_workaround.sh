#!/bin/bash

echo "🔧 Temporarily bypassing Firebase imports for EAS build..."

# Backup the original App.tsx
cp App.tsx App.tsx.backup

# Use the temporary App without Firebase imports
cp App.temp.tsx App.tsx

echo "📱 Starting EAS build..."
echo ""
echo "Make sure you have downloaded and placed these files in the project root:"
echo "  - google-services.json (for Android)"
echo "  - GoogleService-Info.plist (for iOS)"
echo ""
read -p "Have you placed the Firebase config files? (y/n) " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
    # Run EAS build
    eas build --profile development --platform all
    
    # Restore original App.tsx after build starts
    sleep 5
    cp App.tsx.backup App.tsx
    rm App.tsx.backup
    echo "✅ Original App.tsx restored"
else
    # Restore without building
    cp App.tsx.backup App.tsx
    rm App.tsx.backup
    echo "❌ Build cancelled. Original App.tsx restored"
    echo ""
    echo "Please download the Firebase config files from:"
    echo "https://console.firebase.google.com/project/splitfin-609c9/settings/general"
fi
