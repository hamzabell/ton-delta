
const DEDUST_API = 'https://api.dedust.io/v2/pools';

async function main() {
  try {
    console.log('Fetching DeDust API...');
    const res = await fetch(DEDUST_API);
    if (!res.ok) {
        throw new Error(`API Failed: ${res.status}`);
    }
    const pools = await res.json();
    console.log(`Total Pools: ${pools.length}`);

    const tonPools = pools.filter((p: any) => {
        const hasTon = p.assets.some((a: any) => a.type === 'native' && a.metadata?.symbol === 'TON');
        const otherAsset = p.assets.find((a: any) => !(a.type === 'native' && a.metadata?.symbol === 'TON'));
        const reserves = BigInt(p.reserves[0]);
        return hasTon && otherAsset && reserves > BigInt(1000000000); 
    });
    
    console.log(`Basic TON Pools: ${tonPools.length}`);
    
    const withMeta = tonPools.filter((p: any) => {
        const otherAsset = p.assets.find((a: any) => !(a.type === 'native'));
        return otherAsset && otherAsset.metadata;
    });
    
    console.log(`Pools with 2nd Asset Metadata: ${withMeta.length}`);
    
    if (withMeta.length > 0) {
        console.log('Sample Good Pool:', JSON.stringify(withMeta[0], null, 2));
    } else {
        console.log('CRITICAL: No pools have metadata for the 2nd asset!');
    }

  } catch (error) {
    console.error('Error:', error);
  }
}

main();
