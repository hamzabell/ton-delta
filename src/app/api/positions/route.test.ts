import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET, POST } from './route';
import { NextResponse } from 'next/server';

const { prismaMock } = vi.hoisted(() => {
  return {
    prismaMock: {
      position: {
        findMany: vi.fn(),
        create: vi.fn(),
      },
      user: {
        findFirst: vi.fn(),
      }
    }
  }
});

vi.mock('@/lib/prisma', () => ({
  prisma: prismaMock
}));

describe('Position Management API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('GET /api/positions should return user positions', async () => {
    // Mock DB response
    prismaMock.position.findMany.mockResolvedValue([
      { id: '1', pairId: 'dogs-ton', status: 'active' }
    ]);

    const request = new Request('http://localhost/api/positions');
    const response = await GET(request);
    const data = await response.json();
    
    expect(response.status).toBe(200);
    expect(data.positions).toHaveLength(1);
    expect(data.positions[0].pairId).toBe('dogs-ton');
  });

  it('POST /api/positions should create a new position', async () => {
    // Mock User find
    prismaMock.user.findFirst.mockResolvedValue({ id: 'user-123' });
    // Mock Create
    prismaMock.position.create.mockResolvedValue({ id: 'pos_123' });

    const body = { pairId: 'dogs-ton', capitalTON: 100 };
    const request = new Request('http://localhost/api/positions', {
      method: 'POST',
      body: JSON.stringify(body)
    });
    
    const response = await POST(request);
    const data = await response.json();

    expect(data.success).toBe(true);
    expect(data.positionId).toBe('pos_123');
  });


  it('POST /api/positions should validate input', async () => {
    const body = { pairId: 'dogs-ton' }; // Missing capital
    const request = new Request('http://localhost/api/positions', {
      method: 'POST',
      body: JSON.stringify(body)
    });
    
    const response = await POST(request);
    expect(response.status).toBe(400);
  });
});
