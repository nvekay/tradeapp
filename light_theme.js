const fs = require('fs');
const path = require('path');

const newC = `const C = {
  card: '#ffffff', item: '#f8fafc', border: 'rgba(0,0,0,0.08)',
  text: '#0f172a', muted: '#64748b', dim: '#94a3b8',
  green: '#10b981', red: '#64748b', yellow: '#f59e0b', purple: '#6366f1', blue: '#3b82f6',
  purpleBtn: '#4f46e5', orange: '#f97316'
}`;

const files = [
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
  
  content = content.replace(/const C = \{[\s\S]*?\n\}/, newC);
  
  content = content.replace(/color:\s*'#fff'/g, "color: C.text");
  content = content.replace(/color="#fff"/g, 'color={C.text}');
  
  content = content.replace(/rgba\(255,255,255,/g, 'rgba(0,0,0,');
  content = content.replace(/rgba\(255,\s*255,\s*255,/g, 'rgba(0,0,0,');
  
  content = content.replace(/color:\s*'#13162a'/g, "color: '#ffffff'");
  content = content.replace(/'#1c2040'/g, "C.item");
  content = content.replace(/'#25284a'/g, "C.border");
  
  fs.writeFileSync(p, content);
}

const cssPath = path.resolve('frontend/src/index.css');
if (fs.existsSync(cssPath)) {
  let css = fs.readFileSync(cssPath, 'utf-8');
  css = css.replace(/background:\s*#13162a;/, "background: #f1f5f9;");
  css = css.replace(/color:\s*#f8fafc;/, "color: #0f172a;");
  fs.writeFileSync(cssPath, css);
}

console.log("Light theme applied");
