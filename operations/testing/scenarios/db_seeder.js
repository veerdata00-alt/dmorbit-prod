require('dotenv').config({ path: '../../../.env' });
const mongoose = require('mongoose');

// Mongoose Models
const Automation = mongoose.model('Automation', new mongoose.Schema({ userId: String, status: String }, { strict: false }));
const Lead = mongoose.model('Lead', new mongoose.Schema({ userId: String }, { strict: false }));
const DMSession = mongoose.model('DMSession', new mongoose.Schema({ userId: String }, { strict: false }));
const Job = mongoose.model('Job', new mongoose.Schema({ userId: String }, { strict: false }));
const WebhookLog = mongoose.model('WebhookLog', new mongoose.Schema({ userId: String }, { strict: false }));

async function resetDbState(userId) {
    if (!userId) {
        console.error('❌ Error: userId is required to reset DB state.');
        return false;
    }

    try {
        console.log(`🔌 Connecting to MongoDB...`);
        await mongoose.connect(process.env.MONGO_URI);
        
        console.log(`🧹 Wiping state for user: ${userId}`);

        const authRes = await Automation.deleteMany({ userId });
        console.log(`  - Deleted ${authRes.deletedCount} Automations`);

        const leadRes = await Lead.deleteMany({ userId });
        console.log(`  - Deleted ${leadRes.deletedCount} Leads`);

        const sessRes = await DMSession.deleteMany({ ownerId: userId }); // Notice DMSession uses ownerId
        console.log(`  - Deleted ${sessRes.deletedCount} DMSessions`);

        const jobRes = await Job.deleteMany({ ownerId: userId });
        console.log(`  - Deleted ${jobRes.deletedCount} Jobs`);

        const logRes = await WebhookLog.deleteMany({}); // Wiping all logs for a clean run
        console.log(`  - Deleted ${logRes.deletedCount} WebhookLogs`);

        console.log('✅ Database state successfully reset for App Review Scenario!');
        return true;
    } catch (err) {
        console.error('❌ DB Reset Failed:', err);
        return false;
    } finally {
        await mongoose.disconnect();
    }
}

module.exports = { resetDbState };

// Allow executing directly via CLI
if (require.main === module) {
    const userId = process.argv[2];
    if (!userId) {
        console.log('Usage: node db_seeder.js <userId>');
        process.exit(1);
    }
    resetDbState(userId).then(success => process.exit(success ? 0 : 1));
}
