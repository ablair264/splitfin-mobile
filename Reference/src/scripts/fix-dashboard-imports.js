#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Files to update
const dashboardFiles = [
  'src/components/Dashboard/Dashboard.tsx',
  'src/components/Dashboard/BrandComponents.tsx',
  'src/components/Dashboard/DashboardComponents.tsx',
  'src/components/Dashboard/InvoicesTable.tsx',
  'src/components/Dashboard/OrdersTable.tsx'
];

// Import replacements
const replacements = [
  // UI components
  { from: /@\/components\/ui\/tabs/g, to: '../ui/tabs' },
  { from: /@\/components\/ui\/button/g, to: '../ui/button' },
  { from: /@\/components\/ui\/select/g, to: '../ui/select' },
  { from: /@\/components\/ui\/card/g, to: '../ui/card' },
  { from: /@\/components\/ui\/table/g, to: '../ui/table' },
  { from: /@\/components\/ui\/badge/g, to: '../ui/badge' },
  
  // Utils
  { from: /@\/lib\/utils/g, to: '../../lib/utils' },
  
  // Firebase
  { from: /@\/lib\/firebase/g, to: '../../firebase' },
  
  // Hooks
  { from: /@\/hooks\/useAuth/g, to: '../../contexts/AuthContext' },
  { from: /@\/hooks\/useDashboardData/g, to: '../../hooks/dashboardAdapters' },
  { from: /@\/hooks\/useBrandData/g, to: '../../hooks/dashboardAdapters' },
  
  // Contexts
  { from: /@\/contexts\/DashboardCacheContext/g, to: '../../contexts/DashboardCacheContext' }
];

// Process each file
dashboardFiles.forEach(filePath => {
  const fullPath = path.join(process.cwd(), filePath);
  
  if (fs.existsSync(fullPath)) {
    let content = fs.readFileSync(fullPath, 'utf8');
    
    // Apply all replacements
    replacements.forEach(({ from, to }) => {
      content = content.replace(from, to);
    });
    
    // Write back
    fs.writeFileSync(fullPath, content);
    console.log(`Updated imports in ${filePath}`);
  } else {
    console.log(`File not found: ${filePath}`);
  }
});

// Also fix the UI components that use @/ imports
const uiFiles = [
  'src/components/ui/alert.tsx',
  'src/components/ui/avatar.tsx',
  'src/components/ui/badge.tsx',
  'src/components/ui/button.tsx',
  'src/components/ui/calendar.tsx',
  'src/components/ui/card.tsx',
  'src/components/ui/dropdown-menu.tsx',
  'src/components/ui/input.tsx',
  'src/components/ui/label.tsx',
  'src/components/ui/progress.tsx',
  'src/components/ui/radio-group.tsx',
  'src/components/ui/select.tsx',
  'src/components/ui/table.tsx',
  'src/components/ui/tabs.tsx',
  'src/components/ui/toast.tsx',
  'src/components/ui/toaster.tsx',
  'src/components/ui/use-toast.ts'
];

const uiReplacements = [
  { from: /@\/lib\/utils/g, to: '../../lib/utils' },
  { from: /@\/components\/ui\/button/g, to: './button' },
  { from: /@\/components\/ui\/toast/g, to: './toast' },
  { from: /@\/components\/ui\/use-toast/g, to: './use-toast' }
];

uiFiles.forEach(filePath => {
  const fullPath = path.join(process.cwd(), filePath);
  
  if (fs.existsSync(fullPath)) {
    let content = fs.readFileSync(fullPath, 'utf8');
    
    // Apply UI-specific replacements
    uiReplacements.forEach(({ from, to }) => {
      content = content.replace(from, to);
    });
    
    // Write back
    fs.writeFileSync(fullPath, content);
    console.log(`Updated imports in ${filePath}`);
  }
});

console.log('Import fixes complete!');