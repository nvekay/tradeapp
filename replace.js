const fs = require('fs');
const path = require('path');

const files = [
  'frontend/src/index.css',
  'frontend/src/pages/Checklist.tsx',
  'frontend/src/pages/Dashboard.tsx',
  'frontend/src/pages/Trades.tsx',
  'frontend/src/pages/AddTrade.tsx',
  'frontend/src/pages/News.tsx',
  'frontend/src/components/FactorSelect.tsx',
  'frontend/src/components/MultiSelect.tsx',
  'frontend/src/components/ScreenshotInput.tsx'
];

for (const file of files) {
  const p = path.resolve(file);
  if (!fs.existsSync(p)) continue;
  let content = fs.readFileSync(p, 'utf-8');
  
  content = content.replace(/text:\s*'#c8cde8'/g, "text: '#f8fafc'");
  content = content.replace(/muted:\s*'#4a5278'/g, "muted: '#94a3b8'");
  content = content.replace(/dim:\s*'#3a4068'/g, "dim: '#64748b'");
  content = content.replace(/red:\s*'#ff6b8a'/g, "red: '#8892b0'");
  
  content = content.replace(/rgba\(255,107,138/g, 'rgba(136,146,176');
  
  if (file.endsWith('index.css')) {
    content = content.replace(/color:\s*#dde1f8;/g, "color: #f8fafc;");
  }
  
  if (file.endsWith('Checklist.tsx')) {
    content = content.replace(/<div style=\{\{ maxWidth: 680 \}\}>/, "<div style={{ maxWidth: 680, margin: '0 auto' }}>");
  }
  
  fs.writeFileSync(p, content);
}
console.log("Done");
