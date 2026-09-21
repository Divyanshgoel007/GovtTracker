const https = require('https');
const apiKey = 'hjbAPrVpaduHEFcsQCmw7zFSoEeKDAnp';
const url = `https://api.openrouteservice.org/v2/directions/driving-car?api_key=${apiKey}&start=8.681495,49.41461&end=8.687872,49.420318`;

https.get(url, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => console.log('ORS Status:', res.statusCode, 'Data:', data.substring(0, 150)));
}).on('error', e => console.error(e));
