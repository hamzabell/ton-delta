import { Job } from 'bullmq';
import { prisma } from '../../lib/prisma';

interface DepositPayload {
  userId: string;
  strategyId: string;
  amount: number;
  txHash: string;
  vaultAddress: string; // REQUIRED: The Non-Custodial W5 Vault Address
}

export const processDepositJob = async (job: Job) => {
  const { userId, strategyId, amount, txHash, vaultAddress } = job.data as DepositPayload;
  const pairId = strategyId; // Map strategy to pair

  // SAFETY: We strictly handle public addresses only. 
  // We DO NOT process or store private keys or mnemonics in this worker.
  
  console.log(`[Deposit] Processing deposit of $${amount} for User ${userId}. Vault: ${vaultAddress}`);

  try {
      // 1. Log Deposit
      await prisma.deposit.create({
          data: {
              userId,
              amount,
              timestamp: new Date(),
          }
      });

      // 2. Update Position (or Create)
      // Check if position exists
      const existingPosition = await prisma.position.findFirst({
          where: { userId, pairId }
      });

      if (existingPosition) {
          await prisma.position.update({
              where: { id: existingPosition.id },
              data: {
                  totalEquity: { increment: amount },
                  principalFloor: { increment: amount }, // Assuming full amount adds to floor
                  // Update vault address if it was missing or changed (e.g. re-deploy)
                  vaultAddress: vaultAddress || existingPosition.vaultAddress 
              }
          });
      } else {
          await prisma.position.create({
              data: {
                  userId,
                  pairId,
                  totalEquity: amount,
                  principalFloor: amount,
                  spotAmount: 0,
                  perpAmount: 0,
                  spotValue: 0,
                  perpValue: 0,
                  entryPrice: 1,
                  currentPrice: 1,
                  fundingRate: 0,
                  driftCoefficient: 0,
                  vaultAddress: vaultAddress || '' 
              }
          });
      }

      // 3. Update Strategy TVL
      await prisma.strategy.update({
          where: { id: strategyId },
          data: { tvl: { increment: amount } }
      });

      console.log(`[Deposit] ✅ Deposit confirmed. Position updated.`);

  } catch (error) {
      console.error(`[Deposit] ❌ Failed to process deposit:`, error);
      throw error; // Retry job
  }

  return { status: 'processed', txHash };
};
