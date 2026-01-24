
import { prisma } from '../lib/prisma';
import { getKeeperWallet$, sendTransactions$ } from '../lib/custodialWallet';
import { wrapWithKeeperRequest } from '../lib/w5-utils';
import { Address, beginCell, toNano } from '@ton/core';
import { firstValueFrom } from 'rxjs';
import { Logger } from '../services/logger';

// User provided destination
const DESTINATION_ADDRESS = 'UQBF63kZHYMgnKWTlF2rxHIMlAFPN-gOMH7GXkONFgRAs44V';

async function forceSweepVaults() {
    const logCtx = 'force-sweep';
    Logger.info(logCtx, 'Starting FORCE SWEEP of all open position vaults...');

    try {
        // 1. Get all active active/stasis positions
        const positions = await prisma.position.findMany({
            where: { 
                status: { 
                    in: ['active', 'stasis', 'stasis_pending_stake', 'stasis_active'] 
                } 
            }
        });

        // 2. Identify Unique Vaults
        const uniqueVaults = new Set<string>();
        positions.forEach(p => {
            if (p.vaultAddress) uniqueVaults.add(p.vaultAddress);
        });

        Logger.info(logCtx, `Found ${positions.length} positions across ${uniqueVaults.size} unique vaults.`);

        const keeper = await firstValueFrom(getKeeperWallet$());
        const keeperAddress = keeper.contract.address;

        const vaultsToProcess = Array.from(uniqueVaults);

        for (const vaultAddr of vaultsToProcess) {
            Logger.info(logCtx, `Processing Vault: ${vaultAddr}`);

            try {
                // Find any position associated with this vault to get the user address
                const samplePosition = positions.find(p => p.vaultAddress === vaultAddr);
                const userDestination = samplePosition?.userId || DESTINATION_ADDRESS;

                // Construct Simple Sweep Message
                const sweepMsg = {
                    to: Address.parse(userDestination),
                    value: BigInt(0),
                    body: beginCell()
                        .storeUint(0, 32)
                        .storeStringTail("Refund: Asset purchase failed")
                        .endCell(),
                    mode: 128 // CARRY_ALL_REMAINING_BALANCE
                };

                // Wrap for W5 delegation
                // The Keeper signs a message to the Vault
                // The Vault executes the sweepMsg
                // We also want to revoke the keeper to clean up, but for a sweep (emptying), 
                // the account might be "destroyed" or just empty. Revoking is good practice.
                
                const targetAddress = Address.parse(vaultAddr);

                // Note: wrapWithKeeperRequest usually adds the revocation command internally if we pass the keeper address as 'revoke' arg?
                // Let's check w5-utils usage. 
                // wrapWithKeeperRequest(vaultAddress, messages, revokeAddress?)
                
                const wrappedCell = await wrapWithKeeperRequest(
                    targetAddress,
                    [sweepMsg],
                    keeperAddress // Revoke the keeper after this tx
                );

                // Send the TX from Keeper -> Vault
                const txs = [{
                    address: vaultAddr,
                    value: '50000000', // 0.05 TON for gas
                    cell: wrappedCell.toBoc().toString('base64')
                }];

                Logger.info(logCtx, `Broadcasting Sweep TX for ${vaultAddr}...`);
                const res = await firstValueFrom(sendTransactions$(txs));
                
                Logger.info(logCtx, `Sweep TX Sent! Seqno: ${res.seqno}`);

                // Update DB Status for all positions linked to this vault
                await prisma.position.updateMany({
                    where: { vaultAddress: vaultAddr },
                    data: { status: 'closed' }
                });
                
                // Rate limit safety
                await new Promise(r => setTimeout(r, 5000));

            } catch (err) {
                Logger.error(logCtx, `Failed to sweep vault ${vaultAddr}`, '', { error: String(err) });
            }
        }

        Logger.info(logCtx, 'Force Sweep Complete.');

    } catch (error) {
        Logger.error(logCtx, 'CRITICAL FAILURE', '', { error: String(error) });
    } finally {
        await prisma.$disconnect();
    }
}

forceSweepVaults();
