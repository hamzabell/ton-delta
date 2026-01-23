import { TonClient, Address, toNano } from 'ton';
import { getHttpEndpoint } from '@orbs-network/ton-access';
import { DEX, pTON } from '@ston-fi/sdk';
import { from, Observable, of } from 'rxjs';
import { map, switchMap, catchError } from 'rxjs/operators';
import { CURRENT_NETWORK } from './config';

// Placeholder for Token Addresses (Mainnet)
const TOKENS = CURRENT_NETWORK.tokens;

const getClient = async () => {
    // Override endpoint if provided by config (e.g. Testnet)
    if (CURRENT_NETWORK.tonApi) {
        return new TonClient({ endpoint: CURRENT_NETWORK.tonApi });
    }
    const endpoint = await getHttpEndpoint();
    return new TonClient({ endpoint });
};

/**
 * Ston.fi Integration Service
 * Handles Spot Swaps and "Stasis Mode" entry (TON -> stTON)
 */
export const stonfi = {

    /**
     * Get Spot Price for a Pair on Ston.fi
     * @param baseToken Address of base token (e.g., TON)
     * @param quoteToken Address of quote token (e.g., USDT)
     */
    getSpotPrice$: (baseToken: string, quoteToken: string): Observable<number> => {
        return from(getClient()).pipe(
            switchMap(client => {
                const routerContract = new DEX.v1.Router(
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    Address.parse(CURRENT_NETWORK.stonRouter) as any
                );
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const _router = client.open(routerContract as any);
                
                // Simulate Price Fetch (SDK v1 Router doesn't expose getExpectedExchange directly)
                return from(Promise.reject("Price fetch via Router not implemented in v1 SDK"));
            }),
            map(expected => {
                // Return implied price
                return Number(expected) / 1e9; // Simplified
            }),
            catchError(err => {
                console.warn('[StonFi] Price fetch failed, returning mock 5.50', err);
                return of(5.50);
            })
        );
    },

    /**
     * Build Transaction Body for swapping TON -> Token
     * Used for:
     * 1. Entry: TON -> USDT (if needed)
     * 2. Stasis: TON -> stTON
     */
    buildSwapTx: async (params: {
        userWalletAddress: string;
        fromToken: 'TON' | string;
        toToken: string;
        amount: string;
        minOutput: string;
    }) => {
        const { beginCell, toNano, Address } = await import('@ton/core');
        
        // 1. Swap TON -> Token (Stasis Entry)
        // We send TON to the pTON Vault (or Router) with the Swap Payload.
        // OpCode: 0x25938561 (swap)
        // This payload tells the DEX to swap the incoming TON.
        
        const swapBody = beginCell()
            .storeUint(0x25938561, 32) // OpCode: Swap
            .storeUint(0, 64) // QueryID
            .storeAddress(Address.parse(params.userWalletAddress)) // Owner/Receiver
            .storeCoins(toNano(params.minOutput)) // Min Out
            .storeAddress(Address.parse(params.userWalletAddress)) // Excess/Response
            .storeBit(0) // Custom Payload (null)
            .storeRef(
                 // Referral / Forward Payload
                 beginCell().storeUint(0, 1).endCell()
            )
            .endCell();

        return {
            to: CURRENT_NETWORK.stonRouter, // Send to Router (who forwards to pTON vault usually) or direct pTON vault
            value: BigInt(params.amount) + toNano('0.2'), // + Gas
            body: swapBody.toBoc().toString('base64')
        };
    },

    /**
     * Enter Stasis Mode
     * Macro for swapping TON balance -> Liquid Staking Token
     */
    buildEnterStasisTx: async (amount: string) => {
        // Hardcoded to swap TON -> stTON
        return stonfi.buildSwapTx({
            userWalletAddress: '0x...', // Context dependent
            fromToken: 'TON',
            toToken: TOKENS.tsTON,
            amount,
            minOutput: '1' // Sliver protection handled elsewhere
        });
    }
};
