const https = require('https');
const apiKey = 'ceXQypA3Gj8dkLCKJJ3k9ELwzwFvRXca';
const olaUrl = `https://api.olamaps.io/routing/v1/directions?origin=28.6139,77.2090&destination=28.6200,77.2100&api_key=${apiKey}`;
const tomtomUrl = `https://api.tomtom.com/routing/1/calculateRoute/28.6139,77.2090:28.6200,77.2100/json?key=${apiKey}`;
const mqUrl = `http://www.mapquestapi.com/directions/v2/route?key=${apiKey}&from=Clarendon,VA&to=Washington,DC`;

https.get(olaUrl, (res) => {
  let data = ''; res.on('data', chunk => data += chunk);
  res.on('end', () => console.log('Ola Status:', res.statusCode));
}).on('error', () => {});

https.get(tomtomUrl, (res) => {
  let data = ''; res.on('data', chunk => data += chunk);
  res.on('end', () => console.log('TomTom Status:', res.statusCode));
}).on('error', () => {});

const http = require('http');
http.get(mqUrl, (res) => {
  let data = ''; res.on('data', chunk => data += chunk);
  res.on('end', () => console.log('MapQuest Status:', res.statusCode));
}).on('error', () => {});
