#!/usr/bin/env node

/**
 * This script checks if PostgreSQL is installed and properly configured.
 * If not, it provides instructions on how to install and set it up.
 * It then creates the database schema and launches the application.
 */
const { execSync, spawn } = require('child_process');
const { existsSync, readFileSync } = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Colors for terminal output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

// Log helper functions
function logInfo(message) {
  console.log(`${colors.blue}[INFO]${colors.reset} ${message}`);
}

function logSuccess(message) {
  console.log(`${colors.green}[SUCCESS]${colors.reset} ${message}`);
}

function logWarning(message) {
  console.log(`${colors.yellow}[WARNING]${colors.reset} ${message}`);
}

function logError(message) {
  console.log(`${colors.red}[ERROR]${colors.reset} ${message}`);
}

function logStep(step, message) {
  console.log(`${colors.cyan}[STEP ${step}]${colors.reset} ${message}`);
}

// Get project root directory
const projectRoot = path.resolve(__dirname, '..');

// Check if PostgreSQL is installed
async function checkPostgresInstalled() {
  logStep(1, 'Checking if PostgreSQL is installed...');
  
  try {
    const pgVersion = execSync('psql --version').toString().trim();
    logSuccess(`PostgreSQL is installed: ${pgVersion}`);
    return true;
  } catch (error) {
    logWarning('PostgreSQL is not installed or not in PATH');
    return false;
  }
}

// Install PostgreSQL if not installed
async function installPostgres() {
  logStep(2, 'Installing PostgreSQL...');
  
  const platform = process.platform;
  let installCommand;
  
  if (platform === 'darwin') {
    // macOS
    logInfo('Detected macOS. Will try to install PostgreSQL using Homebrew...');
    try {
      // Check if Homebrew is installed
      execSync('brew --version').toString().trim();
      logInfo('Homebrew is installed. Proceeding with PostgreSQL installation...');
      
      // Install PostgreSQL using Homebrew
      execSync('brew install postgresql@14', { stdio: 'inherit' });
      logSuccess('PostgreSQL installed successfully');
      
      // Start PostgreSQL service
      execSync('brew services start postgresql@14', { stdio: 'inherit' });
      logSuccess('PostgreSQL service started');
      
      return true;
    } catch (error) {
      logError('Could not install PostgreSQL automatically. Please install it manually:');
      logInfo('1. Visit https://brew.sh/ to install Homebrew');
      logInfo('2. Run: brew install postgresql@14');
      logInfo('3. Run: brew services start postgresql@14');
      return false;
    }
  } else if (platform === 'linux') {
    // Linux
    logInfo('Detected Linux. Will try to install PostgreSQL using apt-get...');
    try {
      // Update package lists
      execSync('sudo apt-get update', { stdio: 'inherit' });
      
      // Install PostgreSQL
      execSync('sudo apt-get install -y postgresql postgresql-contrib', { stdio: 'inherit' });
      logSuccess('PostgreSQL installed successfully');
      
      // Start PostgreSQL service
      execSync('sudo service postgresql start', { stdio: 'inherit' });
      logSuccess('PostgreSQL service started');
      
      return true;
    } catch (error) {
      logError('Could not install PostgreSQL automatically. Please install it manually:');
      logInfo('1. Run: sudo apt-get update');
      logInfo('2. Run: sudo apt-get install -y postgresql postgresql-contrib');
      logInfo('3. Run: sudo service postgresql start');
      return false;
    }
  } else if (platform === 'win32') {
    // Windows
    logError('Cannot install PostgreSQL automatically on Windows. Please install it manually:');
    logInfo('1. Download PostgreSQL installer from https://www.postgresql.org/download/windows/');
    logInfo('2. Run the installer and follow the instructions');
    logInfo('3. Make sure to add PostgreSQL bin directory to PATH');
    return false;
  } else {
    logError(`Unsupported platform: ${platform}`);
    return false;
  }
}

// Check if the database exists
async function checkDatabaseExists() {
  logStep(3, 'Checking if database exists...');
  
  try {
    const { POSTGRES_DB } = getEnvVariables();
    const result = execSync(`psql -l | grep ${POSTGRES_DB}`).toString().trim();
    
    if (result.includes(POSTGRES_DB)) {
      logSuccess(`Database ${POSTGRES_DB} exists`);
      return true;
    } else {
      logWarning(`Database ${POSTGRES_DB} does not exist`);
      return false;
    }
  } catch (error) {
    logWarning('Could not check if database exists');
    return false;
  }
}

