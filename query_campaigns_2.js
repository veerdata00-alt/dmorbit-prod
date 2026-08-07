const mongoose = require('mongoose');

async function run() {
    try {
        await mongoose.connect('mongodb://127.0.0.1:27017/dmorbit_db');
        const db = mongoose.connection.collection('automations');
        const campaigns = await db.find({}).toArray();
        console.log(JSON.stringify(campaigns.map(c => ({
            id: c._id,
            name: c.name,
            campaignType: c.campaignType,
            templateType: c.templateType,
            triggerType: c.triggerType
        })), null, 2));
    } catch(err) {
        console.error(err);
    } finally {
        await mongoose.disconnect();
        process.exit(0);
    }
}
run();
