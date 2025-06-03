import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/projectpulse',
});

async function checkProgress() {
  try {
    const client = await pool.connect();
    
    // Check progress distribution
    const result = await client.query(`
      SELECT completionpercentage, COUNT(*) as count 
      FROM milestones 
      GROUP BY completionpercentage 
      ORDER BY completionpercentage
    `);
    console.log('📊 Progress distribution in database:');
    console.table(result.rows);
    
    // Get sample milestones with progress
    const sampleResult = await client.query(`
      SELECT title, completionpercentage, deadline, status 
      FROM milestones 
      LIMIT 10
    `);
    console.log('\n📋 Sample milestones with progress:');
    console.table(sampleResult.rows);
    
    // Check for zero progress milestones
    const zeroProgress = await client.query(`
      SELECT COUNT(*) as zero_progress_count 
      FROM milestones 
      WHERE completionpercentage = 0
    `);
    console.log(`\n⚠️  Milestones with 0% progress: ${zeroProgress.rows[0].zero_progress_count}`);
    
    // Check for 100% progress milestones
    const fullProgress = await client.query(`
      SELECT COUNT(*) as full_progress_count 
      FROM milestones 
      WHERE completionpercentage = 100
    `);
    console.log(`✅ Milestones with 100% progress: ${fullProgress.rows[0].full_progress_count}`);
    
    client.release();
    await pool.end();
  } catch (error) {
    console.error('❌ Error:', error);
    await pool.end();
  }
}

checkProgress(); 