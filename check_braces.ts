import fs from 'fs';

const content = fs.readFileSync('app/admin/dashboard/page.tsx', 'utf8');
let openBraces = 0;
let openParens = 0;

for (let i = 0; i < content.length; i++) {
    if (content[i] === '{') openBraces++;
    if (content[i] === '}') openBraces--;
    if (content[i] === '(') openParens++;
    if (content[i] === ')') openParens--;
}

console.log(`Braces: ${openBraces}, Parens: ${openParens}`);
