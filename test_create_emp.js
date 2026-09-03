import fetch from 'node-fetch';
(async () => {
  const res = await fetch('http://localhost:3000/api/employees', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'Test Employee 2' })
  });
  console.log('Status:', res.status);
  const text = await res.text();
  console.log('Response:', text);
})();
