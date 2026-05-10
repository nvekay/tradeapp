const fs = require('fs');
const path = require('path');

const layoutPath = path.resolve('frontend/src/components/Layout.tsx');
let content = fs.readFileSync(layoutPath, 'utf-8');

content = content.replace(/background:\s*'#13162a'/g, "background: '#f1f5f9'");
content = content.replace(/color:\s*'#c8cde8'/g, "color: '#0f172a'");
content = content.replace(/background:\s*'#0f1224'/g, "background: '#ffffff'");
content = content.replace(/rgba\(255,255,255,0.06\)/g, "rgba(0,0,0,0.08)");
content = content.replace(/className="text-white/g, 'className="text-slate-900');
content = content.replace(/'#8b84ff'/g, "'#6366f1'");
content = content.replace(/'#3a4068'/g, "'#64748b'");
content = content.replace(/rgba\(108,99,255,0.18\)/g, "rgba(99,102,241,0.1)");
content = content.replace(/'#1c2040'/g, "'#f1f5f9'");
content = content.replace(/'#9098c8'/g, "'#475569'");

fs.writeFileSync(layoutPath, content);
console.log("Layout.tsx updated");
