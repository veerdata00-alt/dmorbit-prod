require('dotenv').config();
const mongoose = require('mongoose');

async function main() {
  await mongoose.connect(process.env.MONGO_URI);
  const db = mongoose.connection.db;
  const yesterday = new Date(Date.now() - 24*60*60*1000);
  const yesterdayObjId = mongoose.Types.ObjectId.createFromTime(Math.floor(yesterday.getTime()/1000));

  // All failed jobs in last 24h
  const jobs = await db.collection('jobs').find({ _id: { $gt: yesterdayObjId } }).sort({ _id: -1 }).toArray();
  console.log('=== ALL JOBS LAST 24H ===');
  jobs.forEach(j => {
    console.log(`[${j._id.getTimestamp()}] ID: ${j._id} | Type: ${j.type} | Status: ${j.status} | Target: ${j.user_id} | Error: ${j.error || 'none'}`);
  });

  // Check campaign job match - what campaigns were matched
  const dmJobs = jobs.filter(j => j.message === 'DM Keyword Delivery');
  console.log('\n=== DM KEYWORD JOBS DETAIL ===');
  dmJobs.forEach(j => {
    console.log(JSON.stringify({
      _id: j._id,
      status: j.status,
      user_id: j.user_id,
      automationId: j.automationId,
      kw: j.metadata ? j.metadata.kw : null,
      error: j.error
    }, null, 2));
  });

  // Check the matched webhooks around those job times
  console.log('\n=== CORRESPONDING WEBHOOKS ===');
  for (const job of dmJobs) {
    const jobTime = job._id.getTimestamp();
    const startObjId = mongoose.Types.ObjectId.createFromTime(Math.floor(jobTime.getTime()/1000) - 5);
    const endObjId = mongoose.Types.ObjectId.createFromTime(Math.floor(jobTime.getTime()/1000) + 5);
    const hooks = await db.collection('webhooklogs').find({
      _id: { $gt: startObjId, $lt: endObjId }
    }).toArray();
    hooks.forEach(h => {
      h.payload.entry.forEach(e => {
        if (e.messaging) {
          e.messaging.forEach(m => {
            if (m.message && !m.message.is_echo) {
              console.log(`[${h._id.getTimestamp()}] Sender: ${m.sender.id} | Text: ${m.message.text}`);
            }
          });
        }
      });
    });
  }

  // Sessions for the DM_KEYWORD campaign
  console.log('\n=== DMSESSIONS FOR DM_KEYWORD CAMPAIGN ===');
  const sessions = await db.collection('dmsessions').find({
    automationId: '6a3bb2a6258e42283448146f'
  }).sort({ _id: -1 }).toArray();
  sessions.forEach(s => {
    console.log(JSON.stringify({
      _id: s._id,
      targetId: s.targetId,
      currentStep: s.currentStep,
      isCompleted: s.isCompleted,
      lastTriggeredAt: s.lastTriggeredAt
    }, null, 2));
  });

  process.exit(0);
}

main().catch(e => { console.error(e); process.exit(1); });
