require('dotenv').config();
const mongoose = require('mongoose');
const https = require('https');

mongoose.connect(process.env.MONGO_URI)
.then(async () => {
  const db = mongoose.connection.db;

  // 1. Identify Send ID
  console.log('--- 1 & 2. INSTAGRAM SENDER IDENTITY ---');
  const pdfWebhooks = await db.collection('webhooklogs').find({
      'payload.entry.messaging.message.text': { $regex: /pdf/i }
  }).sort({ _id: -1 }).limit(10).toArray();

  const senders = {};
  pdfWebhooks.forEach(w => {
      w.payload.entry.forEach(e => {
          if(e.messaging) {
              e.messaging.forEach(m => {
                  if (m.message && m.message.text && m.message.text.toLowerCase() === 'pdf') {
                      senders[m.sender.id] = (senders[m.sender.id] || 0) + 1;
                  }
              });
          }
      });
  });
  console.log('Unique Sender IDs for "pdf":', senders);

  // Let's resolve the username
  for (const senderId of Object.keys(senders)) {
      if (senderId === '999999999') continue; // Simulated

      // Check leads
      const lead = await db.collection('leads').findOne({ instagramId: senderId });
      let username = lead ? lead.username : 'Unknown (Not in leads)';
      
      if (username.includes('Unknown')) {
          // Check comments
          const comment = await db.collection('webhooklogs').findOne({
              'payload.entry.changes.value.from.id': senderId
          });
          if (comment && comment.payload.entry[0].changes[0].value.from.username) {
              username = comment.payload.entry[0].changes[0].value.from.username;
          } else {
              // Check DM user info job if exists
              const job = await db.collection('jobs').findOne({ user_id: senderId });
              if (job && job.username) {
                  username = job.username;
              }
          }
      }
      console.log(`Sender ${senderId}: Username => ${username}`);
  }

  // 3. Webhooks from this sender in last 24h
  console.log('\n--- 3 & 4. WEBHOOKS FROM SENDER IN LAST 24H ---');
  const targetSender = '1873352703324260'; // We found this was the sender from 09:30 UTC
  const targetSender2 = '1666373194407721'; // The other common sender
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
  
  const recentLogs = await db.collection('webhooklogs').find({
      _id: { $gt: mongoose.Types.ObjectId.createFromTime(Math.floor(yesterday.getTime()/1000)) },
      $or: [
          {'payload.entry.messaging.sender.id': { $in: [targetSender, targetSender2] }},
          {'payload.entry.changes.value.from.id': { $in: [targetSender, targetSender2] }}
      ]
  }).sort({ _id: -1 }).toArray();

  console.log(`Found organic webhooks for target senders in the last 24h:`);
  recentLogs.forEach(l => {
      l.payload.entry.forEach(e => {
          if (e.messaging) {
              e.messaging.forEach(m => {
                  if (m.sender && (m.sender.id === targetSender || m.sender.id === targetSender2)) {
                      console.log(`[${l._id.getTimestamp()}] DM from ${m.sender.id}: ${m.message ? m.message.text : (m.postback ? 'POSTBACK: '+m.postback.payload : 'OTHER')}`);
                  }
              });
          }
          if (e.changes) {
              e.changes.forEach(c => {
                  if (c.value && c.value.from && (c.value.from.id === targetSender || c.value.from.id === targetSender2)) {
                      console.log(`[${l._id.getTimestamp()}] COMMENT from ${c.value.from.id}: ${c.value.text}`);
                  }
              });
          }
      });
  });

  // Query Meta API for App Roles
  console.log('\n--- 5. APP ROLES FROM META ---');
  const appId = process.env.FB_APP_ID;
  const appSecret = process.env.FB_APP_SECRET;
  const accessToken = appId + '|' + appSecret;
  const url = 'https://graph.facebook.com/v20.0/' + appId + '/roles?access_token=' + accessToken;

  https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
          console.log(JSON.stringify(JSON.parse(data), null, 2));
          process.exit(0);
      });
  }).on('error', e => {
      console.error(e);
      process.exit(1);
  });

});
