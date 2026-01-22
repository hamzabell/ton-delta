const https = require('https');

const url = 'https://api.storm.trade/api/v1/pairs';

console.log('Fetching pairs from:', url);

https.get(url, (res) => {
  console.log('StatusCode:', res.statusCode);
  console.log('Headers:', res.headers);

  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    console.log('Body Preview:', data.substring(0, 500));
    try {
        const json = JSON.parse(data);
        console.log('JSON Parsed. Pairs Count:', Array.isArray(json) ? json.length : (json.pairs ? json.pairs.length : 'Unknown'));
    } catch(e) {
        console.error('JSON Parse Error:', e.message);
    }
  });

}).on('error', (e) => {
  console.error('HTTPS Error:', e);
});
