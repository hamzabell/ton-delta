import { stonfi } from '../lib/stonfi';
import { fromNano } from '@ton/core';

const vaultAddr = 'UQDs3YhRlmTJNGepuI_NajYK0n7LFuhPRRGKOtcDGZSQgx3U';
const ticker = 'WLD';

(async () => {
  console.log('🔍 Testing swap transaction values...\n');
  
  // Get balance
  const tokenAddr = await stonfi.resolveTokenAddress(ticker);
  if (!tokenAddr) throw new Error('Token resolution failed');
  
  const balance = await stonfi.getJettonBalance(vaultAddr, tokenAddr);
  console.log(`Balance: ${fromNano(balance)} ${ticker}\n`);
  
  // Build swap
  const tx = await stonfi.buildSwapTx({
    userWalletAddress: vaultAddr,
    fromToken: ticker,
    toToken: 'TON',
    amount: fromNano(balance),
    tokenAddress: tokenAddr
  });
  
  console.log('Swap TX Details:');
  console.log(`  to: ${tx.to}`);
  console.log(`  value: ${tx.value} (${fromNano(tx.value)} TON)`);
  console.log(`  body length: ${tx.body ? tx.body.length : 0} chars`);
  console.log(`\n✅ SDK returned ${fromNano(tx.value)} TON for gas`);
})();
