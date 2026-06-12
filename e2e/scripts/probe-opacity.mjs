// Throwaway diagnostic: find which ancestor of the ritual chips carries
// opacity < 1. Run with the stack on :4200/:5100.
import { chromium } from '@playwright/test';

const run = async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' });
  const page = await context.newPage();
  await page.addInitScript(() => {
    try {
      window.localStorage.setItem('sh.testMode', '1');
      window.__shTestNow = new Date().toISOString().slice(0, 10) + 'T08:00:00';
    } catch {}
  });
  await page.goto('http://localhost:4200/sign-in');
  await page.fill("[formControlName='email']", 'quinntynebrown@gmail.com');
  await page.fill("[formControlName='password']", 'password123');
  await page.click('button:has-text("Sign in")');
  await page.waitForURL('**/today');
  await page.goto('http://localhost:4200/today/ritual');
  await page.waitForSelector('[data-testid="sh-ritual-step-checkin"]');
  const chain = await page.evaluate(() => {
    let el = document.querySelector('sh-rating-chips .chip');
    const out = [];
    while (el) {
      const cs = getComputedStyle(el);
      out.push(`${el.tagName}.${el.className?.toString?.().slice(0, 40)} opacity=${cs.opacity} color=${cs.color} anim=${cs.animationName}`);
      el = el.parentElement;
    }
    return out;
  });
  console.log(chain.join('\n'));
  await browser.close();
};
run();
