import fs from 'fs';

const content = fs.readFileSync('app/admin/dashboard/page.tsx', 'utf8');
const tags: string[] = [];
const regex = /<(\/?)([a-zA-Z0-9]+)/g;
let match;
while ((match = regex.exec(content)) !== null) {
    const isClosing = match[1] === '/';
    const tagName = match[2];
    
    // Ignore self-closing tags and those often self-closed in React
    if (['img', 'input', 'br', 'hr', 'link', 'meta'].includes(tagName.toLowerCase())) {
        // Simple check: if it ends with />, it's definitely self-closing.
        // But in React/JSX, these are often just <input ... />
        continue;
    }
    
    if (isClosing) {
        const last = tags.pop();
        if (last !== tagName) {
            console.log(`Mismatch at index ${match.index}: expected </${last}>, found </${tagName}>`);
            // Try to find if it matches any previous tag to resync
            const index = tags.lastIndexOf(tagName);
            if (index !== -1) {
                console.log(`Potential unclosed tags between: ${tags.slice(index + 1).join(', ')}`);
            }
        }
    } else {
        // Peek if it's self-closing
        const start = match.index;
        const endOfTag = content.indexOf('>', start);
        if (endOfTag !== -1 && content[endOfTag - 1] === '/') {
            // Self-closing <Tag />
            continue;
        }
        tags.push(tagName);
    }
}
console.log(`Remaining open tags: ${tags.join(', ')}`);
