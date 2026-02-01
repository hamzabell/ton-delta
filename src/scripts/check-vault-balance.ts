import { prisma } from '../lib/prisma';
import { getTonBalance } from '../lib/onChain';
import { fromNano } from '@ton/core';

async function checkVaultBalance() {
  const positionId = process.argv[2] || '08e3a97b-97da-47ef-a624-3806201960ba';
  
  const position = await prisma.position.findUnique({
    where: { id: positionId },
    include: { user: true }
  });
  
  if (!position) {
    console.error(`Position ${positionId} not found`);
    process.exit(1);
  }
  
  console.log('=== Position Details ===');
  console.log(`ID: ${position.id}`);
  console.log(`Pair: ${position.pairId}`);
  console.log(`Status: ${position.status}`);
  console.log(`Vault: ${position.vaultAddress}`);
  console.log(`Requested Capital: ${position.capitalTON} TON`);
  console.log();
  
  console.log('=== Vault Balance Check ===');
  const balanceNano = await getTonBalance(position.vaultAddress);
  const balance = Number(fromNano(balanceNano));
  
  console.log(`Current Balance: ${balance} TON`);
  console.log();
  
  const GAS_BUFFER = 0.3;
  const capitalTON = position.capitalTON || 0;
  const requiredTotal = capitalTON + GAS_BUFFER;
  
  console.log('=== Entry Requirements ===');
  console.log(`Requested Capital: ${capitalTON} TON`);
  console.log(`Gas Buffer: ${GAS_BUFFER} TON`);
  console.log(`Total Required: ${requiredTotal} TON`);
  console.log();
  
  if (balance >= requiredTotal) {
    console.log('✅ SUFFICIENT BALANCE - Entry should succeed');
    console.log(`Surplus: ${(balance - requiredTotal).toFixed(6)} TON`);
  } else {
    console.log('❌ INSUFFICIENT BALANCE - Entry will fail');
    console.log(`Shortfall: ${(requiredTotal - balance).toFixed(6)} TON`);
    console.log();
    console.log('Solutions:');
    console.log(`1. Reduce GAS_BUFFER to ${(balance - capitalTON).toFixed(6)} TON or lower`);
    console.log(`2. User deposits additional ${(requiredTotal - balance).toFixed(6)} TON`);
    console.log(`3. Reduce requested capital to ${(balance - GAS_BUFFER).toFixed(6)} TON`);
  }
}

checkVaultBalance()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Error:', err);
    process.exit(1);
  });
