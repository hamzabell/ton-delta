
import { PrismaClient } from '@prisma/client';

const connectionString = process.env.DATABASE_URL;

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: connectionString,
    },
  },
});

async function main() {
  const users = await prisma.user.findMany({
    take: 10,
  });

  console.log(`Found ${users.length} users:`);
  users.forEach(u => {
    console.log(`- ID: ${u.id}, Wallet: ${u.walletAddress}`);
  });

  const positions = await prisma.position.findMany({
    take: 10,
  });

  console.log(`Found ${positions.length} positions:`);
  positions.forEach(p => {
    console.log(`- ID: ${p.id}, Status: ${p.status}, UserID: ${p.userId}`);
  });
  
  const targetWallet = 'UQB52Y8YQ0ISgpiEOeNH90lZ5oG1ln4YnzxM2ZuCzqAjMzT4';
  const targetUser = await prisma.user.findFirst({
      where: {
          walletAddress: {
              equals: targetWallet,
              mode: 'insensitive'
          }
      }
  });
  
  if (targetUser) {
      console.log(`\nTARGET USER FOUND: ${targetUser.id}`);
      const targetPositions = await prisma.position.findMany({
          where: { userId: targetUser.id }
      });
      console.log(`Number of positions for target user: ${targetPositions.length}`);
      targetPositions.forEach(p => {
          console.log(`- Position ID: ${p.id}, Status: ${p.status}`);
      });
  } else {
      console.log(`\nTARGET USER NOT FOUND for wallet ${targetWallet}`);
  }
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
