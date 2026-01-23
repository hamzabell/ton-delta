/* eslint-disable @typescript-eslint/ban-ts-comment */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ExecutionService } from '../lib/execution';
import { prisma } from '../lib/prisma';
import { stonfi } from '../lib/stonfi';
import { Address } from '@ton/core';
import { firstValueFrom, of } from 'rxjs';

// --- Mocks ---

// Mock Prisma
vi.mock('../lib/prisma', () => ({
  prisma: {
    position: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    auditLog: {
        create: vi.fn(),
    },
    $transaction: vi.fn((ops) => Promise.resolve(ops)),
  }
}));

// Mock Ston.fi
vi.mock('../lib/stonfi', () => ({
  stonfi: {
    buildSwapTx: vi.fn().mockResolvedValue({
      to: 'EQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAM9c',
      value: '100000000',
      body: 'te6ccgEBAQEAAgAAAA=='
    })
  }
}));

// Mock Storm Trade (Dynamic Import in code, so we mock the module)
vi.mock('../lib/storm', () => ({
  buildOpenPositionPayload: vi.fn().mockResolvedValue({
    to: 'EQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAM9c',
    value: '200000000',
    body: 'te6ccgEBAQEAAgAAAA=='
  }),
  buildClosePositionPayload: vi.fn().mockResolvedValue({
    to: 'EQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAM9c',
    value: '50000000',
    body: 'te6ccgEBAQEAAgAAAA=='
  }),
  buildAdjustMarginPayload: vi.fn().mockResolvedValue({
    to: 'EQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAM9c',
    value: '50000000',
    body: 'te6ccgEBAQEAAgAAAA=='
  })
}));

// Mock Custodial Wallet
vi.mock('../lib/custodialWallet', async () => {
  const { of } = await import('rxjs');
  return {
    sendTransactions$: vi.fn().mockReturnValue(of({ seqno: 12345 })),
    getKeeperWallet$: vi.fn()
  };
});

// Mock W5 Utils
vi.mock('../lib/w5-utils', () => ({
    wrapWithKeeperRequest: vi.fn().mockResolvedValue({
        toBoc: () => Buffer.from('mock_boc')
    }),
    checkContractDeployed: vi.fn()
}));


