// Script to find the main return statement in Dashboard.tsx
const fs = require('fs');
const path = require('path');

const dashboardPath = path.join(__dirname, 'Dashboard.tsx');
const content = fs.readFileSync(dashboardPath, 'utf8');

// Find the main component's return
const lines = content.split('\n');

// Search for the main return statement
let inMainReturn = false;
let parenCount = 0;
let mainReturnStart = -1;
let mainReturnEnd = -1;

// Start searching from the end going backwards
for (let i = lines.length - 1; i >= 0; i--) {
  const line = lines[i].trim();
  
  // Check for closing braces/parens that might indicate end of return
  if (line.includes('};')) {
    console.log(`Found closing at line ${i + 1}: ${line}`);
  }
  
  // Look for export statement
  if (line.includes('export default') || line.includes('export {')) {
    console.log(`\nExport found at line ${i + 1}: ${line}`);
    // Show context
    for (let j = Math.max(0, i - 5); j <= Math.min(lines.length - 1, i + 5); j++) {
      console.log(`${j + 1}: ${lines[j]}`);
    }
  }
}

// Search for the ForecastingView which seems to be the last view
const forecastingIndex = content.lastIndexOf('const ForecastingView');
if (forecastingIndex !== -1) {
  const beforeForecasting = content.substring(forecastingIndex - 200, forecastingIndex);
  const afterForecasting = content.substring(forecastingIndex, forecastingIndex + 5000);
  
  console.log('\n\nArea around ForecastingView:');
  console.log(beforeForecasting + afterForecasting.substring(0, 2000));
}

// Find the main return by looking for patterns
const mainReturnMatch = content.match(/return\s*\(\s*\n?\s*(<div className="dashboard)/);
if (mainReturnMatch) {
  const startPos = content.indexOf(mainReturnMatch[0]);
  console.log('\n\nFound main return at position:', startPos);
  console.log('Context:', content.substring(startPos, startPos + 500));
}

// Look for the last few lines of the file
console.log('\n\nLast 50 lines of the file:');
const last50Lines = lines.slice(-50);
last50Lines.forEach((line, idx) => {
  console.log(`${lines.length - 50 + idx + 1}: ${line}`);
});
