
import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

async function main() {
  const positions = await prisma.position.findMany({
    take: 50,
  });

  console.log(`Found ${positions.length} positions:`);
  positions.forEach(p => {
    console.log(`- ID: ${p.id}, Status: ${p.status}, UserID: ${p.userId}, Vault: ${p.vaultAddress}`);
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
