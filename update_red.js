const fs = require('fs');
const path = require('path');

const files = [
  'frontend/src/components/MultiSelect.tsx',
  'frontend/src/components/ScreenshotInput.tsx',
  'frontend/src/pages/News.tsx',
  'frontend/src/components/FactorSelect.tsx',
  'frontend/src/pages/Trades.tsx',
  'frontend/src/pages/AddTrade.tsx',
  'frontend/src/pages/Checklist.tsx',
  'frontend/src/pages/Dashboard.tsx',
  'frontend/src/components/HeartPicker.tsx'
];

for (const file of files) {
  const p = path.resolve(file);
  if (!fs.existsSync(p)) continue;
  let content = fs.readFileSync(p, 'utf-8');
  
  content = content.replace(/red:\s*'#64748b'/g, "red: '#f97316'");
  content = content.replace(/'#8892b0'/g, "'#f97316'");
  content = content.replace(/rgba\(136,\s*146,\s*176/g, 'rgba(249,115,22');
  
  fs.writeFileSync(p, content);
}
console.log("Updated red items to orange");
