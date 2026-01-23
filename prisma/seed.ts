import 'dotenv/config';
import { prisma } from '../src/lib/prisma';

async function main() {
  console.log('ℹ️  Seed script is currently empty. No changes made.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
