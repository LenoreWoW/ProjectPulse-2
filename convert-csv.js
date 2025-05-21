// CSV Converter Utility
// Use this script to convert and validate your CSV data before importing
// It can help standardize column names and formats

import fs from 'fs';
import csv from 'csv-parser';
import { createObjectCsvWriter } from 'csv-writer';
import path from 'path';

// Expected columns in our target format
const EXPECTED_COLUMNS = [
  'STATUS',
  'CONTRACT NO',
  'PROJECT NAME',
  'ARABIC NAME',
  'PROJECT OFFICER',
  'START DATE',
  'END DATE',
  'BUDGET IN QAR',
  'AMOUNT PAID'
];

// Map source columns to target columns (if names differ)
// Example: { 'Original Column Name': 'TARGET COLUMN NAME' }
const COLUMN_MAPPING = {
  // Add mappings here if your CSV uses different column names
  // Example:
  // 'Project Status': 'STATUS',
  // 'Contract Number': 'CONTRACT NO',
  // 'Project Title': 'PROJECT NAME',
  // 'Arabic Title': 'ARABIC NAME',
  // 'Officer': 'PROJECT OFFICER',
  // 'Start': 'START DATE',
  // 'End': 'END DATE',
  // 'Budget': 'BUDGET IN QAR',
  // 'Paid': 'AMOUNT PAID'
};

// Convert source CSV to our expected format
async function convertCsv(sourcePath, targetPath) {
  const results = [];
  let sourceColumns = [];
  
  console.log(`Reading source CSV: ${sourcePath}`);
  
  // Read source CSV
  await new Promise((resolve, reject) => {
    fs.createReadStream(sourcePath)
      .pipe(csv())
      .on('headers', (headers) => {
        sourceColumns = headers;
        console.log('Source CSV columns:', headers);
        
        // Check for missing expected columns
        const missingColumns = [];
        for (const expectedCol of EXPECTED_COLUMNS) {
          const mappedCol = Object.entries(COLUMN_MAPPING)
            .find(([src, target]) => target === expectedCol);
          
          const sourceColumn = mappedCol ? mappedCol[0] : expectedCol;
          
          if (!headers.includes(sourceColumn)) {
            missingColumns.push(expectedCol);
          }
        }
        
        if (missingColumns.length > 0) {
          console.warn('Warning: Missing expected columns:', missingColumns);
          console.warn('You may need to add column mappings in the COLUMN_MAPPING object');
        }
      })
      .on('data', (data) => {
        // Map column names if needed
        const mappedData = {};
        for (const [srcKey, srcValue] of Object.entries(data)) {
          const targetKey = COLUMN_MAPPING[srcKey] || srcKey;
          mappedData[targetKey] = srcValue;
        }
        
        // Ensure all expected columns exist
        for (const expectedCol of EXPECTED_COLUMNS) {
          if (!(expectedCol in mappedData)) {
            mappedData[expectedCol] = '';
          }
        }
        
        results.push(mappedData);
      })
      .on('end', resolve)
      .on('error', reject);
  });
  
  console.log(`Read ${results.length} rows from source CSV`);
  
  // Write target CSV
  const csvWriter = createObjectCsvWriter({
    path: targetPath,
    header: EXPECTED_COLUMNS.map(column => ({ id: column, title: column }))
  });
  
  await csvWriter.writeRecords(results);
  console.log(`Converted CSV written to: ${targetPath}`);
  
  // Print validation summary
  console.log('\n==== Validation Summary ====');
  let valid = 0;
  let warnings = 0;
  
  for (let i = 0; i < results.length; i++) {
    const row = results[i];
    let rowValid = true;
    const rowWarnings = [];
    
    // Check required fields
    if (!row['PROJECT NAME'] || row['PROJECT NAME'].trim() === '') {
      rowWarnings.push('Missing PROJECT NAME');
      rowValid = false;
    }
    
    if (!row['PROJECT OFFICER'] || row['PROJECT OFFICER'].trim() === '') {
      rowWarnings.push('Missing PROJECT OFFICER');
    }
    
    // Report warnings for this row
    if (rowWarnings.length > 0) {
      console.log(`Row ${i+1} warnings:`, rowWarnings.join(', '));
      warnings++;
    }
    
    if (rowValid) {
      valid++;
    }
  }
  
  console.log(`Valid rows: ${valid} / ${results.length}`);
  console.log(`Rows with warnings: ${warnings}`);
  console.log('===========================');
}

// Check command line arguments
const sourcePath = process.argv[2];
const targetPath = process.argv[3] || 'converted.csv';

if (!sourcePath) {
  console.error('Please provide a source CSV file path as an argument.');
  console.error('Usage: node convert-csv.js source.csv [target.csv]');
  process.exit(1);
}

// Check if the source file exists
if (!fs.existsSync(sourcePath)) {
  console.error(`Source file not found: ${sourcePath}`);
  process.exit(1);
}

// Run the conversion
convertCsv(sourcePath, targetPath).catch(error => {
  console.error('Error converting CSV:', error);
  process.exit(1);
}); 