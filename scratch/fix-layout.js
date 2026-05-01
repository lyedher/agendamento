const fs = require('fs');
let code = fs.readFileSync('app/admin/dashboard/page.tsx', 'utf8');
const lines = code.split('\n');

// The chunk we want to move is lines 1768 to 1869 (1-indexed, so array indices 1767 to 1868)
// Let's find the exact indices by searching for the start and end of the card.
const startIndex = lines.findIndex(l => l.includes('{/* Criar Nova Escala SER */}'));
let endIndex = -1;
for (let i = startIndex + 1; i < lines.length; i++) {
  if (lines[i].includes('</Card>')) {
    endIndex = i;
    break;
  }
}
// Actually, the Card is followed by `      </div>` in the layout, but wait! The </div> was at 1868.
// Let's just grab the whole thing.
let endDivIndex = endIndex + 1;
if (lines[endDivIndex].includes('</div>')) {
  // we won't grab this div, it closes the grid that stays in settings
} else {
  endDivIndex = endIndex;
}

const criarEscalaLines = lines.slice(startIndex, endIndex + 1);

// Remove the lines from the original array
const restOfFile = [...lines.slice(0, startIndex), ...lines.slice(endIndex + 1)];

// Now find where to insert it. We want to insert it before the Gestão de Escalas SER card.
const cardLineIndex = restOfFile.findIndex(l => l.includes('<Card className="border-0 shadow-xl bg-white rounded-2xl lg:col-span-2 overflow-hidden">'));

// Insert the grid wrapper and the Criar Escala card
restOfFile.splice(
  cardLineIndex, 
  0, 
  '            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">',
  '              <div className="lg:col-span-1 space-y-6">',
  ...criarEscalaLines,
  '              </div>',
  '              <div className="lg:col-span-2 space-y-6">'
);

// Now find the end of the Gestão de Escalas SER card
// It's the next </Card> after the cardLineIndex (which has shifted by the inserted lines)
const newCardLineIndex = restOfFile.findIndex(l => l.includes('<Card className="border-0 shadow-xl bg-white rounded-2xl lg:col-span-2 overflow-hidden">'));
let cardEndIndex = -1;
for (let i = newCardLineIndex + 1; i < restOfFile.length; i++) {
  if (restOfFile[i].includes('</Card>')) {
    cardEndIndex = i;
    break;
  }
}

// Close the wrapper
restOfFile.splice(cardEndIndex + 1, 0, '              </div>', '            </div>');

fs.writeFileSync('app/admin/dashboard/page.tsx', restOfFile.join('\n'));
console.log('Fixed');
