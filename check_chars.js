const fs = require('fs');
const content = fs.readFileSync('app/admin/dashboard/page.tsx', 'utf8');
const lines = content.split('\n');
const area = lines.slice(500, 515).join('\n');
for (let i = 0; i < area.length; i++) {
    console.log(`${area[i]} : ${area.charCodeAt(i)}`);
}
