import { NextResponse } from 'next/server';
import { API_CONFIG } from '@/lib/constants';
import { IS_TESTNET } from '@/lib/config';

const STONFI_ASSETS_API = 'https://api.ston.fi/v1/assets';

// Fetch authoritative assets from Ston.fi (TON Native)
async function fetchStonFiAssets(): Promise<Record<string, string>> {
    try {
        const res = await fetch(STONFI_ASSETS_API, { 
            next: { revalidate: 3600 } // Cache for 1 hour
        });
        if (!res.ok) return {};
        const data = await res.json();
        const iconMap: Record<string, string> = {};
        
        // Sort by priority desc to ensure we get the "official" token first
        const assets = (data.asset_list || []).sort((a: any, b: any) => (b.priority || 0) - (a.priority || 0));

        assets.forEach((a: any) => {
            if (a.blacklisted) return;
            const symbol = a.symbol.toUpperCase();
            if (symbol && a.image_url && !iconMap[symbol]) {
                iconMap[symbol] = a.image_url;
            }
        });
        
        // Add manual overrides for major global assets if missing or specific preference
        if (!iconMap['BTC']) iconMap['BTC'] = 'https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/128/color/btc.png';
        if (!iconMap['ETH']) iconMap['ETH'] = 'https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/128/color/eth.png';
        if (!iconMap['SOL']) iconMap['SOL'] = 'https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/128/color/sol.png';
        
        return iconMap;
    } catch (e) {
        console.error('Failed to fetch Ston.fi assets:', e);
        return {};
    }
}

const CATEGORY_MAP: Record<string, string> = {
  'DOGS': 'Meme', 'REDO': 'Meme', 'FISH': 'Meme', 'BOLT': 'Meme', 'GRAM': 'Meme',
  'POPCAT': 'Meme', 'PNUT': 'Meme', 'PENGU': 'Meme', 'BONK': 'Meme', 'TRUMP': 'Meme',
  'WIF': 'Meme', 'PEPE': 'Meme', 'DOGE': 'Crypto',
  'NOT': 'GameFi', 'HMSTR': 'GameFi', 'CATI': 'GameFi', 'MAJOR': 'GameFi', 'MEMEFI': 'GameFi',
  'STON': 'DeFi', 'RAFF': 'DeFi', 'SCALE': 'DeFi', 'JUP': 'DeFi',
  'USDT': 'Stable', 'JUSDT': 'Stable',
  'TON': 'Native', 'BTC': 'Crypto', 'ETH': 'Crypto', 'SOL': 'Crypto'
};

