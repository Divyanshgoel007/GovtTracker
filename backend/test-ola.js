const https = require('https');
const apiKey = 'ceXQypA3Gj8dkLCKJJ3k9ELwzwFvRXca';
const olaUrl = `https://api.olamaps.io/routing/v1/directions/basic?origin=28.6139,77.2090&destination=28.6200,77.2100&api_key=${apiKey}`;

const req = https.request(olaUrl, { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Request-Id': '1234' } }, (res) => {
  let data = ''; res.on('data', chunk => data += chunk);
  res.on('end', () => console.log('Ola Status:', res.statusCode, 'Data:', data.substring(0, 150)));
});
req.on('error', console.error);
req.end();
