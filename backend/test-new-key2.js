const https = require('https');
const http = require('http');
const apiKey = 'JLBd7FbkcW5dPG2xbuIAIhmvbIEr1qH6';

https.get(`https://api.tomtom.com/routing/1/calculateRoute/28.6139,77.2090:28.6200,77.2100/json?key=${apiKey}`, res => console.log('TomTom Status:', res.statusCode));
http.get(`http://www.mapquestapi.com/directions/v2/route?key=${apiKey}&from=Clarendon,VA&to=Washington,DC`, res => console.log('MapQuest Status:', res.statusCode));
https.get(`https://us1.locationiq.com/v1/directions/driving/-122.42,37.78;-122.45,37.91?key=${apiKey}`, res => console.log('LocationIQ Status:', res.statusCode));
https.get(`https://api.olamaps.io/routing/v1/directions/basic?origin=28.6139,77.2090&destination=28.6200,77.2100&api_key=${apiKey}`, {method: 'POST'}, res => console.log('Ola Status:', res.statusCode));
