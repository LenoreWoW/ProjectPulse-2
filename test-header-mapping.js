import fs from 'fs';
import csvParser from 'csv-parser';
import { createReadStream } from 'fs';

console.log('=== Testing Header Mapping ===');

function removeBOM(str) {
  if (str.charCodeAt(0) === 0xFEFF) {
    return str.slice(1);
  }
  return str;
}

let rowCount = 0;
const rows = [];

createReadStream('Milestones.csv')
  .pipe(csvParser({ 
    separator: ';',
    mapHeaders: ({ header }) => {
      const cleaned = removeBOM(header).trim().replace(/\r|\n/g, '');
      console.log(`Header: "${header}" -> "${cleaned}"`);
      return cleaned;
    }
  }))
  .on('data', (row) => {
    rowCount++;
    if (rows.length < 2) {
      rows.push(row);
    }
    if (rowCount === 5) {
      console.log('\nStopping after 5 rows for testing...');
      return;
    }
  })
  .on('end', () => {
    console.log(`\nProcessed ${rowCount} rows`);
    console.log('\nFirst row data:');
    if (rows[0]) {
      console.log('Keys:', Object.keys(rows[0]));
      console.log('PROJECT:', JSON.stringify(rows[0].PROJECT));
      console.log('MILESTONE:', JSON.stringify(rows[0].MILESTONE));
      console.log('DEADLINE:', JSON.stringify(rows[0].DEADLINE));
      console.log('PROGRESS:', JSON.stringify(rows[0].PROGRESS));
      console.log('STATUS:', JSON.stringify(rows[0].STATUS));
    }
  })
  .on('error', (error) => {
    console.error('Error:', error);
  }); 