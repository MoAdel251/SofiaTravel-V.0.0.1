import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle2' });
  
  // Login
  try {
    const inputs = await page.$$('input');
    await inputs[0].type('IT');
    await inputs[1].type('1282');
    await page.click('button[type="submit"]');
  } catch(e) {}
  await new Promise(r => setTimeout(r, 2000));
  
  // Navigate and Add Customer via JS
  await page.evaluate(() => {
    const tabs = Array.from(document.querySelectorAll('nav button'));
    const customerTab = tabs.find(t => t.innerText.includes('Customers'));
    if (customerTab) customerTab.click();
  });
  await new Promise(r => setTimeout(r, 1000));
  
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const addBtn = btns.find(b => b.innerText.includes('Add Customer'));
    if (addBtn) addBtn.click();
  });
  await new Promise(r => setTimeout(r, 1000));
  
  await page.evaluate(() => {
    const inputs = document.querySelectorAll('input');
    // Fill the inputs that have names or place holders. We will just guess by index
    // Usually 0 is search.
    inputs[1].value = 'JavaScript Customer';
    inputs[1].dispatchEvent(new Event('input', { bubbles: true })); // trigger React onChange
    
    inputs[2].value = 'P9999999';
    inputs[2].dispatchEvent(new Event('input', { bubbles: true }));
    
    inputs[4].value = '01234567890';
    inputs[4].dispatchEvent(new Event('input', { bubbles: true }));
    
    const btns = Array.from(document.querySelectorAll('form button'));
    const saveBtn = btns.find(b => b.innerText.includes('Save Customer'));
    if (saveBtn) saveBtn.click();
  });
  
  await new Promise(r => setTimeout(r, 3000));
  const html = await page.evaluate(() => document.body.innerText);
  console.log("PAGE TEXT CONTAINS CUSTOMER:", html.includes('JavaScript Customer'));
  await browser.close();
})();
