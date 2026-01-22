const https = require('https');

// Trying the other domain mentioned in plans
const url = 'https://api.storm.tg/api/v1/pairs'; 
// Or maybe just storm.tg/api/pairs? Let's try the one from docs/implementation_plan.md which was https://api.storm.tg/perp/{pairId}
// Usually these APIs have a list endpoint.

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
  });

}).on('error', (e) => {
  console.error('HTTPS Error:', e);
});
