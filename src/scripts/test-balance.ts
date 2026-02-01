import { stonfi } from '../lib/stonfi';
import { fromNano } from '@ton/core';

const vaultAddr = 'UQDs3YhRlmTJNGepuI_NajYK0n7LFuhPRRGKOtcDGZSQgx3U';
const ticker = 'WLD';

(async () => {
  try {
    console.log(`🔍 Checking ${ticker} balance for vault...`);
    console.log(`Vault: ${vaultAddr}\n`);
    
    const tokenAddr = await stonfi.resolveTokenAddress(ticker);
    console.log(`✅ ${ticker} token address:`, tokenAddr);
    
    if (!tokenAddr) {
      console.log(`❌ Token address resolution returned null!`);
      return;
    }
    
    const balance = await stonfi.getJettonBalance(vaultAddr, tokenAddr);
    console.log(`\n💰 Balance: ${fromNano(balance)} ${ticker}`);
    console.log(`📊 Balance > 0? ${balance > BigInt(0)}`);
    console.log(`📊 Raw balance (nano): ${balance}`);
  } catch (e) {
    console.error(`\n❌ Error:`, (e as Error).message);
    console.error((e as Error).stack);
  }
})();
