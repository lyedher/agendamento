const fs = require('fs');
const path = require('path');

const rootDir = process.argv[2] || '.';

function scanDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      if (!fullPath.includes('node_modules') && !fullPath.includes('.next') && !fullPath.includes('.git')) {
        scanDir(fullPath);
      }
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
      const content = fs.readFileSync(fullPath, 'utf8');
      
      // Try to find component name
      let match = content.match(/export (?:default )?(?:async )?function ([A-Z][a-zA-Z0-9_]*)/);
      if (match) {
        console.log(`${fullPath} -> Likely Component/Page: ${match[1]}`);
        continue;
      }
      
      // Try to find UI component exports
      match = content.match(/const ([A-Z][a-zA-Z0-9_]*) = React\.forwardRef/);
      if (match) {
        console.log(`${fullPath} -> Likely UI Component: ${match[1]}`);
        continue;
      }
      
      console.log(`${fullPath} -> Unknown`);
    }
  }
}

scanDir(rootDir);
