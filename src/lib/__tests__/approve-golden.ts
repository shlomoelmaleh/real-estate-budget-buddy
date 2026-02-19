/**
 * APPROVE GOLDEN REFERENCE
 * ------------------------
 * Run with: npm run test:approve
 *
 * Copies snapshot-output.json → golden-reference.json.
 * This permanently sets the golden reference that the test suite validates against.
 *
 * Only run this after you have manually verified snapshot-output.json externally.
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const GOLDEN_DIR = path.join(__dirname, 'golden');
const SNAPSHOT_FILE = path.join(GOLDEN_DIR, 'snapshot-output.json');
const REFERENCE_FILE = path.join(GOLDEN_DIR, 'golden-reference.json');

if (!fs.existsSync(SNAPSHOT_FILE)) {
    console.error('\n❌ snapshot-output.json not found.');
    console.error('   Run first: npm run test:snapshot\n');
    process.exit(1);
}

fs.copyFileSync(SNAPSHOT_FILE, REFERENCE_FILE);

const data = JSON.parse(fs.readFileSync(REFERENCE_FILE, 'utf-8'));
const count = data.scenarios?.length ?? 0;

console.log('\n✅ Golden reference approved!');
console.log(`   ${count} scenario(s) locked as the truth.`);
console.log(`   File: ${REFERENCE_FILE}`);
console.log('\n👉 You can now run: npm test\n');
