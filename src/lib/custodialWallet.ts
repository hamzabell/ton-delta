import { TonClient, WalletContractV4, internal, SendMode, OpenedContract } from '@ton/ton';
import { KeyPair, mnemonicToPrivateKey } from 'ton-crypto';
import { Address, Cell } from '@ton/core';
import { from, Observable } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';

import { getTonClient, withRetry } from './onChain';
import { CURRENT_NETWORK } from './config';

export const getKeeperWallet$ = (): Observable<{ contract: OpenedContract<WalletContractV4>, key: KeyPair }> => {
  const mnemonic = process.env.KEEPER_MNEMONIC;
  if (!mnemonic) {
    throw new Error('KEEPER_MNEMONIC not found in environment variables');
  }

  return from((async () => {
    const key = await mnemonicToPrivateKey(mnemonic.split(' '));
    const client = await getTonClient();
    const wallet = WalletContractV4.create({ publicKey: key.publicKey, workchain: 0 });
    const contract = client.open(wallet);
    return { contract, key };
  })());
};

/**
 * Signs and sends a batch of transactions as an Observable
 */
export const sendTransactions$ = (transactions: { address: string, value: string, cell: string }[]): Observable<{ seqno: number, address: string }> => {
  return getKeeperWallet$().pipe(
    switchMap(({ contract, key }) => {
      return (from(withRetry(() => contract.getSeqno())) as Observable<number>).pipe(
        switchMap((seqno) => {
          console.log(`[Custodial] Sending ${transactions.length} transactions from ${contract.address.toString({ bounceable: false })}`);
          
          const transferPromise = withRetry(() => contract.sendTransfer({
            seqno,
            secretKey: key.secretKey,
            sendMode: SendMode.PAY_GAS_SEPARATELY + SendMode.IGNORE_ERRORS,
            messages: transactions.map(tx => internal({
              to: Address.parse(tx.address),
              value: BigInt(tx.value),
              body: Cell.fromBase64(tx.cell),
            }))
          }));

          return from(transferPromise).pipe(
            map(() => ({ seqno, address: contract.address.toString({ bounceable: false }) }))
          );
        })
      );
    })
  );
};
