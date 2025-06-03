import fs from 'fs';
import csvParser from 'csv-parser';
import { createReadStream } from 'fs';

console.log('=== DEBUG: Starting milestone import debug ===');

// Test 1: Check CSV file
console.log('1. Checking CSV file...');
const csvFile = 'Milestones.csv';
if (!fs.existsSync(csvFile)) {
  console.error(`❌ CSV file not found: ${csvFile}`);
  process.exit(1);
}
console.log(`✅ CSV file exists: ${csvFile}`);

// Test 2: Parse headers
console.log('\n2. Parsing CSV headers...');
const firstLine = fs.readFileSync(csvFile, 'utf8').split('\n')[0];
console.log('Raw first line:', JSON.stringify(firstLine));
console.log('Headers:', firstLine.split(';'));

// Test 3: Parse first few rows
console.log('\n3. Parsing first few rows...');
let rowCount = 0;
const rows = [];

createReadStream(csvFile)
  .pipe(csvParser({ separator: ';' }))
  .on('data', (row) => {
    rowCount++;
    if (rows.length < 3) {
      rows.push(row);
    }
  })
  .on('end', () => {
    console.log(`✅ Parsed ${rowCount} rows total`);
    console.log('\nFirst 3 rows:');
    rows.forEach((row, index) => {
      console.log(`\nRow ${index + 1}:`);
      console.log('- Keys:', Object.keys(row));
      console.log('- PROJECT:', JSON.stringify(row.PROJECT));
      console.log('- MILESTONE:', JSON.stringify(row.MILESTONE));
      console.log('- DEADLINE:', JSON.stringify(row.DEADLINE));
      console.log('- PROGRESS:', JSON.stringify(row[' PROGRESS'])); // Note the space
      console.log('- STATUS:', JSON.stringify(row.STATUS));
    });
    
    console.log('\n=== DEBUG: Complete ===');
  })
  .on('error', (error) => {
    console.error('❌ CSV parsing error:', error);
  }); 