
import { prisma } from '../src/lib/prisma';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';

dotenv.config();

async function main() {
    console.log('🚨 STARTING EMERGENCY CLOSE OF ALL POSITIONS 🚨');
    // Using shared instance
    
    try {
        // Warmup / Check
        await prisma.position.findFirst();
        console.log('✅ Connection Check Passed');

        const result = await prisma.position.updateMany({
            where: {
                status: {
                    not: 'closed'
                }
            },
            data: {
                status: 'closed',
                updatedAt: new Date()
            }
        });

        console.log(`✅ Successfully marked ${result.count} positions as CLOSED.`);
        console.log('Keeper should now ignore these positions.');

    } catch (e) {
        console.error('❌ Failed to update positions:', e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
