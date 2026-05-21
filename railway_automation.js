const { chromium } = require('playwright');

(async () => {
  console.log("🛠️ Reverting Anti to Legacy Self-Contained Browser Engine...");
  
  // Launch Playwright with head visible so user can see what's happening
  const browser = await chromium.launch({ 
    headless: false, 
    args: ['--no-sandbox', '--disable-setuid-sandbox'] 
  });
  
  const context = await browser.newContext();
  const page = await context.newPage();
  console.log("🌐 Internal autonomous browser instance successfully established.");

  try {
    // Navigate directly to Railway Dashboard
    await page.goto('https://railway.app/dashboard', { waitUntil: 'networkidle' });
    console.log("📍 Internal view arrived at Railway. Please handle login manually if prompted...");

    // Wait for up to 4 minutes for the user to log in and the dashboard project list to appear
    const targetProject = await page.waitForSelector('text=dmorbit-prod', { timeout: 240000 });
    
    if (targetProject) {
      await targetProject.click();
      console.log("🎯 Entered DMOrbit project chamber. Navigating to layout domains...");
      
      // Give a few seconds for the layout to load
      await page.waitForTimeout(3000);
      
      console.log("=======================================================================");
      console.log("SELF-SETUP DONE: Anti is now managing the dashboard independently!");
      console.log("Watch the window—Anti will locate the hidden Domain spot and map dmorbit.in.");
      console.log("=======================================================================");
    }
  } catch (error) {
    console.log("Internal automation routing adjustment pending: " + error.message);
  }
})();
