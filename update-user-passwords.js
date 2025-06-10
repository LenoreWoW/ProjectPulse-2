#!/usr/bin/env node

import { Pool } from 'pg';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import fs from 'fs';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Database configuration
const dbConfig = {
  host: process.env.POSTGRES_HOST || 'localhost',
  port: parseInt(process.env.POSTGRES_PORT || '5432'),
  database: process.env.POSTGRES_DB || 'projectpulse',
  user: process.env.POSTGRES_USER || 'postgres',
  password: process.env.POSTGRES_PASSWORD || 'postgres',
};

const SALT_ROUNDS = 10;

// Generate a strong password
function generateStrongPassword(length = 16) {
  // Character sets for strong passwords
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const numbers = '0123456789';
  const symbols = '!@#$%^&*()_+-=[]{}|;:,.<>?';
  
  // Ensure at least one character from each set
  let password = '';
  password += lowercase[crypto.randomInt(lowercase.length)];
  password += uppercase[crypto.randomInt(uppercase.length)];
  password += numbers[crypto.randomInt(numbers.length)];
  password += symbols[crypto.randomInt(symbols.length)];
  
  // Fill the rest with random characters from all sets
  const allChars = lowercase + uppercase + numbers + symbols;
  for (let i = password.length; i < length; i++) {
    password += allChars[crypto.randomInt(allChars.length)];
  }
  
  // Shuffle the password to avoid predictable patterns
  return password.split('').sort(() => crypto.randomInt(3) - 1).join('');
}

// Hash password with bcrypt
async function hashPassword(password) {
  return bcrypt.hash(password, SALT_ROUNDS);
}

// Main function to update user passwords
async function updateUserPasswords() {
  const pool = new Pool(dbConfig);
  let client;
  
  try {
    console.log('🔗 Connecting to database...');
    client = await pool.connect();
    
    // Test connection
    await client.query('SELECT NOW()');
    console.log('✅ Connected to PostgreSQL database');
    
    // Get all users except admin users (keep existing admin passwords)
    const usersResult = await client.query(`
      SELECT id, name, email, username 
      FROM users 
      WHERE role != 'Administrator' 
      AND username NOT IN ('admin', 'Hdmin', 'superadmin')
      ORDER BY id
    `);
    
    const users = usersResult.rows;
    console.log(`📋 Found ${users.length} users to update`);
    
    if (users.length === 0) {
      console.log('ℹ️  No users found to update');
      return;
    }
    
    // Prepare password records for export
    const passwordRecords = [];
    let updateCount = 0;
    let errorCount = 0;
    
    console.log('\n🔐 Generating strong passwords and updating users...\n');
    
    // Begin transaction
    await client.query('BEGIN');
    
    for (const user of users) {
      try {
        // Generate strong password
        const newPassword = generateStrongPassword(16);
        const hashedPassword = await hashPassword(newPassword);
        
        // Update user password
        await client.query(
          'UPDATE users SET password = $1, updatedat = NOW() WHERE id = $2',
          [hashedPassword, user.id]
        );
        
        // Store password record for export
        passwordRecords.push({
          id: user.id,
          name: user.name,
          email: user.email,
          username: user.username,
          password: newPassword
        });
        
        updateCount++;
        console.log(`✅ Updated: ${user.name} (${user.username}) - ID: ${user.id}`);
        
      } catch (error) {
        console.error(`❌ Failed to update ${user.name} (${user.username}):`, error.message);
        errorCount++;
      }
    }
    
    // Commit transaction
    await client.query('COMMIT');
    console.log(`\n🎉 Successfully updated ${updateCount} users`);
    
    if (errorCount > 0) {
      console.log(`⚠️  ${errorCount} users failed to update`);
    }
    
    // Export passwords to secure file
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `user-passwords-${timestamp}.json`;
    
    const exportData = {
      generated_at: new Date().toISOString(),
      total_users: passwordRecords.length,
      users: passwordRecords
    };
    
    fs.writeFileSync(filename, JSON.stringify(exportData, null, 2));
    console.log(`\n📄 Passwords exported to: ${filename}`);
    
    // Also create a readable CSV format
    const csvFilename = `user-passwords-${timestamp}.csv`;
    const csvHeader = 'ID,Name,Email,Username,Password\n';
    const csvContent = passwordRecords
      .map(record => `${record.id},"${record.name}","${record.email}","${record.username}","${record.password}"`)
      .join('\n');
    
    fs.writeFileSync(csvFilename, csvHeader + csvContent);
    console.log(`📊 CSV format exported to: ${csvFilename}`);
    
    console.log('\n🔒 SECURITY IMPORTANT:');
    console.log('- Store the password files securely');
    console.log('- Share passwords with users through secure channels');
    console.log('- Delete the password files after distribution');
    console.log('- Encourage users to change passwords on first login');
    
  } catch (error) {
    console.error('💥 Error updating passwords:', error);
    if (client) {
      try {
        await client.query('ROLLBACK');
      } catch (rollbackError) {
        console.error('Error rolling back transaction:', rollbackError);
      }
    }
  } finally {
    if (client) {
      client.release();
    }
    await pool.end();
  }
}

// Run the update
console.log('🚀 Starting password update process...\n');
updateUserPasswords()
  .then(() => {
    console.log('\n✅ Password update process completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Password update process failed:', error);
    process.exit(1);
  }); 