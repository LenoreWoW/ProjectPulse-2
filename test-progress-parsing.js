import fs from 'fs';
import csvParser from 'csv-parser';

// Function to remove BOM
function removeBOM(str) {
  return str.replace(/^\uFEFF/, '');
}

// Function to map headers - fix for csv-parser
function mapHeaders(header) {
  const mapping = {
    'PROJECT': 'project',
    'MILESTONE': 'milestone', 
    'DEADLINE': 'deadline',
    ' PROGRESS': 'progress',
    'PROGRESS': 'progress',
    'STATUS': 'status'
  };
  
  const cleanHeader = removeBOM(header.trim());
  return mapping[cleanHeader] || cleanHeader.toLowerCase();
}

// Function to parse progress
function parseProgress(progressStr) {
  if (!progressStr || typeof progressStr !== 'string') return 0;
  
  const cleaned = progressStr.trim().replace('%', '');
  const progress = parseFloat(cleaned);
  
  return isNaN(progress) ? 0 : Math.max(0, Math.min(100, progress));
}

async function testProgressParsing() {
  console.log('🧪 Testing Progress Parsing...\n');
  
  // Test the progress parsing function
  const testCases = [
    '100%',
    '0%',
    '85%',
    '50%',
    ' 75% ',
    'invalid',
    '',
    null,
    undefined
  ];
  
  console.log('📋 Progress Parsing Test Cases:');
  testCases.forEach(test => {
    const result = parseProgress(test);
    console.log(`Input: "${test}" -> Output: ${result}`);
  });
  
  console.log('\n📊 Checking actual CSV data...');
  
  // Read some actual CSV data to verify
  let rowCount = 0;
  let progressSamples = [];
  
  return new Promise((resolve) => {
    fs.createReadStream('Milestones.csv')
      .pipe(csvParser({ separator: ';', mapHeaders }))
      .on('data', (row) => {
        rowCount++;
        if (rowCount <= 10) {
          const progress = parseProgress(row.progress);
          progressSamples.push({
            row: rowCount,
            original: row.progress,
            parsed: progress,
            project: row.project?.substring(0, 30) + '...'
          });
        }
      })
      .on('end', () => {
        console.log('\n📋 Sample CSV Progress Parsing:');
        console.table(progressSamples);
        
        console.log(`\n✅ Processed ${rowCount} rows total`);
        resolve();
      });
  });
}

testProgressParsing(); 