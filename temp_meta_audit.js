require('dotenv').config();
const https = require('https');
const mongoose = require('mongoose');

const appId = process.env.FB_APP_ID;
const appSecret = process.env.FB_APP_SECRET;
const accessToken = appId + '|' + appSecret;

function get(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => { try { resolve(JSON.parse(data)); } catch(e) { resolve(data); } });
    }).on('error', reject);
  });
}

async function main() {
  // 1. App Mode / Status
  console.log('\n=== 1. META APP MODE & STATUS ===');
  const appInfo = await get(`https://graph.facebook.com/v20.0/${appId}?fields=name,category,status,development_app,app_domains&access_token=${accessToken}`);
  console.log(JSON.stringify(appInfo, null, 2));

  // 2. App Permissions / Advanced Access
  console.log('\n=== 2. PERMISSIONS ===');
  const perms = await get(`https://graph.facebook.com/v20.0/${appId}/permissions?access_token=${accessToken}`);
  console.log(JSON.stringify(perms, null, 2));

  // 3. Webhook Subscriptions
  console.log('\n=== 3. WEBHOOK SUBSCRIPTIONS ===');
  const subs = await get(`https://graph.facebook.com/v20.0/${appId}/subscriptions?access_token=${accessToken}`);
  console.log(JSON.stringify(subs, null, 2));

  // 4. App Roles
  console.log('\n=== 4. APP ROLES (Admins / Devs / Testers) ===');
  const roles = await get(`https://graph.facebook.com/v20.0/${appId}/roles?access_token=${accessToken}`);
  console.log(JSON.stringify(roles, null, 2));

  // 5. Accounts
  console.log('\n=== 5. INSTAGRAM ACCOUNTS IN DB ===');
  await mongoose.connect(process.env.MONGO_URI);
  const db = mongoose.connection.db;
  const accounts = await db.collection('instagramaccounts').find({ userId: '69f876394ca244ca3b09dfeb' }).toArray();
  accounts.forEach(a => {
    console.log({
      username: a.username,
      instagram_id: a.instagram_id,
      fbPageId: a.fbPageId,
      access_token_preview: a.access_token ? a.access_token.substring(0, 30) + '...' : 'MISSING',
      token_expires: a.token_expires_at || 'UNKNOWN'
    });
  });

  // 6. Check latest page access token for permissions
  if (accounts.length > 0 && accounts[0].access_token) {
    const pageToken = accounts[0].access_token;
    console.log('\n=== 6. PAGE TOKEN PERMISSIONS ===');
    const tokenInfo = await get(`https://graph.facebook.com/v20.0/debug_token?input_token=${pageToken}&access_token=${accessToken}`);
    console.log(JSON.stringify(tokenInfo, null, 2));
  }

  // 7. Event Flow: check last 24h for each feature
  console.log('\n=== 7. EVENT FLOW EVIDENCE (Last 24h) ===');
  const yesterday = new Date(Date.now() - 24*60*60*1000);
  const yesterdayObjId = mongoose.Types.ObjectId.createFromTime(Math.floor(yesterday.getTime()/1000));

  const logs = await db.collection('webhooklogs').find({
    _id: { $gt: yesterdayObjId },
    source: 'instagram'
  }).sort({ _id: -1 }).toArray();

  let dmEvents = 0, commentEvents = 0, storyReplyEvents = 0;
  logs.forEach(l => {
    if (!l.payload || !l.payload.entry) return;
    l.payload.entry.forEach(e => {
      if (e.messaging) {
        e.messaging.forEach(m => {
          if (m.message && !m.message.is_echo) {
            if (m.message.reply_to && m.message.reply_to.story) storyReplyEvents++;
            else dmEvents++;
          }
        });
      }
      if (e.changes) {
        e.changes.forEach(c => {
          if (c.field === 'comments') commentEvents++;
        });
      }
    });
  });

  const jobs = await db.collection('jobs').find({ _id: { $gt: yesterdayObjId } }).toArray();
  const dmKwJobs = jobs.filter(j => j.message === 'DM Keyword Delivery');
  const commentJobs = jobs.filter(j => j.type === 'send_comment_dm' || j.type === 'reply_comment');
  const storyJobs = jobs.filter(j => j.message && j.message.includes('Story'));

  console.log('\n--- DM KEYWORD ---');
  console.log('Webhook events (DM text):', dmEvents);
  console.log('Jobs created:', dmKwJobs.length);
  console.log('Jobs passed:', dmKwJobs.filter(j => j.status === 'completed' || j.status === 'sent').length);
  console.log('Jobs failed:', dmKwJobs.filter(j => j.status === 'failed').length);

  console.log('\n--- COMMENT TO DM ---');
  console.log('Webhook events (comments):', commentEvents);
  console.log('Jobs created:', commentJobs.length);

  console.log('\n--- STORY REPLY ---');
  console.log('Webhook events (story reply):', storyReplyEvents);
  console.log('Jobs created:', storyJobs.length);

  process.exit(0);
}

main().catch(e => { console.error(e); process.exit(1); });
