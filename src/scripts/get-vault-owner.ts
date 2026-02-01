/**
 * Extract vault owner address from W5 contract state
 */
import { Address, beginCell, Cell } from '@ton/core';
import { getTonClient } from '../lib/onChain';
import { WalletContractV5R1 } from '@ton/ton';

async function getVaultOwner(vaultAddr: string) {
    try {
        const client = await getTonClient();
        const address = Address.parse(vaultAddr);
        
        console.log('Reading vault state...');
        const state = await client.getContractState(address);
        
        // Parse W5 data structure - convert Buffer to Cell first
        const dataCell = state.data ? (typeof state.data === 'string' ? Cell.fromBase64(state.data) : Cell.fromBoc(state.data)[0]) : null;
        if (!dataCell) {
            throw new Error('Could not parse vault data');
        }
        
        const dataSlice = dataCell.beginParse();
        const isSigAllowed = dataSlice.loadBit();
        const seqno = dataSlice.loadUint(32);
        const walletId = dataSlice.loadUint(32);
        const pubKey = dataSlice.loadBuffer(32);
        
        console.log('Vault info:');
        console.log('  Seqno:', seqno);
        console.log('  Wallet ID:', walletId);
        console.log('  Public Key:', pubKey.toString('hex'));
        
        // Create standard W5 wallet with same public key
        const ownerWallet = WalletContractV5R1.create({
            workchain: 0,
            publicKey: pubKey
        });
        
        const ownerAddress = ownerWallet.address.toString();
        console.log('\nOwner wallet address:', ownerAddress);
        
        return ownerAddress;
        
    } catch (error) {
        console.error('Error:', error);
        throw error;
    }
}

const vaultAddr = process.argv[2];
if (!vaultAddr) {
    console.error('Usage: ts-node src/scripts/get-vault-owner.ts <vaultAddress>');
    process.exit(1);
}

getVaultOwner(vaultAddr)
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
