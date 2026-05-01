import fs from 'fs';
import path from 'path';

function replaceInFile(filePath: string) {
    if (!fs.existsSync(filePath)) {
        console.log(`File not found: ${filePath}`);
        return;
    }
    const content = fs.readFileSync(filePath, 'utf8');
    const updated = content.replace(/Alfa/g, 'Alpha');
    fs.writeFileSync(filePath, updated);
    console.log(`Updated ${filePath}`);
}

const files = [
    'lib/actions.ts',
    'lib/db/users.json',
    'app/register/page.tsx',
    'app/dashboard/perfil/page.tsx',
    'app/admin/dashboard/page.tsx'
];

files.forEach(f => replaceInFile(path.join(process.cwd(), f)));
