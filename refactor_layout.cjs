const fs = require('fs');
const path = require('path');

const componentsDir = path.join(__dirname, 'components');

function processDirectory(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            processDirectory(fullPath);
        } else if (fullPath.endsWith('.tsx')) {
            let content = fs.readFileSync(fullPath, 'utf8');
            let originalContent = content;

            // 1. Refactor large border radii
            content = content.replace(/rounded-3xl/g, 'rounded-xl');
            content = content.replace(/rounded-2xl/g, 'rounded-xl'); // Unify to xl for cards

            // 2. Refactor heavy blurs (used often for glowing blobs)
            // Instead of blur-3xl, maybe just remove them or reduce to blur-xl with lower opacity
            // For blobs: usually something like `w-[120px] h-[120px] bg-emerald-400/20 rounded-full blur-3xl`
            // Let's just make the blurs smaller or remove the elements. Replacing blur-3xl with blur-2xl is a start.
            content = content.replace(/blur-3xl/g, 'blur-xl');

            // 3. Shadow adjustments
            content = content.replace(/shadow-\[.*?\]/g, 'shadow-sm');
            content = content.replace(/shadow-lg/g, 'shadow-md');
            content = content.replace(/shadow-2xl/g, 'shadow-md');

            if (content !== originalContent) {
                fs.writeFileSync(fullPath, content);
                console.log(`Updated ${file}`);
            }
        }
    }
}

// Process components
if (fs.existsSync(componentsDir)) {
    processDirectory(componentsDir);
}

// Process App.tsx
const appPath = path.join(__dirname, 'App.tsx');
if (fs.existsSync(appPath)) {
    let content = fs.readFileSync(appPath, 'utf8');
    let original = content;
    content = content.replace(/rounded-3xl/g, 'rounded-xl');
    content = content.replace(/rounded-2xl/g, 'rounded-xl');
    content = content.replace(/shadow-\[.*?\]/g, 'shadow-sm');
    content = content.replace(/shadow-2xl/g, 'shadow-md');
    if (content !== original) {
        fs.writeFileSync(appPath, content);
        console.log('Updated App.tsx');
    }
}

console.log('Done.');
