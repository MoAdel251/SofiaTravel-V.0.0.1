import fs from 'fs';
let content = fs.readFileSync('server.ts', 'utf8');

const replacement = `async function saveToFirestore(collectionName: string, id: string, data: any) {
  try {
    const cleanData = JSON.parse(JSON.stringify(data));
    await setDoc(doc(firestoreDb, collectionName, id), cleanData);
  } catch (err) {
    console.error("Firestore sync error (save):", err);
  }
}`;

content = content.replace(/async function saveToFirestore\([\s\S]*?\}\n\}/, replacement);
fs.writeFileSync('server.ts', content);
