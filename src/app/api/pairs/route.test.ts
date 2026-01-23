import { describe, it, expect, vi } from 'vitest';
import { GET } from './route';

describe('GET /api/pairs', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn(async () => ({
      ok: true,
      json: async () => ([
        {
          assets: [
            { type: 'native', metadata: { symbol: 'TON' } },
            { type: 'jetton', metadata: { symbol: 'DOGS' } }
          ],
          reserves: ['100000000000', '100000000000'],
          stats: { volume: ['1000', '1000'], fees: ['10', '10'] }
        }
      ]),
    })));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('should return a list of trading pairs', async () => {
    const request = new Request('http://localhost/api/pairs');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.pairs).toBeDefined();
    expect(data.pairs.length).toBeGreaterThan(0);
    expect(data.pairs[0]).toHaveProperty('id');
    expect(data.pairs[0]).toHaveProperty('apr'); // Constant has 'apr' locally, check type
  });
});
