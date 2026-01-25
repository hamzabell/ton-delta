import 'dotenv/config';
import { Address, toNano, internal, SendMode } from '@ton/core';
import { TonClient, WalletContractV4 } from '@ton/ton';
import { mnemonicToPrivateKey } from '@ton/crypto';
import { getHttpEndpoint } from '@orbs-network/ton-access';
import { buildKeeperRequest } from '../lib/w5-utils';
import { OutActionWalletV5 } from "@ton/ton/dist/wallets/v5beta/WalletV5OutActions";

async function triggerDirectRefund() {
    console.log('--- W5R1 KEEPER REFUND TRIGGER ---');
    
    // Config
    const vaultAddrStr = 'UQDZ0Y_5XiJOKmLifgtEnZ3ykJVgsEZ2z6n9VYgWixX7b00C';
    const userWalletStr = '0:79d98f1843421282988439e347f74959e681b5967e189f3c4cd99b82cea02333'; 
    const mnemonic = process.env.KEEPER_MNEMONIC;
    
    if (!mnemonic) {
        console.error('KEEPER_MNEMONIC missing');
        process.exit(1);
    }

    try {
        const endpoint = await getHttpEndpoint({ network: 'mainnet' });
        const client = new TonClient({ endpoint });
        
        const key = await mnemonicToPrivateKey(mnemonic.split(' '));
        const keeper = WalletContractV4.create({ workchain: 0, publicKey: key.publicKey });
        const keeperContract = client.open(keeper);
        
        const vaultAddress = Address.parse(vaultAddrStr);
        const userWallet = Address.parse(userWalletStr);

        console.log(`Vault: ${vaultAddrStr}`);
        console.log(`Target: ${userWalletStr}`);

        // Construct the sweep actions
        const actions: OutActionWalletV5[] = [
            {
                type: 'sendMsg',
                mode: SendMode.CARRY_ALL_REMAINING_BALANCE + SendMode.IGNORE_ERRORS,
                outMsg: internal({
                    to: userWallet,
                    value: BigInt(0),
                    body: 'Pamelo: Final Sweep',
                    bounce: false
                })
            }
        ];

        // Use buildKeeperRequest to build the payload compatible with W5R1
        const extnBody = await buildKeeperRequest(
            vaultAddress,
            actions
        );

        const seqno = await keeperContract.getSeqno();
        console.log(`Current Seqno: ${seqno}`);

        // Send from Keeper to Vault
        await keeperContract.sendTransfer({
            seqno,
            secretKey: key.secretKey,
            messages: [
                internal({
                    to: vaultAddress,
                    value: toNano('0.12'), // Adjusted to fit within balance (0.151) while ensuring execution
                    body: extnBody,
                    bounce: false
                })
            ]
        });

        console.log('--- REFUND BROADCASTED SUCCESSFULLY ---');
        console.log(`https://tonviewer.com/${vaultAddrStr}`);
    } catch (error) {
        console.error('TRIGGER FAILURE:', error);
    }
}

triggerDirectRefund();
