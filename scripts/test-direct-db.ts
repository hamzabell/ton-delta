import 'dotenv/config';
import { Client } from 'pg';

async function testDirectConnection() {
  const connectionString = process.env.DATABASE_URL;
  
  console.log('Testing direct PostgreSQL connection...');
  console.log('Connection string:', connectionString?.replace(/:[^:@]+@/, ':****@'));
  
  if (!connectionString) {
    console.error('❌ DATABASE_URL not found in environment variables');
    process.exit(1);
  }
  
  const client = new Client({
    connectionString,
    ssl: {
      rejectUnauthorized: false // Render requires SSL
    }
  });

  try {
    console.log('Attempting to connect...');
    await client.connect();
    console.log('✅ Connection successful!');
    
    const result = await client.query('SELECT COUNT(*) FROM "Position"');
    console.log(`✅ Found ${result.rows[0].count} positions in database`);
    
    await client.end();
  } catch (error) {
    console.error('❌ Connection failed:');
    console.error(error);
    process.exit(1);
  }
}

testDirectConnection();
