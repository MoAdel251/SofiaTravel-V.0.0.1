const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

async function renderPng() {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const svgNormal = fs.readFileSync(path.join(__dirname, '../public/icon.svg'), 'utf-8');
  const svgMaskable = fs.readFileSync(path.join(__dirname, '../public/icon-maskable.svg'), 'utf-8');

  const targets = [
    { name: 'pwa-192x192.png', size: 192, svg: svgNormal },
    { name: 'pwa-512x512.png', size: 512, svg: svgNormal },
    { name: 'pwa-maskable-512x512.png', size: 512, svg: svgMaskable },
    { name: 'apple-touch-icon.png', size: 180, svg: svgNormal },
    { name: 'favicon.ico', size: 48, svg: svgNormal }
  ];

  for (const t of targets) {
    const page = await browser.newPage();
    await page.setViewport({ width: t.size, height: t.size, deviceScaleFactor: 1 });
    const html = `<!DOCTYPE html><html><body style="margin:0;padding:0;overflow:hidden;background:transparent;">
      <div style="width:${t.size}px;height:${t.size}px;">${t.svg}</div>
    </body></html>`;
    await page.setContent(html, { waitUntil: 'load' });
    const dest = path.join(__dirname, '../public', t.name);
    await page.screenshot({ path: dest, omitBackground: false });
    await page.close();
    console.log(`Generated ${t.name} (${t.size}x${t.size})`);
  }

  await browser.close();
  console.log('All PWA icon assets generated successfully.');
}

renderPng().catch(err => {
  console.error('Failed to generate PNG icons via puppeteer:', err);
  process.exit(1);
});
