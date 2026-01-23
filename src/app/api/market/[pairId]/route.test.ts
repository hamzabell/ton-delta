import { describe, it, expect, vi } from 'vitest';
import { GET } from './route';

describe('GET /api/market/[pairId]', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn(async () => {
         throw new Error("Network error"); // Force fallback to simulation
    }));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('should return simulated market data', async () => {
    const request = new Request('http://localhost/api/market/dogs-ton');
    const response = await GET(request, { params: { pairId: 'dogs-ton' } });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.spotPrice).toBeTypeOf('number');
    expect(data.perpPrice).toBeTypeOf('number');
    expect(data.basis).toBeTypeOf('number');
    expect(data.fundingRate).toBeTypeOf('number');
    expect(data.timestamp).toBeTypeOf('number');
  });
});
