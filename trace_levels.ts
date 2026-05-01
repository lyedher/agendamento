import fs from 'fs';

const content = fs.readFileSync('app/admin/dashboard/page.tsx', 'utf8');
const lines = content.split('\n');

let level = 0;
let pLevel = 0;
for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    for (let char of line) {
        if (char === '{') level++;
        if (char === '}') level--;
        if (char === '(') pLevel++;
        if (char === ')') pLevel--;
    }
    if (i > 500 && i < 515) {
        console.log(`Line ${i + 1}: Braces ${level}, Parens ${pLevel}`);
    }
}
