import { Job } from 'bullmq';
import prisma from '../../lib/prisma';

interface DepositPayload {
  userId: string;
  strategyId: string;
  amount: number;
  txHash: string;
}

export const processDepositJob = async (job: Job) => {
  const { userId, strategyId, amount, txHash } = job.data as DepositPayload;

  console.log(`[Deposit] Processing deposit of $${amount} for User ${userId}`);

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
          where: { userId, strategyId }
      });

      if (existingPosition) {
          await prisma.position.update({
              where: { id: existingPosition.id },
              data: {
                  principal: { increment: amount },
                  shares: { increment: amount }, // 1:1 shares for MVP
              }
          });
      } else {
          await prisma.position.create({
              data: {
                  userId,
                  strategyId,
                  principal: amount,
                  shares: amount,
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
