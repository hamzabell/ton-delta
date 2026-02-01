/**
 * Quick script to find user address for a vault
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function findUserForVault(vaultAddress: string) {
    const position = await prisma.position.findFirst({
        where: { vaultAddress },
        include: { user: true }
    });

    if (!position) {
        console.log(`No position found for vault: ${vaultAddress}`);
        return;
    }

    console.log('Position ID:', position.id);
    console.log('User ID:', position.userId);
    console.log('Pair:', position.pairId);
    console.log('Status:', position.status);
    console.log('User data:', position.user);
    
    await prisma.$disconnect();
}

const vaultAddr = process.argv[2];
if (!vaultAddr) {
    console.error('Usage: ts-node src/scripts/find-user.ts <vaultAddress>');
    process.exit(1);
}

findUserForVault(vaultAddr);
