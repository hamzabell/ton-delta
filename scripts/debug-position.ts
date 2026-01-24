import { prisma } from '../src/lib/prisma';

async function main() {
  const positionId = '1e9983ab-46f4-49ef-b376-9fff98155c69';
  const position = await prisma.position.findUnique({
    where: { id: positionId },
    include: { user: true }
  });

  if (!position) {
    console.log('Position not found');
    return;
  }

  console.log('Position Data:');
  console.log(JSON.stringify(position, null, 2));
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
