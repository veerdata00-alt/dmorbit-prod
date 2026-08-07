const mongoose = require('mongoose');
require('dotenv').config();

async function run() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const db = mongoose.connection.collection('automations');
        const campaigns = await db.find({}).toArray();
        console.log(JSON.stringify(campaigns.map(c => ({
            id: c._id,
            name: c.name,
            campaignType: c.campaignType,
            templateType: c.templateType,
            triggerType: c.triggerType,
            trigger: c.trigger
        })), null, 2));
    } catch(err) {
        console.error(err);
    } finally {
        await mongoose.disconnect();
        process.exit(0);
    }
}
run();
