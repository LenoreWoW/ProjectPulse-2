import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/projectpulse',
});

async function verifyProgressImport() {
  try {
    const client = await pool.connect();
    
    console.log('🔍 Checking progress import verification...\n');
    
    // Check some specific milestones with 100% progress
    const completedCheck = await client.query(`
      SELECT title, completionpercentage, status
      FROM milestones 
      WHERE completionpercentage = 100 
      AND status = 'Completed'
      LIMIT 5
    `);
    
    console.log('✅ Sample 100% completed milestones:');
    console.table(completedCheck.rows);
    
    // Check milestones with 0% progress and InProgress status
    const inProgressCheck = await client.query(`
      SELECT title, completionpercentage, status
      FROM milestones 
      WHERE completionpercentage = 0 
      AND status = 'InProgress'
      LIMIT 5
    `);
    
    console.log('\n🔄 Sample 0% in-progress milestones:');
    console.table(inProgressCheck.rows);
    
    // Check the problematic completed with 0% progress
    const problematicCheck = await client.query(`
      SELECT title, completionpercentage, status
      FROM milestones 
      WHERE completionpercentage = 0 
      AND status = 'Completed'
    `);
    
    console.log('\n⚠️  Problematic: Completed milestones with 0% progress:');
    console.table(problematicCheck.rows);
    
    // Check progress distribution 
    const progressDistribution = await client.query(`
      SELECT 
        CASE 
          WHEN completionpercentage = 0 THEN '0%'
          WHEN completionpercentage BETWEEN 1 AND 25 THEN '1-25%'
          WHEN completionpercentage BETWEEN 26 AND 50 THEN '26-50%'
          WHEN completionpercentage BETWEEN 51 AND 75 THEN '51-75%'
          WHEN completionpercentage BETWEEN 76 AND 99 THEN '76-99%'
          WHEN completionpercentage = 100 THEN '100%'
        END as progress_range,
        COUNT(*) as count
      FROM milestones 
      GROUP BY progress_range
      ORDER BY 
        CASE 
          WHEN progress_range = '0%' THEN 0
          WHEN progress_range = '1-25%' THEN 1
          WHEN progress_range = '26-50%' THEN 2
          WHEN progress_range = '51-75%' THEN 3
          WHEN progress_range = '76-99%' THEN 4
          WHEN progress_range = '100%' THEN 5
        END
    `);
    
    console.log('\n📊 Progress distribution summary:');
    console.table(progressDistribution.rows);
    
    // Summary
    const totalCount = await client.query('SELECT COUNT(*) as total FROM milestones');
    console.log(`\n📈 Total milestones imported: ${totalCount.rows[0].total}`);
    
    // Check for any milestones with invalid progress values
    const invalidProgress = await client.query(`
      SELECT COUNT(*) as invalid_count 
      FROM milestones 
      WHERE completionpercentage < 0 OR completionpercentage > 100
    `);
    
    if (parseInt(invalidProgress.rows[0].invalid_count) > 0) {
      console.log(`❌ Found ${invalidProgress.rows[0].invalid_count} milestones with invalid progress values!`);
    } else {
      console.log('✅ All progress values are within valid range (0-100)');
    }
    
    client.release();
    await pool.end();
    
  } catch (error) {
    console.error('❌ Error:', error);
    await pool.end();
  }
}

verifyProgressImport(); 