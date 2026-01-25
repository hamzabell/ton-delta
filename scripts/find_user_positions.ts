
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const walletAddress = 'UQB52Y8YQ0ISgpiEOeNH90lZ5oG1ln4YnzxM2ZuCzqAjMzT4';

  console.log(`Searching for user with wallet: ${walletAddress}`);

  const user = await prisma.user.findFirst({
    where: {
      walletAddress: {
        equals: walletAddress,
        mode: 'insensitive',
      },
    }
  });

  if (!user) {
    console.error(`User with wallet ${walletAddress} not found.`);
    // Try without mode insensitive just in case
    const userExact = await prisma.user.findFirst({
        where: {
          walletAddress: walletAddress,
        }
      });
    if (!userExact) {
        process.exit(1);
    }
    console.log(`Found user with exact match: ${userExact.id}`);
  } else {
    console.log(`Found user: ${user.id}`);
  }

  const userId = user?.id || '';

  const positions = await prisma.position.findMany({
    where: {
      userId: userId,
    }
  });

  console.log(`Found ${positions.length} positions for user ${userId}`);
  positions.forEach(p => {
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
