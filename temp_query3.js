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
  
  let organicWebhook = null;
  logs.forEach(l => {
     let simplified = { _id: l._id, time: l._id.getTimestamp() };
     if (l.payload && l.payload.entry) {
        simplified.entry = l.payload.entry;
        l.payload.entry.forEach(e => {
            if (e.messaging) {
                e.messaging.forEach(m => {
                    if (m.message && m.message.text && m.sender.id !== '999999999') {
                        if (m.message.text.toLowerCase().trim() === 'pdf') {
                            if (!organicWebhook || l._id.getTimestamp() > organicWebhook.doc._id.getTimestamp()) {
                                organicWebhook = { doc: l, msg: m };
                            }
                        }
                    }
                });
            }
        });
     }
  });

  if (organicWebhook) {
      console.log('A. Webhooklog created:', 'YES');
      console.log('Webhook Timestamp:', organicWebhook.doc._id.getTimestamp());
      console.log('Payload:', organicWebhook.msg);
      
      const testTime = organicWebhook.doc._id.getTimestamp();
      const jobs = await db.collection('jobs').find({ automationId: '6a3bb2a6258e42283448146f' }).sort({ _id: -1 }).toArray();
      const job = jobs.find(j => {
          const t = j.createdAt ? new Date(j.createdAt) : j._id.getTimestamp();
          // Find a job strictly AFTER the webhook and NOT the 999999999 simulation
          return t >= testTime && j.user_id !== '999999999';
      });

      if (job) {
          console.log('B. Job document created:', 'YES');
          console.log('Job TS:', job.createdAt || job._id.getTimestamp());
          console.log('Job Result (F):', job.status, job.error);
      } else {
          console.log('B. Job document created:', 'NO');
          console.log('E. Block Condition:', 'Check logs if Job.create failed. Otherwise it exited before Job.create.');
      }
      
  } else {
      console.log('A. Webhooklog created: NO (Could not find organic "pdf" in latest 20 logs)');
      console.log('B. Job document created: N/A');
      console.log('C. Log document created: N/A');
  }

  process.exit(0);
});