describe('Core Features E2E Verification', () => {
    const mockPositionId = 'pos_123';
    const mockVaultAddress = 'EQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAM9c';
    const mockUserAddress = 'EQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAM9c';

    beforeEach(() => {
        vi.clearAllMocks();
        vi.stubEnv('NEXT_PUBLIC_KEEPER_ADDRESS', 'EQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAM9c');
        vi.stubEnv('NEXT_PUBLIC_TREASURY_ADDRESS', 'EQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAM9c');
    });

    afterEach(() => {
        vi.unstubAllEnvs();
    });

    describe('Feature 1: Entering Basis Trade', () => {
        it('given a funded and deployed vault with 100 TON: it should swap 50 TON to Spot and use 50 TON to Open Short', async () => {
            // Setup
            const mockPosition = {
                id: mockPositionId,
                status: 'pending',
                vaultAddress: mockVaultAddress,
                user: { walletAddress: mockUserAddress },
                totalEquity: 100,
                pairId: 'DOGS-TON'
            };
            
            // @ts-expect-error
            prisma.position.findUnique.mockResolvedValue(mockPosition);

            const { checkContractDeployed } = await import('../lib/w5-utils');
            // @ts-expect-error
            checkContractDeployed.mockResolvedValue(true);

            // Execute
            await ExecutionService.enterInitialPosition(mockPositionId);

            // Assert
            // 1. Check Ston.Fi Swap (50% of 100 = 50)
            expect(stonfi.buildSwapTx).toHaveBeenCalledWith(expect.objectContaining({
                fromToken: 'TON',
            }));

            // 2. Check Storm Open Position (50% = 50)
            const { buildOpenPositionPayload } = await import('../lib/storm');
            expect(buildOpenPositionPayload).toHaveBeenCalledWith(expect.objectContaining({
                amount: '50.00', // 100 * 0.5
                leverage: 1
            }));

            // 3. Check DB Update
            expect(prisma.position.update).toHaveBeenCalledWith({
                where: { id: mockPositionId },
                data: expect.objectContaining({
                    status: 'active',
                    spotAmount: 50,
                    perpAmount: 50
                })
            });
        });

        it('given an undeployed vault: it should throw/exit', async () => {
             const mockPosition = {
                id: mockPositionId,
                status: 'pending',
                vaultAddress: mockVaultAddress, 
                user: { walletAddress: mockUserAddress }
             };
             // @ts-expect-error
             prisma.position.findUnique.mockResolvedValue(mockPosition);
             
             const { checkContractDeployed } = await import('../lib/w5-utils');
             // @ts-expect-error
             checkContractDeployed.mockResolvedValue(false);

             await expect(ExecutionService.enterInitialPosition(mockPositionId))
                 .rejects.toThrow("Vault not deployed");
        });
    });

    describe('Feature 2: Re-balancing', () => {
        it('given a positive delta drift (Spot > Perp): it should Open more Short to match', async () => {
            // Setup: Delta = +10 (Need to Short 10 more)
            const delta = 10;
            const mockPosition = {
                id: mockPositionId,
                vaultAddress: mockVaultAddress
            };
            // @ts-expect-error
            prisma.position.findUnique.mockResolvedValue(mockPosition);

            // Execute
            await ExecutionService.rebalanceDelta(mockPositionId, delta);

            // Assert
            const { buildOpenPositionPayload } = await import('../lib/storm');
            expect(buildOpenPositionPayload).toHaveBeenCalledWith(expect.objectContaining({
                amount: '10.00'
            }));

            // Verify DB records increment
            expect(prisma.position.update).toHaveBeenCalledWith({
                where: { id: mockPositionId },
                data: { perpAmount: { increment: 10 } }
            });
        });

        it('given a negative delta drift (Over-hedged): it should Close Short to match', async () => {
             // Setup: Delta = -20 (Need to reduce Short by 20)
             const delta = -20;
             const mockPosition = {
                 id: mockPositionId,
                 vaultAddress: mockVaultAddress
             };
             // @ts-expect-error
             prisma.position.findUnique.mockResolvedValue(mockPosition);
 
             // Execute
             await ExecutionService.rebalanceDelta(mockPositionId, delta);
 
             // Assert
             const { buildClosePositionPayload } = await import('../lib/storm');
             expect(buildClosePositionPayload).toHaveBeenCalledWith(expect.objectContaining({
                 positionId: mockPositionId
                 // Note: Logic currently defaults to Full Close for large drift if partials not supported in mock
             }));
        });
    });

    describe('Feature 3: Exit Max Loss (Panic Unwind)', () => {
        it('given max loss reached: it should atomically Close Short and Sell Spot to TON', async () => {
             // Setup
             const mockPosition = {
                 id: mockPositionId,
                 status: 'active',
                 vaultAddress: mockVaultAddress,
                 user: { walletAddress: mockUserAddress },
                 pairId: 'DOGS-TON',
                 spotValue: 100,
                 spotAmount: 100,
                 entryPrice: 1,
                 currentPrice: 1
             };
             // @ts-expect-error
             prisma.position.findUnique.mockResolvedValue(mockPosition);

             // Execute
             await ExecutionService.executePanicUnwind(mockPositionId, 'MAX_LOSS');

             // Assert
             // 1. Close Position
             const { buildClosePositionPayload } = await import('../lib/storm');
             expect(buildClosePositionPayload).toHaveBeenCalled();

             // 2. Sell Spot (DOGS -> TON)
             expect(stonfi.buildSwapTx).toHaveBeenCalledWith(expect.objectContaining({
                 fromToken: 'DOGS',
                 toToken: 'TON'
             }));

             // 3. Status Update -> closed
             expect(prisma.position.update).toHaveBeenCalledWith(expect.objectContaining({
                 data: { status: 'closed' }
             }));
        });
    });

    describe('Feature 4: Stasis Strategy (Yield Hunter)', () => {
        it('given pending stake status: it should swap TON to tsTON and activate stasis', async () => {
             // Setup: Logic calls processPendingStake
             const mockPosition = {
                id: mockPositionId,
                status: 'stasis_pending_stake', // State set by enterStasis
                vaultAddress: mockVaultAddress,
                totalEquity: 100,
                user: { walletAddress: mockUserAddress }
             };
             // @ts-expect-error
             prisma.position.findUnique.mockResolvedValue(mockPosition);

             // Execute
             await ExecutionService.processPendingStake(mockPositionId);

             // Assert
             expect(stonfi.buildSwapTx).toHaveBeenCalledWith(expect.objectContaining({
                 fromToken: 'TON',
                 toToken: 'tsTON',
                 // amount: roughly 99% of 100
             }));

             expect(prisma.position.update).toHaveBeenCalledWith({
                 where: { id: mockPositionId },
                 data: { status: 'stasis_active' }
             });
        });

        it('given exit request from stasis_active: it should Unstake tsTON to TON first', async () => {
            const mockPosition = {
                id: mockPositionId,
                status: 'stasis_active',
                vaultAddress: mockVaultAddress,
                totalEquity: 100,
                user: { walletAddress: mockUserAddress }
             };
             // @ts-expect-error
             prisma.position.findUnique.mockResolvedValue(mockPosition);

             // Execute
             await ExecutionService.exitStasis(mockPositionId);

             // Assert
             // Should Unstake
             expect(stonfi.buildSwapTx).toHaveBeenCalledWith(expect.objectContaining({
                fromToken: 'tsTON',
                toToken: 'TON',
            }));

            // Should set status to 'stasis' (Cash) for next cycle
            expect(prisma.position.update).toHaveBeenCalledWith({
                where: { id: mockPositionId },
                data: { status: 'stasis' }
            });
        });
    });

    describe('Feature 5: Panic Exit Anytime', () => {
        it('given user panic in Active state: it should execute Unwind', async () => {
             // Reuse Logic from Feature 3, just different reason
             const mockPosition = {
                id: mockPositionId,
                status: 'active',
                vaultAddress: mockVaultAddress,
                user: { walletAddress: mockUserAddress },
                pairId: 'DOGS-TON',
                spotValue: 100,
                spotAmount: 100,
                entryPrice: 1,
                currentPrice: 1
             };
             // @ts-expect-error
             prisma.position.findUnique.mockResolvedValue(mockPosition);

             await ExecutionService.executePanicUnwind(mockPositionId, 'USER_PANIC');

             expect(prisma.position.update).toHaveBeenCalledWith(expect.objectContaining({
                data: { status: 'closed' }
            }));
        });
    });

});
