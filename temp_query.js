require('dotenv').config();
const mongoose = require('mongoose');

mongoose.connect(process.env.MONGO_URI)
.then(async () => {
  const db = mongoose.connection.db;
  
  console.log('--- 1. CAMPAIGN VERIFICATION ---');
  const campaign = await db.collection('automations').findOne({ _id: new mongoose.Types.ObjectId('6a3bb2a6258e42283448146f') });
  if (campaign) {
      console.log('isActive:', campaign.isActive);
      console.log('campaignType:', campaign.campaignType);
      console.log('keywords:', campaign.trigger ? campaign.trigger.keywords : []);
      console.log('createdAt:', campaign.createdAt);
  } else {
      console.log('Campaign not found.');
  }

  console.log('\n--- 2. LATEST 20 WEBHOOK LOGS ---');
  const logs = await db.collection('webhooklogs').find({ source: 'instagram' }).sort({ _id: -1 }).limit(20).toArray();
  
  let targetWebhook = null;
  logs.forEach(l => {
     let simplified = { _id: l._id, time: l._id.getTimestamp() };
     if (l.payload && l.payload.entry) {
        simplified.entry = l.payload.entry;
        
        // Search for 'pdf' in this webhook
        l.payload.entry.forEach(e => {
            if (e.messaging) {
                e.messaging.forEach(m => {
                    if (m.message && m.message.text && m.message.text.toLowerCase().trim() === 'pdf') {
                        if (!targetWebhook || l._id.getTimestamp() > targetWebhook.doc._id.getTimestamp()) {
                            targetWebhook = { doc: l, msg: m };
                        }
                    }
                });
            }
        });
     }
     console.log(JSON.stringify(simplified, null, 2));
  });

  console.log('\n--- 3. TEST TRACE (A, B, C, D) ---');
  if (targetWebhook) {
      console.log('A. Webhooklog created:', 'YES');
      console.log('Webhook Timestamp:', targetWebhook.doc._id.getTimestamp());
      console.log('Payload Details:', JSON.stringify(targetWebhook.msg, null, 2));

      // Check for Job
      const testTime = targetWebhook.doc._id.getTimestamp();
      const jobs = await db.collection('jobs').find({ 
          automationId: '6a3bb2a6258e42283448146f'
      }).sort({ _id: -1 }).toArray();

      const relatedJob = jobs.find(j => {
          const jTime = j.createdAt ? new Date(j.createdAt) : j._id.getTimestamp();
          return jTime.getTime() >= testTime.getTime();
      });

      if (relatedJob) {
          console.log('B. Job document created:', 'YES');
          console.log('Job Timestamp:', relatedJob.createdAt || relatedJob._id.getTimestamp());
          console.log('Job ID:', relatedJob._id);
          console.log('Job Status:', relatedJob.status);
          console.log('Worker Result (F):', relatedJob.status === 'failed' ? relatedJob : 'Done or Pending');
      } else {
          console.log('B. Job document created:', 'NO');
          
          // Let's check DMSessions around this time
          const sessions = await db.collection('dmsessions').find({
              automationId: '6a3bb2a6258e42283448146f',
          }).sort({ _id: -1 }).limit(1).toArray();
          
          if (sessions.length > 0) {
              console.log('C. DMSession / Log document created:', 'YES');
              console.log('DMSession Timestamp:', sessions[0]._id.getTimestamp());
          } else {
              console.log('C. DMSession / Log document created:', 'NO');
          }
      }
  } else {
      console.log('A. Webhooklog created:', 'NO (Could not find any organic webhook with text "pdf" in the latest 20 logs)');
      console.log('B. Job document created: N/A');
      console.log('C. Log document created: N/A');
  }

  process.exit(0);
});
