const fs = require('fs');
const path = require('path');

const srcDir = 'e:/الصفحه/components';
const destDir = 'e:/البوت/modern-soft.botمستقر/modern-soft.bot/components';

function processFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');

    // Remove 'use client';
    content = content.replace(/'use client';?\n?/g, '');
    content = content.replace(/"use client";?\n?/g, '');

    // Replace next/link
    content = content.replace(/import\s+(?:\{[^}]*\}|Link)\s+from\s+['"]next\/link['"];?\n?/g, '');
    content = content.replace(/<Link\b/g, '<a');
    content = content.replace(/<\/Link>/g, '</a>');

    // Replace next/image
    content = content.replace(/import\s+(?:\{[^}]*\}|Image)\s+from\s+['"]next\/image['"];?\n?/g, '');
    content = content.replace(/<Image\b/g, '<img');
    // Note: next/image self-closes <Image /> so <img /> works fine. 
    // Just be careful if there are missing src/alt props but usually they are there.

    // Fix absolute imports
    content = content.replace(/@\/components\//g, './');
    content = content.replace(/@\/lib\/firebase/g, '../services/firebase'); // Assuming this if any
    content = content.replace(/@\/lib\//g, '../utils/');

    return content;
}

if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true });
}

const files = fs.readdirSync(srcDir);
files.forEach(file => {
    if (file.endsWith('.tsx')) {
        const srcPath = path.join(srcDir, file);
        const destPath = path.join(destDir, file);
        const processedContent = processFile(srcPath);
        fs.writeFileSync(destPath, processedContent);
        console.log(`Processed and copied: ${file}`);
    }
});
