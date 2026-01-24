import { prisma } from '../src/lib/prisma';

async function main() {
  const positionId = '1e9983ab-46f4-49ef-b376-9fff98155c69';
  const logs = await prisma.auditLog.findMany({
    where: { positionId },
    orderBy: { timestamp: 'desc' },
    take: 10
  });

  console.log('Audit Logs for Position:');
  console.log(JSON.stringify(logs, null, 2));
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
