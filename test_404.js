import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  
  page.on('response', res => {
    if (res.status() === 404) console.log("404 URL:", res.url());
  });
  
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle2' });
  await browser.close();
})();
