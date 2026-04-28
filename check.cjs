const fs = require('fs');

const storeCode = fs.readFileSync('src/store.ts', 'utf-8');
const uiCode = fs.readFileSync('src/components/UI.tsx', 'utf-8');

const matchDims = storeCode.match(/export const BLOCK_DIMENSIONS: Record<BlockType, BlockDimensions> = {([\s\S]*?)};/);
const objStr = matchDims[1];

const typesInStore = [];
for (let line of objStr.split('\n')) {
  const match = line.match(/'([^']+)'/);
  if (match) typesInStore.push(match[1]);
}

const matchUI = uiCode.match(/const TYPES: \{ type: BlockType; label: string \}.*?\[([\s\S]*?)\];/);
const uiStr = matchUI[1];
const typesInUI = [];
for (let line of uiStr.split('\n')) {
  const match = line.match(/type:\s*'([^']+)'/);
  if (match) typesInUI.push(match[1]);
}

for (let t of typesInUI) {
  if (!typesInStore.includes(t)) {
    console.log('MISSING IN STORE:', t);
  }
}

for (let t of typesInStore) {
  if (!typesInUI.includes(t)) {
    console.log('MISSING IN UI:', t);
  }
}
