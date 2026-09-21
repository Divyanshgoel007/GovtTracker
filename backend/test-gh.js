const https = require('https');
const apiKey = 'hjbAPrVpaduHEFcsQCmw7zFSoEeKDAnp';
const url = `https://graphhopper.com/api/1/route?point=28.6139,77.2090&point=28.6200,77.2100&vehicle=car&key=${apiKey}`;

https.get(url, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => console.log('GraphHopper Status:', res.statusCode, 'Data:', data.substring(0, 150)));
}).on('error', e => console.error(e));
