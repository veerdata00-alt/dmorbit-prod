require('dotenv').config();
const https = require('https');
const fs = require('fs');

const appId = process.env.FB_APP_ID;
const appSecret = process.env.FB_APP_SECRET;
const accessToken = `${appId}|${appSecret}`;

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
  const data = {};

  console.log('Fetching app info...');
  data.appInfo = await get(`/${appId}?fields=name,app_type,category,supported_platforms,roles,permissions&access_token=${accessToken}`);
  
  console.log('Fetching permissions...');
  data.permissions = await get(`/${appId}/permissions?access_token=${accessToken}`);
  
  console.log('Fetching webhooks...');
  data.webhooks = await get(`/${appId}/subscriptions?access_token=${accessToken}`);

  console.log('Fetching features...');
  data.features = await get(`/${appId}/features?access_token=${accessToken}`);

  console.log('Fetching products...');
  data.products = await get(`/${appId}/products?access_token=${accessToken}`);

  fs.writeFileSync('meta_raw_data.json', JSON.stringify(data, null, 2));
  console.log('Data saved to meta_raw_data.json');
}

main().catch(console.error);
