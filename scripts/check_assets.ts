import { StonApiClient } from '@ston-fi/api';

async function main() {
    const client = new StonApiClient();
    const search = 'DOGE';
    console.log(`Searching for ${search}...`);
    const results = await client.searchAssets({ searchString: search, condition: 'Contains' });
    console.log(`Found ${results.length} results for ${search}`);
    results.forEach(a => console.log(`${a.meta?.symbol || 'Unknown'}: ${a.contractAddress}`));
    
    const search2 = 'DOGS';
    console.log(`Searching for ${search2}...`);
    const results2 = await client.searchAssets({ searchString: search2, condition: 'Contains' });
    console.log(`Found ${results2.length} results for ${search2}`);
    results2.forEach(a => console.log(`${a.meta?.symbol || 'Unknown'}: ${a.contractAddress}`));
}

main();
