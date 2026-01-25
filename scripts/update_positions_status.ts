
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
  const userId = '0:79d98f1843421282988439e347f74959e681b5967e189f3c4cd99b82cea02333';
  
  console.log(`Updating positions to 'closed' for user: ${userId}`);

  const updateResult = await prisma.position.updateMany({
    where: {
      userId: userId,
      status: 'processing_exit',
    },
    data: {
      status: 'closed',
    },
  });

  console.log(`Successfully updated ${updateResult.count} positions to 'closed'.`);

  // Double check the remaining active/processing positions
  const remainingPositions = await prisma.position.findMany({
    where: {
      userId: userId,
    }
  });

  console.log(`\nCurrent status for all positions of user ${userId}:`);
  remainingPositions.forEach(p => {
    console.log(`- Position ID: ${p.id}, Status: ${p.status}, Pair: ${p.pairId}`);
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
