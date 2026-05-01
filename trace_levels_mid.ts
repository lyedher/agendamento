
const fs = require('fs');
const content = fs.readFileSync('app/admin/dashboard/page.tsx', 'utf8');
const lines = content.split('\n');

let bLevel = 0;
let pLevel = 0;

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  for (let char of line) {
    if (char === '{') bLevel++;
    if (char === '}') bLevel--;
    if (char === '(') pLevel++;
    if (char === ')') pLevel--;
  }
  if (i >= 500 && i <= 510) {
    console.log(`Line ${i + 1}: Braces ${bLevel}, Parens ${pLevel} | ${line.trim()}`);
  }
}
