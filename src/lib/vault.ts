import { TonClient, WalletContractV4, internal } from 'ton';
import { Address, beginCell, toNano } from 'ton-core';
import { mnemonicToPrivateKey } from 'ton-crypto';
import { from, Observable } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';

const tonClient = new TonClient({ endpoint: 'https://toncenter.com/api/v2/jsonRPC' });

/**
 * Triggers a rebalance on the Vault contract as an Observable
 */
export const triggerRebalance$ = (vaultAddress: string, strategyId: string): Observable<void> => {
  console.log(`[Vault] 🚀 Triggering rebalance for Vault ${vaultAddress} (Strategy: ${strategyId})`);
  
  const mnemonic = process.env.KEEPER_MNEMONIC || '';
  if (!mnemonic) {
    console.warn('[Vault] No KEEPER_MNEMONIC found. Dry-run only.');
    return from([undefined]);
  }

  return from(mnemonicToPrivateKey(mnemonic.split(' '))).pipe(
    switchMap(key => {
      const wallet = WalletContractV4.create({ publicKey: key.publicKey, workchain: 0 });
      const contract = tonClient.open(wallet);
      
      const rebalanceOp = 0x7265626c;
      const body = beginCell()
        .storeUint(rebalanceOp, 32)
        .storeUint(0, 64)
        .storeStringTail(strategyId)
        .endCell();

      return from(contract.getSeqno()).pipe(
        switchMap(seqno => {
          return from(contract.sendTransfer({
            seqno,
            secretKey: key.secretKey,
            messages: [
              internal({
                to: Address.parse(vaultAddress),
                value: toNano('0.1'),
                body: body,
              })
            ]
          }));
        }),
        map(() => {
          console.log(`[Vault] Sent rebalance signal to contract at ${vaultAddress}`);
          return undefined;
        })
      );
    })
  );
};

/**
 * Vault object for async/await usage in API routes
 */
export const vault = {
  triggerRebalance: async (vaultAddress: string, strategyId: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      triggerRebalance$(vaultAddress, strategyId).subscribe({
        next: () => {},
        error: (err) => reject(err),
        complete: () => resolve()
      });
    });
  }
};
