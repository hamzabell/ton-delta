import { describe, it, expect, vi, beforeEach } from 'vitest';
import { driftMonitorJob } from './jobs/drift-monitor';
import { safetyCheckJob } from './jobs/safety-check';

// Hoist mock for Prisma
const { prismaMock } = vi.hoisted(() => {
  return {
    prismaMock: {
      position: {
        findUnique: vi.fn(),
        update: vi.fn(),
      },
      auditLog: {
        create: vi.fn(),
      }
    },
  };
});

vi.mock('@/lib/prisma', () => ({
  prisma: prismaMock,
}));

describe('Watchman Engine Jobs', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv('KEEPER_MNEMONIC', 'word word word word word word word word word word word word');
  });

  describe('Drift Monitor Job', () => {
    it('should trigger rebalance if drift exceeds 1.5%', async () => {
      // Setup: 2% drift (Spot 100, Perp 98 => 0.02)
      prismaMock.position.findUnique.mockResolvedValue({
        id: 'pos-1',
        spotAmount: 100,
        perpAmount: 98,
        status: 'active',
        user: { walletAddress: 'EQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAM9c' }
      });

      const result = await driftMonitorJob({ data: { positionId: 'pos-1' } } as unknown as Job);
      
      expect(result?.rebalanceTriggered).toBe(true);
      expect(prismaMock.position.update).toHaveBeenCalled();
    });

    it('should not trigger rebalance if drift is small', async () => {
       // Setup: 0.5% drift
       prismaMock.position.findUnique.mockResolvedValue({
        id: 'pos-1',
        spotAmount: 100,
        perpAmount: 99.5,
        status: 'active',
      });

      const result = await driftMonitorJob({ data: { positionId: 'pos-1' } } as unknown as Job);
      expect(result?.rebalanceTriggered).toBe(false);
    });
  });

  describe('Safety Check Job', () => {
    it('should trigger emergency unwind if equity < floor', async () => {
      // Setup: Equity 80, Floor 85
      prismaMock.position.findUnique.mockResolvedValue({
        id: 'pos-1',
        totalEquity: 80,
        principalFloor: 85,
        status: 'active'
      });

      const result = await safetyCheckJob({ data: { positionId: 'pos-1' } } as unknown as Job);
      
      expect(result?.emergencyTriggered).toBe(true);
      expect(prismaMock.position.update).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 'pos-1' }, data: { status: 'emergency' } })
      );
    });
  });
});
