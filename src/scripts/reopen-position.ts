/**
 * Find and update position for vault to active status
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function reopenPosition(vaultAddress: string) {
    try {
        // Find any position with this vault
        const position = await prisma.position.findFirst({
            where: { vaultAddress },
            include: { user: true }
        });

        if (!position) {
            console.log(`No position found for vault: ${vaultAddress}`);
            console.log('You may need to create a new position via the UI.');
            return;
        }

        console.log('Found position:');
        console.log('  ID:', position.id);
        console.log('  Status:', position.status);
        console.log('  Pair:', position.pairId);
        console.log('  User:', position.userId);

        // Update to active status
        const updated = await prisma.position.update({
            where: { id: position.id },
            data: { 
                status: 'active',
                updatedAt: new Date()
            }
        });

        console.log('\n✅ Position updated to active!');
        console.log('  New status:', updated.status);
        
    } catch (error) {
        console.error('Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

const vaultAddr = process.argv[2];
if (!vaultAddr) {
    console.error('Usage: ts-node src/scripts/reopen-position.ts <vaultAddress>');
    process.exit(1);
}

reopenPosition(vaultAddr);