// Create database
async function createDatabase() {
  logStep(4, 'Creating database...');
  
  try {
    const { POSTGRES_DB, POSTGRES_USER, POSTGRES_PASSWORD } = getEnvVariables();
    
    // Create user if not exists
    execSync(`psql -c "CREATE USER ${POSTGRES_USER} WITH PASSWORD '${POSTGRES_PASSWORD}'" postgres || true`);
    
    // Create database
    execSync(`createdb ${POSTGRES_DB} -O ${POSTGRES_USER} || true`);
    
    logSuccess(`Database ${POSTGRES_DB} created or already exists`);
    return true;
  } catch (error) {
    logError(`Failed to create database: ${error.message}`);
    return false;
  }
}

// Apply database schema
async function applySchema() {
  logStep(5, 'Applying database schema...');
  
  try {
    const schemaPath = path.join(projectRoot, 'server', 'db-init.sql');
    
    if (!existsSync(schemaPath)) {
      logError(`Schema file not found: ${schemaPath}`);
      return false;
    }
    
    const { DATABASE_URL } = getEnvVariables();
    
    // Apply schema
    execSync(`psql "${DATABASE_URL}" -f ${schemaPath}`, { stdio: 'inherit' });
    
    logSuccess('Database schema applied successfully');
    return true;
  } catch (error) {
    logError(`Failed to apply schema: ${error.message}`);
    return false;
  }
}

// Get environment variables
function getEnvVariables() {
  // Try to read from .env file
  let env = {};
  try {
    const envPath = path.join(projectRoot, '.env');
    
    if (existsSync(envPath)) {
      const envContent = readFileSync(envPath, 'utf8');
      
      // Parse .env file
      envContent.split('\n').forEach(line => {
        // Skip comments and empty lines
        if (line.startsWith('#') || !line.trim()) return;
        
        const [key, ...valueParts] = line.split('=');
        if (key && valueParts.length) {
          const value = valueParts.join('=').trim().replace(/^["']|["']$/g, '');
          env[key.trim()] = value;
        }
      });
    }
  } catch (error) {
    logWarning(`Could not read .env file: ${error.message}`);
  }
  
  // Default values
  return {
    POSTGRES_HOST: env.POSTGRES_HOST || 'localhost',
    POSTGRES_PORT: env.POSTGRES_PORT || '5432',
    POSTGRES_DB: env.POSTGRES_DB || 'projectpulse',
    POSTGRES_USER: env.POSTGRES_USER || 'postgres',
    POSTGRES_PASSWORD: env.POSTGRES_PASSWORD || 'postgres',
    DATABASE_URL: env.DATABASE_URL || `postgresql://postgres:postgres@localhost:5432/projectpulse`
  };
}

// Launch the application
function launchApp() {
  logStep(6, 'Launching the application...');
  
  const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm';
  
  // Start the server
  const server = spawn(npmCommand, ['start'], {
    cwd: projectRoot,
    stdio: 'inherit'
  });
  
  server.on('error', (err) => {
    logError(`Failed to start server: ${err.message}`);
  });
  
  server.on('close', (code) => {
    if (code !== 0) {
      logError(`Server process exited with code ${code}`);
    }
  });
  
  logSuccess('Application launched successfully');
}

// Main function
async function main() {
  logInfo('Starting ProjectPulse deployment check...');
  
  let isPostgresInstalled = await checkPostgresInstalled();
  
  if (!isPostgresInstalled) {
    const answer = await new Promise(resolve => {
      rl.question(`${colors.yellow}Do you want to install PostgreSQL now? (y/n) ${colors.reset}`, resolve);
    });
    
    if (answer.toLowerCase() === 'y') {
      isPostgresInstalled = await installPostgres();
    }
  }
  
  if (!isPostgresInstalled) {
    logError('PostgreSQL is required to run this application. Please install it and try again.');
    rl.close();
    return;
  }
  
  const databaseExists = await checkDatabaseExists();
  
  if (!databaseExists) {
    const created = await createDatabase();
    if (!created) {
      logError('Failed to create database. Please check your PostgreSQL installation and try again.');
      rl.close();
      return;
    }
  }
  
  const schemaApplied = await applySchema();
  
  if (!schemaApplied) {
    logError('Failed to apply database schema. Please check your PostgreSQL installation and try again.');
    rl.close();
    return;
  }
  
  // Ask if user wants to launch the app
  const answer = await new Promise(resolve => {
    rl.question(`${colors.yellow}Do you want to launch the application now? (y/n) ${colors.reset}`, resolve);
  });
  
  if (answer.toLowerCase() === 'y') {
    launchApp();
  } else {
    logInfo('You can launch the application later using the command: npm start');
  }
  
  rl.close();
}

// Run the main function
main().catch(error => {
  logError(`Unexpected error: ${error.message}`);
  rl.close();
}); 