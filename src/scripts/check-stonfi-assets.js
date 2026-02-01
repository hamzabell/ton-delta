
const fetch = require('node-fetch'); // Ensure fetch is available if not global, or just rely on global in newer node

async function check() {
    console.log('Fetching StonFi Assets...');
    try {
        const res = await fetch('https://api.ston.fi/v1/assets');
        if (!res.ok) {
            console.error('Failed:', res.status, res.statusText);
            return;
        }
        const data = await res.json();
        const assets = data.asset_list || [];
        console.log(`Got ${assets.length} assets.`);

        const link = assets.find(a => a.symbol.toUpperCase() === 'LINK');
        const melania = assets.find(a => a.symbol.toUpperCase() === 'MELANIA');

        console.log('LINK:', link ? link.contract_address : 'NOT FOUND');
        console.log('MELANIA:', melania ? melania.contract_address : 'NOT FOUND');

    } catch (e) {
        console.error('Error:', e);
    }
}

check();
