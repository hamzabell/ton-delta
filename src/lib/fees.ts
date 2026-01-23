import { beginCell, toNano, Address } from '@ton/core';

/**
 * Fee Configuration
 * FEE_PERCENT: 20% of Net Profit
 * TREASURY: Wallet to receive the fees
 */
const FEE_PERCENT = 0.20;

export const getTreasuryAddress = () => {
    return process.env.PAMELO_TREASURY_WALLET || process.env.NEXT_PUBLIC_TREASURY_ADDRESS || '';
}

/**
 * Calculates the Performance Fee based on PnL
 * @param entryEquity Value of position at entry (in USD/TON)
 * @param exitEquity Value of position at exit (in USD/TON)
 * @returns { profit: number, fee: number, netToUser: number }
 */
export const calculatePerformanceFee = (entryEquity: number, exitEquity: number) => {
    const profit = exitEquity - entryEquity;
    
    // improved logic: No fee if loss or break-even
    if (profit <= 0) {
        return {
            profit: 0,
            fee: 0,
            netToUser: exitEquity // Return full amount
        };
    }

    const fee = profit * FEE_PERCENT;
    const netToUser = exitEquity - fee;

    return {
        profit,
        fee,
        netToUser
    };
};

export const buildAtomicExitTx = (params: {
    userAddress: string;
    totalAmountTon: number;
    entryValueTon: number;
}) => {
    const treasuryAddress = getTreasuryAddress();
    if (!treasuryAddress) {
        throw new Error('Treasury Address not configured');
    }

    const { fee, netToUser } = calculatePerformanceFee(params.entryValueTon, params.totalAmountTon);

    const messages = [];

    // 1. Fee Message (if applicable)
    if (fee > 0.01) { // Min threshold to avoid dust errors
        messages.push({
            to: Address.parse(treasuryAddress),
            value: toNano(fee.toFixed(9)),
            body: beginCell()
                .storeUint(0, 32)
                .storeStringTail("Profit Share: 20% to Pamelo.finance Treasury")
                .endCell()
        });
    }

    // 2. Return Capital to User
    // If the W5 is a sub-wallet, we might want to sweep to the main wallet.
    // Assuming 'userAddress' is the main wallet.
    messages.push({
        to: Address.parse(params.userAddress),
        value: toNano(netToUser.toFixed(9)), // Send remainder
        body: beginCell()
            .storeUint(0, 32)
            .storeStringTail("Pamelo.finance: Strategy Exit")
            .endCell()
    });

    return {
        messages,
        summary: {
            total: params.totalAmountTon,
            fee,
            net: netToUser
        }
    };
};
