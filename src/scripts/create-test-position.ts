/**
 * Create a new position record for testing
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function createTestPosition(vaultAddress: string, userWalletAddress: string) {
    try {
        // Convert wallet address to user ID format (without workchain prefix)
        const userId = userWalletAddress.replace('EQ', '0:').toLowerCase();
        
        // Check if user exists
        let user = await prisma.user.findUnique({
            where: { id: userId }
        });

        if (!user) {
            console.log('User not found, creating new user...');
            user = await prisma.user.create({
                data: {
                    id: userId,
                    walletAddress: userWalletAddress
                }
            });
            console.log('✅ User created:', userId);
        } else {
            console.log('✅ User found:', userId);
        }

        // Create position with all required fields
        const position = await prisma.position.create({
            data: {
                userId: user.id,
                pairId: 'wld-ton', // Based on the WLD tokens we found
                vaultAddress: vaultAddress,
                status: 'active',
                stasisPreference: 'auto',
                spotAmount: 0.01644369, // The WLD amount we know exists
                perpAmount: 0,
                capitalTON: 0.05, // Approximate initial capital
                tokenAddress: 'EQA8QgqjGJ2dyHWoC57yuifBZw-o8eDHprF8PuOBn1gF-5cO', // WLD token address
                
                // Value tracking
                spotValue: 0.05,
                perpValue: 0,
                totalEquity: 0.05,
                principalFloor: 0.04, // 20% below initial
                
                // Metrics
                entryPrice: 3.0,
                currentPrice: 3.0,
                fundingRate: 0,
                driftCoefficient: 0
            }
        });

        console.log('\n✅ Position created successfully!');
        console.log('  ID:', position.id);
        console.log('  Status:', position.status);
        console.log('  Pair:', position.pairId);
        console.log('  Vault:', position.vaultAddress);
        console.log('  Spot Amount:', position.spotAmount, 'WLD');
        console.log('\n🎯 You can now close this position via the UI!');
        
    } catch (error) {
        console.error('Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

const vaultAddr = process.argv[2];
const userAddr = process.argv[3];

if (!vaultAddr || !userAddr) {
    console.error('Usage: ts-node src/scripts/create-test-position.ts <vaultAddress> <userWalletAddress>');
    console.error('Example: ts-node src/scripts/create-test-position.ts UQDs3Y... EQB52Y...');
    process.exit(1);
}

createTestPosition(vaultAddr, userAddr);
