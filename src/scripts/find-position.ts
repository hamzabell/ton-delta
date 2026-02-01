
import { PrismaClient } from '@prisma/client';
import { resolve } from 'path';
import dotenv from 'dotenv';
dotenv.config({ path: resolve(__dirname, '../../.env') });
const prisma = new PrismaClient();

const VAULT_ADDRESS = 'EQBT9_8w6KM_rN3OcwmlYDgcFLUW2MvL03hYHQBXJz4TFmsK';

async function main() {
    const position = await prisma.position.findFirst({
        where: { 
            OR: [
                { vaultAddress: VAULT_ADDRESS },
                // Check if it's a user wallet (though link implies vault)
                { user: { walletAddress: VAULT_ADDRESS } }
            ]
        },
        include: { user: true }
    });
    
    if (position) {
        console.log(`Found Position: ${position.id}`);
        console.log(`Pair: ${position.pairId}`);
        console.log(`Status: ${position.status}`);
    } else {
        console.log("No position found for this vault.");
    }
}
main().finally(() => prisma.$disconnect());
