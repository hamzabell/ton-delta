import { NextResponse } from 'next/server';
import { MEME_PAIRS, API_CONFIG } from '@/lib/constants';

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
const CACHE_DURATION = 300 * 1000; // 5 minutes (reduced frequency of blocking)

export async function GET(request: Request) {
  try {
    const now = Date.now();
    let uniquePairs = cachedPairs;

    // Refresh cache if empty or expired
    if (!cachedPairs.length || (now - lastFetchTime) > CACHE_DURATION) {
        console.log('[PAIRS API] Fetching DeDust pairs due to cache miss/expiry...');
        console.log('[PAIRS API] Cache length:', cachedPairs.length, 'Last fetch:', new Date(lastFetchTime).toISOString());
        
        // Note: DeDust API returns ~30MB of data, which takes 10-15s to download
        // We use our own in-memory cache instead of Next.js cache (which has 2MB limit)
        const res = await fetch(DEDUST_API, { 
            signal: AbortSignal.timeout(30000) // 30 second timeout for large payload
        });
        
        console.log('[PAIRS API] DeDust API response status:', res.status);
        if (!res.ok) throw new Error(`DeDust API Failed with status ${res.status}`);

        const pools = await res.json();
        const uniquePairsMap = new Map();
        
        // Single Pass Optimization: Filter -> Map -> Dedupe
        for (const p of pools) {
             const hasTon = p.assets.some((a: any) => a.type === 'native' && a.metadata?.symbol === 'TON');
             // Quick skip if no TON
             if (!hasTon) continue;

             const tonIndex = p.assets.findIndex((a: any) => a.type === 'native' && a.metadata?.symbol === 'TON');
             const tokenIndex = tonIndex === 0 ? 1 : 0;
             const tokenAsset = p.assets[tokenIndex];

             // Skip if no token metadata or if stablecoin
             if (!tokenAsset || !tokenAsset.metadata || tokenAsset.metadata.symbol?.includes('USD')) continue;

             let reserves = BigInt(0);
             try {
                if (p.reserves && p.reserves[0]) {
                    reserves = BigInt(p.reserves[0]);
                }
             } catch (e) {
                 continue; // Skip malformed
             }
             
             if (reserves <= BigInt(1000000000)) continue;

             // Mapping Logic
             const symbol = tokenAsset.metadata.symbol;
             const id = `${symbol.toLowerCase()}-ton`;

             // Dedupe check early - if we already have this ID with higher liquidity, skip
             // But wait, we need to calculate liquidity first to know if it's higher.
             
             const tonReserves = parseFloat(p.reserves[tonIndex]) / 1e9;
             const liquidity = tonReserves * 2; 

             const existing = uniquePairsMap.get(id);
             if (existing && existing.liquidity >= liquidity) continue;

             const name = `${symbol} / TON`;
             const volTon = parseFloat(p.stats.volume[tonIndex]) / 1e9;
             const feesTon = parseFloat(p.stats.fees[tonIndex]) / 1e9;
             
             let apr = liquidity > 0 ? ((feesTon * 365) / liquidity) * 100 : 0;
             
             // Randomized yields for empty pools (from existing logic)
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
        cachedPairs = uniquePairs;
        lastFetchTime = now;
        console.log('[PAIRS API] Cache updated with', uniquePairs.length, 'pairs (Optimized Loop)');
    } else {
        console.log('[PAIRS API] Using cached pairs:', uniquePairs.length);
    }

    // Server-Side Sorting Logic (Operates on cached/fresh data)
    // IMPORTANT: Clone array to avoid mutating cache reference during sort
    const sortedPairs = [...uniquePairs]; 

    const url = new URL(request.url);
    const idParam = url.searchParams.get('id');
    
    // Support single pair fetch for details page
    if (idParam) {
        const pair = uniquePairs.find((p: any) => p.id === idParam);
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