const resolveIcon = (symbol: string, assetsMap: Record<string, string>) => {
    const upper = symbol.toUpperCase();
    const clean = upper.startsWith('1000') ? upper.replace('1000', '') : upper;
    
    if (assetsMap[clean]) return assetsMap[clean];
    if (assetsMap[upper]) return assetsMap[upper];
    
    // Fallback generic
    return `https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/128/color/generic.png`;
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
    let uniquePairs = cachedPairs; // Changed from const to let to allow re-assignment

    // Refresh cache if empty, expired, or force refresh requested
    if (!cachedPairs.length || (now - lastFetchTime) > CACHE_DURATION || forceRefresh) {
        console.log('[PAIRS API] Fetching pairs due to cache miss/expiry/force...');
        uniquePairs = []; // Initialize uniquePairs here for the refresh logic

        const vaultAddress = 'EQDpJnZP89Jyxz3euDaXXFUhwCWtaOeRmiUJTi3jGYgF8fnj'; // Mainnet Vault

        // Fetch Data Sources in Parallel
        const [stormRes, stonFiAssets] = await Promise.all([
             IS_TESTNET 
                ? fetch(`${API_CONFIG.stormTrade.baseUrl}/pairs`, { next: { revalidate: 30 } })
                : fetch(`https://api5.storm.tg/lite/api/v0/vault/${vaultAddress}/markets`, { next: { revalidate: 300 } }),
             fetchStonFiAssets()
        ]);

        if (!stormRes.ok) throw new Error(`Storm API Failed: ${stormRes.status}`);
        
        // Parse Storm Data (Handle both Testnet Array and Mainnet Vault format)
        const stormData = await stormRes.json();
        let rawMarkets: any[] = [];
        
        if (IS_TESTNET) {
             rawMarkets = Array.isArray(stormData) ? stormData : stormData.pairs || [];
        } else {
             rawMarkets = stormData; // Vault endpoint returns array directly
        }

        uniquePairs = rawMarkets.map((m: any) => {
            // Unify Data Structure
            let base, quote, lastPrice, liquidity, fundingRate, volume24h;

            if (IS_TESTNET) {
                base = m.symbol.split(/-|_/)[0];
                quote = m.symbol.split(/-|_/)[1];
                lastPrice = parseFloat(m.lastPrice);
                liquidity = parseFloat(m.liquidity || '0');
                fundingRate = parseFloat(m.fundingRate || '0');
                volume24h = parseFloat(m.volume24h || '0');
            } else {
                base = m.name;
                quote = 'TON'; // Vault markets are always vs Collateral (TON)
                lastPrice = parseFloat(m.oracle_last_price) / 1e9;
                liquidity = parseFloat(m.amm_state?.quote_asset_reserve || '0') / 1e9;
                
                // Rate Calc
                const totalLong = parseFloat(m.amm_state?.open_interest_long || '1');
                const totalShort = parseFloat(m.amm_state?.open_interest_short || '1');
                const skew = (totalLong - totalShort) / (totalLong + totalShort + 1000);
                const hourlyRate = 0.0001 + (Math.abs(skew) * 0.0004);
                fundingRate = skew >= 0 ? hourlyRate : -hourlyRate;
                volume24h = 0; // Not provided in simple vault view
            }

            if (quote !== 'TON') return null;

            const id = `${base.toLowerCase()}-ton`;
            const name = `${base} / TON`;
            
            const apr = Math.abs(fundingRate) * 24 * 365 * 100;
            const category = CATEGORY_MAP[base] || 'Perp';
            
            // Risk logic
            const isConservative = (category === 'Stable' || category === 'DeFi') || liquidity > 1000000;
            const isMedium = liquidity > 100000 && liquidity <= 1000000;
            let riskLevel: 'Conservative' | 'Medium' | 'High' = 'High';
            if (isConservative) riskLevel = 'Conservative';
            else if (isMedium) riskLevel = 'Medium';

            const isHot = apr > 100 || volume24h > 50000;

            const icon = resolveIcon(base, stonFiAssets);
            
            // Strict Validation: Ensure we have a valid icon (implies confirmed TON Native / Whitelisted asset)
            // If we fall back to generic, we assume it's not a verified token we want to list.
            if (icon.includes('generic.png') && base !== 'TON') {
                return null;
            }

            return {
                id,
                name,
                spotToken: base,
                baseToken: 'TON',
                apr: parseFloat(apr.toFixed(1)),
                fundingRate: parseFloat(fundingRate.toFixed(6)),
                volume24h, 
                liquidity: parseFloat(liquidity.toFixed(2)),
                risk: riskLevel,
                category,
                icon, 
                tvl: parseFloat(liquidity.toFixed(2)),
                isHot
            };
        }).filter(Boolean);

        console.log(`[PAIRS API] Returned ${uniquePairs.length} markets`);
        cachedPairs = uniquePairs;
        lastFetchTime = now;
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
    const filter = url.searchParams.get('filter') || 'ALL';
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '5');

    // Filter Logic
    let processedPairs = sortedPairs;
    if (filter !== 'ALL') {
        processedPairs = processedPairs.filter((p: any) => {
            if (filter === 'HOT') return p.isHot;
            if (filter === 'CONSERVATIVE') return p.risk === 'Conservative';
            if (filter === 'HIGH_YIELD') return p.apr > 100;
            return true;
        });
    }

    processedPairs.sort((a: any, b: any) => {
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
    
    // Total TVL (Show total of what's available or filtered? Let's keep Global TVL for now as 'Protocol TVL')
    // const totalTVL = sortedPairs.reduce((acc: number, p: any) => acc + p.liquidity, 0);
    const totalTVL = processedPairs.reduce((acc: number, p: any) => acc + p.liquidity, 0);

    // Pagination
    const start = (page - 1) * limit;
    const end = start + limit;
    
    const paginatedPairs = processedPairs.slice(start, end);
    const totalPages = Math.ceil(processedPairs.length / limit);
    const hasMore = page < totalPages;

    console.log('[PAIRS API] Returning:', {
        pairsCount: paginatedPairs.length,
        totalPages,
        currentPage: page,
        totalPairs: processedPairs.length
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
