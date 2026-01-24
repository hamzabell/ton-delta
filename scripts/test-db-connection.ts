import { prisma } from '../src/lib/prisma';

async function testConnection() {
  console.log('Testing database connection...');
  
  try {
    await prisma.$connect();
    console.log('✅ Database connection successful!');
    
    const count = await prisma.position.count();
    console.log(`✅ Found ${count} positions in database`);
    
    await prisma.$disconnect();
  } catch (error) {
    console.error('❌ Database connection failed:');
    console.error(error);
    process.exit(1);
  }
}

testConnection();
