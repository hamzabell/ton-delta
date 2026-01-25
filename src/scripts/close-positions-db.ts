import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

async function closePositionsInDb() {
    console.log('--- DB POSITION STATUS UPDATE START ---');
    
    // Config
    const vaultAddrStr = 'UQDVyC4YBHIy_vqwPJiWptFhlpUf6oNtfFyLGyTf7X11F6Ri';
    
    // Force direct URL or pooled depending on what's available
    // Your .env says DIRECT_URL is on 5432, let's try that.
    const prisma = new PrismaClient({
        datasources: {
            db: {
                url: process.env.DIRECT_URL
            }
        }
    });

    try {
        console.log(`Searching for positions with Vault: ${vaultAddrStr}`);
        
        const result = await prisma.position.updateMany({
            where: {
                vaultAddress: vaultAddrStr
            },
            data: {
                status: 'closed'
            }
        });

        console.log(`SUCCESS: Marked ${result.count} positions as CLOSED in the database.`);
    } catch (error) {
        console.error('DB UPDATE FAILURE:', error);
        console.log('Recommendation: Run manual SQL: UPDATE "Position" SET status = \'closed\' WHERE "vaultAddress" = \'' + vaultAddrStr + '\';');
    } finally {
        await prisma.$disconnect();
    }
}

closePositionsInDb();
