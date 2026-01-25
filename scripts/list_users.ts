
import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({
    take: 50,
  });

  console.log(`Found ${users.length} users:`);
  users.forEach(u => {
    console.log(`- ID: ${u.id}, Wallet: ${u.walletAddress}`);
  });
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
