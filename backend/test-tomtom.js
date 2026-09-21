const https = require('https');
const apiKey = 'hjbAPrVpaduHEFcsQCmw7zFSoEeKDAnp';
const url = `https://api.tomtom.com/routing/1/calculateRoute/28.6139,77.2090:28.6200,77.2100/json?key=${apiKey}`;

https.get(url, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => console.log('TomTom Status:', res.statusCode, 'Data:', data.substring(0, 150)));
}).on('error', e => console.error(e));
