
import axios from 'axios';

async function main() {
  const urls = [
      'https://api.storm.tg/api/v1/pairs',
      'https://api.storm.tg/api/v0/pairs',
      'https://api.storm.tg/api/v1/markets',
      'https://storm-api.nz/api/pairs' // Some random guess from experience? No, stick to subdomains.
  ];

  for (const url of urls) {
      try {
        console.log(`Checking ${url}...`);
        const res = await axios.get(url);
        if (res.status === 200) {
            console.log(`SUCCESS: ${url}`);
            const data = res.data;
            if (Array.isArray(data) && data.length > 0) {
                console.log('Sample:', JSON.stringify(data[0], null, 2));
            } else if (data.pairs) {
                 console.log('Sample from data.pairs:', JSON.stringify(data.pairs[0], null, 2));
            } else {
                console.log('Data structure unknown:', Object.keys(data));
            }
            return; // Found one
        }
      } catch (e: any) {
          console.log(`Failed ${url}: ${e.message}`);
      }
  }
}

main();
