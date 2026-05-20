const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;
const API_KEY = process.env.ANTHROPIC_API_KEY || '';

const server = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // Proxy hacia Anthropic
  if (req.method === 'POST' && req.url === '/api/generar') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      const options = {
        hostname: 'api.anthropic.com',
        path: '/v1/messages',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': API_KEY,
          'anthropic-version': '2023-06-01'
        }
      };

    const proxyReq = https.request(options, proxyRes => {
  let respBody = '';
  proxyRes.on('data', chunk => respBody += chunk);
  proxyRes.on('end', () => {
    console.log('Anthropic status:', proxyRes.statusCode);
    console.log('Anthropic response:', respBody.substring(0, 300));
    res.writeHead(proxyRes.statusCode, { 'Content-Type': 'application/json' });
    res.end(respBody);
  });
});

      proxyReq.on('error', e => {
        res.writeHead(500);
        res.end(JSON.stringify({ error: e.message }));
      });

      proxyReq.write(body);
      proxyReq.end();
    });
    return;
  }

  // Servir el HTML
  if (req.method === 'GET' && (req.url === '/' || req.url === '/index.html')) {
    const filePath = path.join(__dirname, 'index.html');
    fs.readFile(filePath, (err, data) => {
      if (err) { res.writeHead(404); res.end('Not found'); return; }
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(data);
    });
    return;
  }

  res.writeHead(404);
  res.end('Not found');
});

server.listen(PORT, () => {
  console.log('Servidor corriendo en puerto ' + PORT);
});
