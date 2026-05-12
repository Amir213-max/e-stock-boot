const fs = require('fs');
const path = require('path');

const srcPath = path.join('e:', 'الصفحه', 'components', 'GoogleStyleHome.tsx');
const destPath = path.join(__dirname, '..', 'components', 'NewLanding.tsx');

let content = fs.readFileSync(srcPath, 'utf8');

// 1. Remove 'use client';
content = content.replace(/'use client';\r?\n?/, '');

// 2. Import Link -> remove, change Next/link to nothing since we use <a>
content = content.replace(/import Link from 'next\/link';\r?\n?/, '');

// 3. Import LogoSVG
content = content.replace(/@\/components\/LogoSVG/, './LogoSVG');

// 4. Component signature
content = content.replace(/export default function PremiumMasterpiece\(\) \{/, 'export default function NewLanding({ onOpenChat, isDarkMode, toggleTheme }: any) {');

// 5. Replace <Link href="..."> with <a href="...">
content = content.replace(/<Link/g, '<a');
content = content.replace(/<\/Link>/g, '</a>');

// 6. Hook up the Bot button at the end
content = content.replace(/onClick=\{\(\) => \{\s*\/\/ TODO: Add your Chatbot toggle\/open logic here\s*console\.log\("Open Chatbot"\);\s*\}\}/g, 'onClick={onOpenChat}');

// Write back
fs.writeFileSync(destPath, content, 'utf8');
console.log('Replaced NewLanding.tsx successfully!');
