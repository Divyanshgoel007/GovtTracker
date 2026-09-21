const https = require('https');
const apiKey = 'hjbAPrVpaduHEFcsQCmw7zFSoEeKDAnp';
const url = `https://www.mapquestapi.com/directions/v2/route?key=${apiKey}&from=Clarendon,VA&to=Washington,DC`;

https.get(url, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => console.log('MapQuest Status:', res.statusCode, 'Data:', data.substring(0, 150)));
}).on('error', e => console.error(e));
