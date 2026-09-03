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
  
  // click employees tab
  const tabs = await page.$$('nav button');
  for (const t of tabs) {
    const text = await page.evaluate(el => el.innerText, t);
    if (text.includes('Employees')) {
      await t.click();
      break;
    }
  }
  await new Promise(r => setTimeout(r, 1000));
  
  // click add employee
  const btns = await page.$$('button');
  for (const b of btns) {
    const text = await page.evaluate(el => el.innerText, b);
    if (text.includes('Add Employee') || text.includes('Create Account') || text.includes('Add')) {
      await b.click();
    }
  }
  await new Promise(r => setTimeout(r, 1000));
  
  // listen for API requests
  page.on('request', req => {
    if (req.url().includes('/api/')) console.log("API REQ:", req.method(), req.url(), req.postData());
  });
  page.on('response', async res => {
    if (res.url().includes('/api/')) console.log("API RES:", res.status(), await res.text().catch(()=>""));
  });

  // fill form
  try {
    const inputs = await page.$$('input');
    await inputs[0].type('New Test Employee');
    await inputs[1].type('new_test');
    await inputs[2].type('password123');
    
    // click submit
    const modalBtns = await page.$$('form button');
    for (const b of modalBtns) {
      const text = await page.evaluate(el => el.innerText, b);
      if (text.includes('Add') || text.includes('Create') || text.includes('Submit')) {
        await b.click();
        break;
      }
    }
  } catch(e) { console.log("Form error", e); }
  
  await new Promise(r => setTimeout(r, 3000));
  const html = await page.evaluate(() => document.body.innerText);
  console.log("PAGE TEXT CONTAINS EMPLOYEE:", html.includes('New Test Employee'));
  await browser.close();
})();
