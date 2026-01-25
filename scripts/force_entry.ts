import { ExecutionService } from '../src/lib/execution';
import { prisma } from '../src/lib/prisma';

const POSITION_ID = '4abbce8a-9066-4fe0-b713-0241ae88909f';

async function main() {
  console.log(`Force triggering entry for position: ${POSITION_ID}`);
  
  try {
    // 0. Force update status to 'pending_entry' just in case (though safety check was relaxed)
    // Actually, let's just validte it exists
    const pos = await prisma.position.findUnique({ where: { id: POSITION_ID }});
    if (!pos) {
        console.error('Position not found!');
        return;
    }
    console.log(`Found position. Status: ${pos.status}, Amounts: ${pos.spotAmount}/${pos.perpAmount}`);

    // 1. Execute Entry
    await ExecutionService.enterInitialPosition(POSITION_ID);
    
    console.log('Entry function completed successfully.');
  } catch (error) {
    console.error('Failed to trigger entry:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
