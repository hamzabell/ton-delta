import { prisma } from '../lib/prisma';

async function main() {
  try {
    console.log('Testing database connection...');
    const userCount = await prisma.user.count();
    console.log('Connection successful!');
    console.log(`User count: ${userCount}`);
  } catch (error) {
    console.error('Database connection failed:');
    console.error(error);
    process.exit(1);
  } finally {
    // Prisma client might not need explicit disconnect if using proxy, 
    // but the underlying client does.
  }
}

main();
