import 'dotenv/config';
import { Address } from '@ton/core';
import { WalletContractV4, WalletContractV5R1 } from '@ton/ton';
import { mnemonicToPrivateKey } from '@ton/crypto';

async function checkWallets() {
    const mnemonic = process.env.KEEPER_MNEMONIC!;
    const key = await mnemonicToPrivateKey(mnemonic.split(' '));
    const expected = 'EQAAjMJ8IwIvXo1HdWUSuJLMeEkmhd18KfhKwRalBLvxYfQD';

    const v4 = WalletContractV4.create({ workchain: 0, publicKey: key.publicKey });
    const v5 = WalletContractV5R1.create({ workchain: 0, publicKey: key.publicKey });

    console.log(`Expected: ${expected}`);
    console.log(`V4R2:    ${v4.address.toString()}`);
    console.log(`V5R1:    ${v5.address.toString()}`);
}

checkWallets();
