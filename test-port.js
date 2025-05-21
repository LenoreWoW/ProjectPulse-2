// Simple script to print out environment variables
console.log('Environment variables:');
console.log(`- PORT: ${process.env.PORT || 'not set'}`);
console.log(`- NODE_ENV: ${process.env.NODE_ENV || 'not set'}`);

// Load .env file variables and print them
try {
  import('fs').then(fs => {
    const dotenv = fs.readFileSync('.env', 'utf8');
    console.log('\nContents of .env file:');
    console.log(dotenv);
  }).catch(err => {
    console.error('Error importing fs:', err);
  });
} catch (err) {
  console.error('Error reading .env file:', err);
} 