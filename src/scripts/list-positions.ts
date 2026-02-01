/**
 * List all positions and find ones that might match
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function listAllPositions() {
    try {
        const positions = await prisma.position.findMany({
            orderBy: { createdAt: 'desc' },
            take: 20,
            include: { user: true }
        });

        console.log(`Found ${positions.length} recent positions:\n`);

        for (const pos of positions) {
            console.log(`ID: ${pos.id}`);
            console.log(`  Status: ${pos.status}`);
            console.log(`  Pair: ${pos.pairId}`);
            console.log(`  Vault: ${pos.vaultAddress}`);
            console.log(`  User: ${pos.userId}`);
            console.log(`  Created: ${pos.createdAt}`);
            console.log('');
        }
        
    } catch (error) {
        console.error('Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

listAllPositions();
