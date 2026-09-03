import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', error => console.log('PAGE ERROR STACK:', error.stack));
  
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle2' });
  
  // Login
  try {
    await page.type('input[type="text"]', 'IT');
    await page.type('input[type="password"]', '1282');
    await page.click('button[type="submit"]');
  } catch(e) {}
  await new Promise(r => setTimeout(r, 2000));
  
  // click customers tab
  const tabs = await page.$$('nav button');
  for (const t of tabs) {
    const text = await page.evaluate(el => el.innerText, t);
    if (text.includes('Customers')) {
      await t.click();
      break;
    }
  }
  await new Promise(r => setTimeout(r, 1000));
  
  // click add customer
  const btns = await page.$$('button');
  for (const b of btns) {
    const text = await page.evaluate(el => el.innerText, b);
    if (text.includes('Add Customer') || text.includes('Save Customer')) {
      await b.click();
      break;
    }
  }
  await new Promise(r => setTimeout(r, 1000));
  
  // fill form
  try {
    const inputs = await page.$$('input');
    await inputs[0].type('New Test Customer'); // Full Name
    await inputs[1].type('A1234567'); // Passport
    
    const modalBtns = await page.$$('form button');
    for (const b of modalBtns) {
      const text = await page.evaluate(el => el.innerText, b);
      if (text.includes('Save Customer') || text.includes('Add')) {
        await b.click();
        break;
      }
    }
  } catch(e) { console.log("Form error", e); }
  
  await new Promise(r => setTimeout(r, 3000));
  const html = await page.evaluate(() => document.body.innerText);
  console.log("PAGE TEXT CONTAINS CUSTOMER:", html.includes('New Test Customer'));
  await browser.close();
})();
