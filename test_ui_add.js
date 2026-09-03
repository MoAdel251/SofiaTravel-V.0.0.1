import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', error => console.log('PAGE ERROR STACK:', error.stack));
  
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 2000));
  
  // click login
  try {
    await page.type('input[type="text"]', 'test');
    await page.type('input[type="password"]', 'test');
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
    if (text.includes('Add Employee')) {
      await b.click();
      break;
    }
  }
  await new Promise(r => setTimeout(r, 1000));
  
  // fill form
  try {
    const inputs = await page.$$('input');
    await inputs[0].type('New Test Employee');
    
    // click submit
    const modalBtns = await page.$$('form button');
    for (const b of modalBtns) {
      const text = await page.evaluate(el => el.innerText, b);
      if (text.includes('Add')) {
        await b.click();
        break;
      }
    }
  } catch(e) { console.log("Form error", e); }
  
  await new Promise(r => setTimeout(r, 2000));
  const html = await page.evaluate(() => document.body.innerText);
  console.log("PAGE TEXT:\n", html);
  await browser.close();
})();
