import { Job } from 'bullmq';
import { prisma } from '../../lib/prisma';
import { ExecutionService } from '../../lib/execution';
// import { buildAtomicExitTx } from '../../lib/fees';
// import { auditRiskAcandtion } from '../../lib/audit'; // Mocked or assume added

// CONFIG
const DRIFT_THRESHOLD = 0.015; // 1.5% Imbalance
const MAX_LOSS_PCT = 0.20; // 20% Drawdown triggers Panic

export async function riskMonitorJob(job: Job) {
  const { positionId } = job.data;
  
  try {
      const position = await prisma.position.findUnique({
        where: { id: positionId },
        include: { user: true }
      });

      if (!position || position.status !== 'active') return;

      // 1. DRIFT CALCULATION
      // δ = |(Q_spot - Q_perp) / Q_initial|
      // Using mock values for simplicity if real amounts aren't fully synced
      const qSpot = position.spotAmount;
      const qPerp = position.perpAmount;
      const deviation = Math.abs(qSpot - qPerp);
      const denominator = Math.max(qSpot, 0.00001); // Avoid Div0
      const drift = deviation / denominator;

      // Update DB
      await prisma.position.update({
        where: { id: positionId },
        data: { driftCoefficient: drift }
      });

      // CHECK: DRIFT REBALANCE
      if (drift > DRIFT_THRESHOLD) {
          console.warn(`[Risk:${positionId}] Drift ${drift.toFixed(4)} > ${DRIFT_THRESHOLD}. Executing Rebalance.`);
          
          await prisma.auditLog.create({
            data: {
                level: 'WARN',
                component: 'Risk',
                action: 'DRIFT_rebalance_TRIGGERED',
                positionId,
                details: { drift, threshold: DRIFT_THRESHOLD }
            }
          });

          // Execute Rebalance: Deposit more collateral to ensure safety
          // In a real scenario, this would determine direction based on (qSpot - qPerp) sign.
          // For MVP, we assume we need to fortify the perp leg.
          await ExecutionService.rebalancePosition(positionId, deviation, true);
      }


      // 2. HEALTH / MAX LOSS CHECK
      // Mock Pricing for Equity Calculation
      const currentPrice = position.currentPrice || 5.50; 
      const currentEquity = position.spotAmount * currentPrice; // Simplified Equity (Spot Valid)
      
      // Calculate Drawdown from Principal Floor
      // If PrincipalFloor is the "Stop Level", we check if we breached it.
      // If we use EntryValue as baseline:
      const entryEquity = position.spotAmount * position.entryPrice;
      const drawdown = (entryEquity - currentEquity) / entryEquity;

      // CHECK: MAX LOSS
      const userMaxLoss = position.maxLossPercentage || MAX_LOSS_PCT;
      
      if (drawdown > userMaxLoss) {
          console.error(`[Risk:${positionId}] HIT MAX LOSS (${drawdown.toFixed(2)}% > ${userMaxLoss}). EXECUTING PANIC.`);
          
          await prisma.auditLog.create({
            data: {
                level: 'ERROR',
                component: 'Risk',
                action: 'MAX_LOSS_TRIGGER',
                positionId,
                details: { drawdown, maxLoss: userMaxLoss }
            }
          });

          // TRIGGER PANIC UNWIND
          await ExecutionService.executePanicUnwind(position.id, "Max Loss Triggered");
      }

  } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      console.error(`[Risk] Error processing ${positionId}`, err);
       await prisma.auditLog.create({
            data: {
                level: 'ERROR',
                component: 'Risk',
                action: 'MONITOR_FAILURE',
                positionId,
                details: { error: errorMessage }
            }
        });
  }
}
