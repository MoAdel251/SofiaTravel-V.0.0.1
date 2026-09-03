const http = require('http');

const data = JSON.stringify({
  full_name: 'Test Customer',
  passport_number: '12345'
});

const req = http.request({
  hostname: 'localhost',
  port: 3000,
  path: '/api/customers',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(data)
  }
}, (res) => {
  let body = '';
  res.on('data', chunk => body += chunk);
  res.on('end', () => console.log('STATUS:', res.statusCode, 'BODY:', body));
});

req.on('error', e => console.error(e));
req.write(data);
req.end();
