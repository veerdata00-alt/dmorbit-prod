require('dotenv').config();
const https = require('https');

const appId = process.env.FB_APP_ID;
const appSecret = process.env.FB_APP_SECRET;
const accessToken = appId + '|' + appSecret;

function get(path) {
  return new Promise((resolve, reject) => {
    const url = `https://graph.facebook.com/v20.0${path}`;
    https.get(url, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => { try { resolve(JSON.parse(data)); } catch(e) { resolve(data); } });
    }).on('error', reject);
  });
}

async function main() {
  // 1. App Info
  const app = await get(`/${appId}?fields=name,app_type,development_mode,app_domains,contact_email,creator_uid&access_token=${accessToken}`);
  console.log('\n=== APP INFO ===');
  console.log(JSON.stringify(app, null, 2));

  // 2. Roles
  const roles = await get(`/${appId}/roles?access_token=${accessToken}`);
  console.log('\n=== APP ROLES ===');
  console.log(JSON.stringify(roles, null, 2));

  // 3. Test Users (Facebook's test user endpoint)
  const testUsers = await get(`/${appId}/accounts/test-users?access_token=${accessToken}`);
  console.log('\n=== TEST USERS ===');
  console.log(JSON.stringify(testUsers, null, 2));

  // 4. App Permissions / App Review Status
  const perms = await get(`/${appId}/permissions?access_token=${accessToken}`);
  console.log('\n=== PERMISSIONS ===');
  console.log(JSON.stringify(perms, null, 2));

  // 5. Webhook Subscriptions
  const subs = await get(`/${appId}/subscriptions?access_token=${accessToken}`);
  console.log('\n=== WEBHOOK SUBSCRIPTIONS ===');
  console.log(JSON.stringify(subs, null, 2));

  // 6. Subscribed Apps for the Instagram page
  const pageToken = process.env.PAGE_ACCESS_TOKEN;
  const pageId = '1116941344833058';
  const igId = '17841421930215757';
  
  // Check subscribed apps on the page
  if (pageToken) {
    const subscribedApps = await get(`/${pageId}/subscribed_apps?access_token=${pageToken}`);
    console.log('\n=== PAGE SUBSCRIBED APPS ===');
    console.log(JSON.stringify(subscribedApps, null, 2));
  } else {
    // Try with app access token  
    const pageInfo = await get(`/${pageId}?fields=name,connected_instagram_account,instagram_accounts&access_token=${accessToken}`);
    console.log('\n=== PAGE INFO ===');
    console.log(JSON.stringify(pageInfo, null, 2));
  }

  // 7. Check what Instagram Business accounts are linked to this app's page token
  const accounts = require('./models/InstagramAccount') || null;
}

main().catch(e => { console.error(e); process.exit(1); });
