const { chromium } = require('playwright');

(async () => {
  console.log("🛠️ Launching with the User's Default Chrome Profile...");
  
  // The path to the standard Windows Chrome user profile for this machine
  const userDataDir = 'C:\\Users\\BBC IT HUB\\AppData\\Local\\Google\\Chrome\\User Data';
  
  try {
    // We use launchPersistentContext to keep all cookies and login sessions intact
    const context = await chromium.launchPersistentContext(userDataDir, {
      headless: false,
      channel: 'chrome', // Force using the real installed Google Chrome instead of Chromium
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    // Check if there are any pages open, or create a new one
    const pages = context.pages();
    const page = pages.length > 0 ? pages[0] : await context.newPage();
    
    console.log("🌐 Successfully connected using your main Chrome profile! All logins should be active.");
    
    await page.goto('https://railway.app/dashboard', { waitUntil: 'domcontentloaded' });
    console.log("📍 Arrived at Railway Dashboard...");

    // Wait for the project assuming the user is already logged in
    const targetProject = await page.waitForSelector('text=dmorbit-prod', { timeout: 15000 });
    
    if (targetProject) {
      await targetProject.click();
      console.log("🎯 Found DMOrbit! Entering project settings...");
      
      await page.waitForTimeout(3000);
      
      console.log("=======================================================================");
      console.log("✅ Anti has reached the destination using your logged-in profile.");
      console.log("=======================================================================");
    } else {
        console.log("Could not find the 'dmorbit-prod' text. Are we fully logged in?");
    }
  } catch (error) {
    console.error("❌ Automation Failed to Start.");
    console.error("REASON: Your Chrome browser is currently open in the background.");
    console.error("ACTION: Please completely close all Chrome windows, then tell Anti to retry.");
    console.error(error.message);
  }
})();
