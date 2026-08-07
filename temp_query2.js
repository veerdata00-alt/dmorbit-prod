require('dotenv').config();
const mongoose = require('mongoose');

mongoose.connect(process.env.MONGO_URI)
.then(async () => {
  const db = mongoose.connection.db;
  
  const logs = await db.collection('webhooklogs').find({ source: 'instagram' }).sort({ _id: -1 }).limit(100).toArray();
  
  let targetWebhook = null;
  logs.forEach(l => {
     if (l.payload && l.payload.entry) {
        l.payload.entry.forEach(e => {
            if (e.messaging) {
                e.messaging.forEach(m => {
                    if (m.message && m.message.text && m.message.text.toLowerCase().trim() === 'pdf' && m.sender.id !== '999999999') {
                        if (!targetWebhook || l._id.getTimestamp() > targetWebhook.doc._id.getTimestamp()) {
                            targetWebhook = { doc: l, msg: m };
                        }
                    }
                });
            }
        });
     }
  });

  if (targetWebhook) {
      console.log('REAL WEBHOOK TIMESTAMP:', targetWebhook.doc._id.getTimestamp());
      console.log('REAL WEBHOOK PAYLOAD:', JSON.stringify(targetWebhook.msg, null, 2));
      
      const testTime = targetWebhook.doc._id.getTimestamp();
      const jobs = await db.collection('jobs').find({ 
          automationId: '6a3bb2a6258e42283448146f'
      }).sort({ _id: -1 }).toArray();

      const relatedJob = jobs.find(j => {
          const jTime = j.createdAt ? new Date(j.createdAt) : j._id.getTimestamp();
          return jTime.getTime() >= testTime.getTime() - 60000;
      });
      if (relatedJob) {
          console.log('B. Job document created:', 'YES');
          console.log('Job Worker Result:', relatedJob.status, relatedJob.error);
      } else {
          console.log('B. Job document created:', 'NO');
      }

  } else {
      console.log('NO REAL WEBHOOK FOUND WITH TEXT "pdf" in recent logs');
  }

  process.exit(0);
});
