#!/bin/bash
echo "Current Node version:"
node --version
echo ""
echo "Available Node versions (if using nvm):"
nvm list 2>/dev/null || echo "nvm not installed"
