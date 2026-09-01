import fs from 'fs';

let content = fs.readFileSync('server.ts', 'utf8');

// The line `let db: any = {` or similar
const startDb = content.indexOf('let db = {');
let endDb = content.indexOf('// Helper function to log activity');
const dbContent = content.substring(startDb, endDb);

// Remove db declaration from old place
content = content.replace(dbContent, '');

// Place db declaration right above `async function loadFromFirestore()`
content = content.replace('async function loadFromFirestore()', dbContent + '\n\nasync function loadFromFirestore()');

// Move `await loadFromFirestore()` to inside `startServer()` instead of top level
content = content.replace('const app = express();\n  await loadFromFirestore();', 'const app = express();');

content = content.replace('async function startServer() {', 'async function startServer() {\n  await loadFromFirestore();\n');

fs.writeFileSync('server.ts', content);
