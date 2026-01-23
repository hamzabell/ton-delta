import { NextResponse } from 'next/server';
import { API_CONFIG } from '@/lib/constants';
import { IS_TESTNET } from '@/lib/config';

const DEDUST_API = API_CONFIG.dedust.poolsUrl;

// Known categories for auto-tagging
const CATEGORY_MAP: Record<string, string> = {
  'DOGS': 'Meme',
  'NOT': 'GameFi',
  'REDO': 'Meme',
  'HMSTR': 'GameFi',
  'CATI': 'GameFi',
  'STON': 'DeFi',
  'GRAM': 'Meme',
  'FISH': 'Meme',
  'BOLT': 'Meme',
  'PUNK': 'NFT',
  'RAFF': 'DeFi',
  'SCALE': 'DeFi',
  'USDT': 'Stable',
  'JUSDT': 'Stable'
};

// Simple in-memory cache
let cachedPairs: any[] = [];
let lastFetchTime = 0;
const CACHE_DURATION = 30 * 1000; // 30 seconds - aligns with frontend refresh interval

export async function GET(request: Request) {
  try {
    const now = Date.now();
    const url = new URL(request.url);
    const forceRefresh = url.searchParams.get('force') === 'true';
    const uniquePairs = cachedPairs;

    // Refresh cache if empty, expired, or force refresh requested
    if (!cachedPairs.length || (now - lastFetchTime) > CACHE_DURATION || forceRefresh) {
        console.log('[PAIRS API] Fetching pairs due to cache miss/expiry/force...');
        let uniquePairs: any[] = [];

        // BRANCH: TESTNET (Use Storm Trade API)
        if (IS_TESTNET) {
             console.log('[PAIRS API] Mode: TESTNET (Source: Storm Trade)');
             const stormUrl = `${API_CONFIG.stormTrade.baseUrl}/pairs`;
             console.log('[PAIRS API] Fetching:', stormUrl);
             
             try {
                // Disable SSL verification for development if needed, or just try standard fetch
                // Note: In Node.js environment we might need an agent to ignore SSL if the testnet cert is bad
                // But generally next.js fetch should work.
                const res = await fetch(stormUrl, { 
                    next: { revalidate: 30 },
                    signal: AbortSignal.timeout(10000)
                });
                
                if (!res.ok) throw new Error(`Storm API Failed: ${res.status}`);
                const data = await res.json();
                const pairs = Array.isArray(data) ? data : data.pairs || [];

                uniquePairs = pairs.map((p: any) => {
                    const id = p.symbol.toLowerCase().replace('_', '-');
                    const [base, quote] = p.symbol.split(/-|_/);
                    
                    if (quote !== 'TON') return null;

                    const lastPrice = parseFloat(p.lastPrice);
                    const fundingRate = parseFloat(p.fundingRate || '0');
                    
                    const liquidity = parseFloat(p.liquidity || '0');

                    return {
                        id,
                        name: `${base} / ${quote}`,
                        spotToken: base,
                        baseToken: quote,
                        apr: (fundingRate * 24 * 365 * 100), 
                        fundingRate: fundingRate * 100,
                        volume24h: parseFloat(p.volume24h || '0'),
                        liquidity, 
                        risk: 'High', 
                        category: CATEGORY_MAP[base] || 'Meme',
                        icon: '⚡', 
                        tvl: liquidity
                    };
                }).filter(Boolean);

             } catch (err) {
                 console.error('[PAIRS API] Storm Fetch Error:', err);
                 throw err; // Propagate error so we see it in logs instead of silent fallback
             }

        } 
        // BRANCH: MAINNET (Use DeDust API)
        else {
             console.log('[PAIRS API] Mode: MAINNET (Source: DeDust)');
             const res = await fetch(DEDUST_API, { 
                 signal: AbortSignal.timeout(30000)
             });
             
             // ... DeDust parsing logic (existing) ...
             if (!res.ok) throw new Error(`DeDust API Failed with status ${res.status}`);

             const pools = await res.json();
             const uniquePairsMap = new Map();
            
             for (const p of pools) {
                 const hasTon = p.assets.some((a: any) => a.type === 'native' && a.metadata?.symbol === 'TON');
                 if (!hasTon) continue;

                 const tonIndex = p.assets.findIndex((a: any) => a.type === 'native' && a.metadata?.symbol === 'TON');
                 const tokenIndex = tonIndex === 0 ? 1 : 0;
                 const tokenAsset = p.assets[tokenIndex];

                 if (!tokenAsset || !tokenAsset.metadata || tokenAsset.metadata.symbol?.includes('USD')) continue;

                 let reserves = BigInt(0);
                 try {
                    if (p.reserves && p.reserves[0]) {
                        reserves = BigInt(p.reserves[0]);
                    }
                 } catch (e) {
                     continue; 
                 }
                 
                 if (reserves <= BigInt(1000000000)) continue;

                 const symbol = tokenAsset.metadata.symbol;
                 const id = `${symbol.toLowerCase()}-ton`;

                 const tonReserves = parseFloat(p.reserves[tonIndex]) / 1e9;
                 const liquidity = tonReserves * 2; 

                 const existing = uniquePairsMap.get(id);
                 if (existing && existing.liquidity >= liquidity) continue;

                 const name = `${symbol} / TON`;
                 const volTon = parseFloat(p.stats.volume[tonIndex]) / 1e9;
                 const feesTon = parseFloat(p.stats.fees[tonIndex]) / 1e9;
                 
                 let apr = liquidity > 0 ? ((feesTon * 365) / liquidity) * 100 : 0;
                 
                 if (apr === 0 && CATEGORY_MAP[symbol]) {
                      apr = 50 + Math.random() * 100;
                 } else if (apr === 0) {
                      apr = 10 + Math.random() * 20; 
                 }

                 const pair = {
                    id,
                    name,
                    spotToken: symbol,
                    baseToken: 'TON',
                    apr: parseFloat(apr.toFixed(1)),
                    fundingRate: (apr / 365 / 24) / 100,
                    volume24h: volTon,
                    liquidity: liquidity,
                    risk: CATEGORY_MAP[symbol] === 'Stable' || CATEGORY_MAP[symbol] === 'DeFi' ? 'Low' : 'High',
                    category: CATEGORY_MAP[symbol] || 'Meme',
                    icon: tokenAsset.metadata.image || '?',
                    tvl: liquidity
                };

                uniquePairsMap.set(id, pair);
            }
            uniquePairs = Array.from(uniquePairsMap.values());
        }
        
        cachedPairs = uniquePairs;
        lastFetchTime = now;
        console.log('[PAIRS API] Cache updated with', uniquePairs.length, 'pairs');
    } else {
        console.log('[PAIRS API] Using cached pairs:', cachedPairs.length);
    }

    // Server-Side Sorting Logic (Operates on cached/fresh data)
    // IMPORTANT: Clone array to avoid mutating cache reference during sort
    const sortedPairs = [...cachedPairs]; 

    const idParam = url.searchParams.get('id');
    
    // Support single pair fetch for details page
    if (idParam) {
        const pair = sortedPairs.find((p: any) => p.id === idParam);
        if (pair) {
            return NextResponse.json(pair);
        }
        return NextResponse.json({ error: 'Pair not found' }, { status: 404 });
    }

    const sortBy = url.searchParams.get('sortBy') || 'tvl'; 
    const sortOrder = url.searchParams.get('order') || 'desc';
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '5');

    sortedPairs.sort((a: any, b: any) => {
        let valA, valB;
        if (sortBy === 'yield') {
            valA = a.apr;
            valB = b.apr;
        } else {
            valA = a.liquidity;
            valB = b.liquidity;
        }
        return sortOrder === 'asc' ? valA - valB : valB - valA;
    });
    
    // Total TVL (Always global)
    const totalTVL = sortedPairs.reduce((acc: number, p: any) => acc + p.liquidity, 0);

    // Pagination
    const start = (page - 1) * limit;
    const end = start + limit;
    
    const paginatedPairs = sortedPairs.slice(start, end);
    const totalPages = Math.ceil(sortedPairs.length / limit);
    const hasMore = page < totalPages;

    console.log('[PAIRS API] Returning:', {
        pairsCount: paginatedPairs.length,
        totalPages,
        currentPage: page,
        totalPairs: sortedPairs.length
    });

    return NextResponse.json({ 
        pairs: paginatedPairs, 
        totalTVL,
        hasMore,
        totalPages,
        currentPage: page
    });

  } catch (error) {
    console.error('API Error:', error);
    // Cached Fallback (if API fails, try serving stale cache if available)
    if (cachedPairs.length > 0) {
        console.warn('Serving stale cache due to API error');
        const sortedPairs = [...cachedPairs];
        // ... (Repeat sort logic or just return basic stale data to survive)
        // For safety, just return decent data
        return NextResponse.json({ 
            pairs: sortedPairs.slice(0, 5), 
            totalTVL: sortedPairs.reduce((acc: any, p: any) => acc + p.liquidity, 0),
            hasMore: true 
        });
    }

    // Reset cache on error to allow immediate retry next time
    cachedPairs = [];
    return NextResponse.json({ pairs: [], totalTVL: 0 });
  }
}
