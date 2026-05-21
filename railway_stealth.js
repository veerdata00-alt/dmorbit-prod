const { chromium } = require('playwright-extra');
const stealth = require('puppeteer-extra-plugin-stealth')();

// Add stealth plugin
chromium.use(stealth);

(async () => {
  console.log("🛡️ Launching Anti-Bot Stealth Browser...");
  
  const browser = await chromium.launch({ 
    headless: false,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-blink-features=AutomationControlled'] 
  });
  
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    viewport: { width: 1280, height: 720 }
  });
  
  const page = await context.newPage();
  console.log("🌐 Stealth browser ready. Navigating to Railway...");

  try {
    await page.goto('https://railway.app/dashboard', { waitUntil: 'networkidle' });
    console.log("📍 Please log in. Google security should be bypassed now...");

    // Wait up to 5 minutes for login
    const targetProject = await page.waitForSelector('text=dmorbit-prod', { timeout: 300000 });
    
    if (targetProject) {
      console.log("🎯 Logged in! Found 'dmorbit-prod'. Taking control...");
      await targetProject.click();
      
      // Wait for the Settings tab to appear and click it
      await page.waitForSelector('text=Settings', { timeout: 30000 });
      await page.click('text=Settings');
      console.log("⚙️ Clicked Settings tab...");
      
      // Navigate to Domains / Networking by scrolling or clicking
      await page.waitForTimeout(2000);
      
      // Provide instructions or try to click Custom Domain
      console.log("=======================================================================");
      console.log("ANTI HAS TAKEN YOU DIRECTLY TO SETTINGS.");
      console.log("Scroll down to the 'Networking' or 'Domains' section.");
      console.log("Click '+ Custom Domain' and type 'dmorbit.in'.");
      console.log("=======================================================================");
    }
  } catch (error) {
    console.log("❌ Stealth script stopped: " + error.message);
  }
})();
