import fs from 'fs';
import path from 'path';

const dashboardPath = path.join(process.cwd(), 'Dashboard.tsx');
const content = fs.readFileSync(dashboardPath, 'utf8');

// Find the export statement
const exportIndex = content.indexOf('export default EnhancedDashboard;');
if (exportIndex !== -1) {
  // Get the content before the export (last 3000 characters before export)
  const beforeExport = content.substring(Math.max(0, exportIndex - 3000), exportIndex);
  
  console.log('Content before export statement:');
  console.log('='.repeat(80));
  console.log(beforeExport);
  console.log('='.repeat(80));
  console.log('Export statement found at position:', exportIndex);
}

// Also search for the main return with dashboard-enhanced class
const dashboardEnhancedPattern = /<div className="dashboard-enhanced">/g;
let match;
let positions = [];

while ((match = dashboardEnhancedPattern.exec(content)) !== null) {
  positions.push(match.index);
}

console.log('\n\nFound dashboard-enhanced div at positions:', positions);

// For each position, show some context
positions.forEach((pos, idx) => {
  console.log(`\n\nOccurrence ${idx + 1} at position ${pos}:`);
  console.log(content.substring(Math.max(0, pos - 100), pos + 200));
});
