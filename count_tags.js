const fs = require('fs');

const content = fs.readFileSync('app/admin/dashboard/page.tsx', 'utf8');

const tags = ['section', 'div', 'header', 'main', 'footer', 'Card', 'CardContent', 'CardHeader', 'CardFooter', 'Tabs', 'TabsList', 'TabsContent', 'TabsTrigger', 'Button', 'Input', 'Label'];

tags.forEach(tag => {
    const openRegex = new RegExp('<' + tag + '(\\s|>)', 'g');
    const closeRegex = new RegExp('</' + tag + '\\s*>', 'g');
    const open = content.split(openRegex).length - 1;
    const close = content.split(closeRegex).length - 1;
    console.log(`${tag}: ${open} vs ${close}`);
});
