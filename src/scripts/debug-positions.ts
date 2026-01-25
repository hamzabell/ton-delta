
import { PrismaClient } from '@prisma/client';
import { Address } from '@ton/core';

const prisma = new PrismaClient();

async function main() {
    console.log('Inspecting DB...');
    try {
        const users = await prisma.user.findMany({ take: 5 });
        console.log('Sample Users:', JSON.stringify(users, null, 2));

        const positions = await prisma.position.findMany({ take: 5, orderBy: { createdAt: 'desc' }, include: { user: true } });
        console.log('Sample Positions:', JSON.stringify(positions.map(p => ({ 
            id: p.id, 
            pairId: p.pairId, 
            status: p.status, 
            userId: p.userId,
            userWallet: p.user.walletAddress 
        })), null, 2));

        // Search for Melania by pairId across ALL positions
        const melania = await prisma.position.findMany({
            where: {
                pairId: { contains: 'mela', mode: 'insensitive' }
            },
            include: { user: true }
        });
        
        console.log(`\nFound ${melania.length} Melania positions globally.`);
        melania.forEach(p => console.log(JSON.stringify(p, null, 2)));

    } catch (e) {
        console.error("Error querying DB:", e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
