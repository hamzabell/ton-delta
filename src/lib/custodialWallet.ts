import { TonClient, WalletContractV4, internal, SendMode, OpenedContract } from 'ton';
import { KeyPair } from 'ton-crypto';
import { Address, Cell } from 'ton-core';
import { mnemonicToPrivateKey } from 'ton-crypto';
import { from, Observable } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';

import { CURRENT_NETWORK } from './config';

const tonClient = new TonClient({ endpoint: CURRENT_NETWORK.tonApi });
export const getKeeperWallet$ = (): Observable<{ contract: OpenedContract<WalletContractV4>, key: KeyPair }> => {
  const mnemonic = process.env.KEEPER_MNEMONIC;
  if (!mnemonic) {
    throw new Error('KEEPER_MNEMONIC not found in environment variables');
  }

  return from(mnemonicToPrivateKey(mnemonic.split(' '))).pipe(
    map(key => {
      const wallet = WalletContractV4.create({ publicKey: key.publicKey, workchain: 0 });
      const contract = tonClient.open(wallet);
      return { contract, key };
    })
  );
};

/**
 * Signs and sends a batch of transactions as an Observable
 */
export const sendTransactions$ = (transactions: { address: string, value: string, cell: string }[]): Observable<{ seqno: number, address: string }> => {
  return getKeeperWallet$().pipe(
    switchMap(({ contract, key }) => {
      return (from(contract.getSeqno()) as Observable<number>).pipe(
        switchMap((seqno) => {
          console.log(`[Custodial] Sending ${transactions.length} transactions from ${contract.address.toString()}`);
          
          const transferPromise = contract.sendTransfer({
            seqno,
            secretKey: key.secretKey,
            sendMode: SendMode.PAY_GAS_SEPARATELY + SendMode.IGNORE_ERRORS,
            messages: transactions.map(tx => internal({
              to: Address.parse(tx.address),
              value: BigInt(tx.value),
              body: Cell.fromBase64(tx.cell),
            }))
          });

          return from(transferPromise).pipe(
            map(() => ({ seqno, address: contract.address.toString() }))
          );
        })
      );
    })
  );
};
