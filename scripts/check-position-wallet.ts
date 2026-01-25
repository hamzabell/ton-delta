
import { PrismaClient } from '@prisma/client';
import { Address } from '@ton/core';
import dotenv from 'dotenv';

dotenv.config();

const connectionString = process.env.DATABASE_URL;

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: connectionString,
    },
  },
});

async function main() {
    const positionId = '4de87ebc-2969-4fc5-b540-94cbaf2f79c9';
    console.log(`Checking position: ${positionId} using ${connectionString?.split('@')[1]}`);

    try {
        const position = await prisma.position.findUnique({
            where: { id: positionId },
            include: { user: true }
        });

        if (!position) {
            console.log('❌ Position NOT FOUND in database');
            return;
        }

        console.log('✅ Position Found');
        console.log(`User ID: ${position.userId}`);
        console.log(`Stored Wallet Address: "${position.user.walletAddress}"`);
        
        // Test comparison logic
        const txSender = 'EQB52Y8YQ0ISgpiEOeNH90lZ5oG1ln4YnzxM2ZuCzqAjM2k9'; // From debug log
        console.log(`Transaction Sender (EQ): ${txSender}`);

        // Robust check
        try {
            const dbAddr = Address.parse(position.user.walletAddress!);
            const txAddr = Address.parse(txSender);
            
            console.log(`Are they equal (Address.equals)? ${dbAddr.equals(txAddr)}`);
            
            // String check
            console.log(`String check (db === tx): ${position.user.walletAddress === txSender}`);

            // Check bounceable formats
            console.log(`DB Friendly (bounceable=false): ${dbAddr.toString({ bounceable: false })}`);
            console.log(`DB Friendly (bounceable=true):  ${dbAddr.toString({ bounceable: true })}`);
        } catch (e) {
            console.error('Address parsing error', e);
        }
    } catch (dbError) {
        console.error('DB Connection Failed:', dbError);
    }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
