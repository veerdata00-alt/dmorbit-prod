const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const automationSchema = new mongoose.Schema({
    userId: String, name: String, status: String, isActive: Boolean, 
    triggerCount: Number, capturePageViews: Number,
    createdAt: Date
}, { strict: false });

const jobSchema = new mongoose.Schema({
    automationId: String, status: String, type: String, createdAt: Date
}, { strict: false });

const dmSessionSchema = new mongoose.Schema({
    automationId: String, isCompleted: Boolean, lastTriggeredAt: Date
}, { strict: false });

const leadSchema = new mongoose.Schema({
    automationId: String, campaignId: String, createdAt: Date
}, { strict: false });

async function verify() {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/dmorbit');
    const Automation = mongoose.model('Automation', automationSchema);
    const Job = mongoose.model('Job', jobSchema);
    const DMSession = mongoose.model('DMSession', dmSessionSchema);
    const Lead = mongoose.model('Lead', leadSchema);

    const campaign = await Automation.findOne().sort({ createdAt: -1 });
    if (!campaign) return console.log("No campaign found");
    const id = campaign._id.toString();

    console.log("--- Campaign Details ---");
    console.log("ID:", id);
    console.log("Status:", campaign.status, "isActive:", campaign.isActive);
    
    console.log("\n--- Verified Metrics ---");
    console.log("Triggers Processed (triggerCount):", campaign.triggerCount || 0);
    const completedFlows = await DMSession.countDocuments({ automationId: id, isCompleted: true });
    console.log("Completed DM Flows:", completedFlows);
    console.log("Capture Page Views:", campaign.capturePageViews || 0);
    const leads = await Lead.countDocuments({ $or: [{ automationId: id }, { campaignId: id }] });
    console.log("Leads Captured:", leads);
    const dmsDelivered = await Job.countDocuments({ automationId: id, status: 'done', type: 'send_dm' });
    console.log("DMs Delivered:", dmsDelivered);
    const dmsFailed = await Job.countDocuments({ automationId: id, status: 'failed', type: 'send_dm' });
    console.log("Failed DMs:", dmsFailed);
    const pendingJobs = await Job.countDocuments({ automationId: id, status: 'pending' });
    console.log("Pending Jobs:", pendingJobs);
    
    console.log("\n--- Activity Timeline ---");
    const lastSession = await DMSession.findOne({ automationId: id }).sort({ lastTriggeredAt: -1 });
    console.log("Last Trigger:", lastSession ? lastSession.lastTriggeredAt : null);
    const lastDm = await Job.findOne({ automationId: id, status: 'done', type: 'send_dm' }).sort({ createdAt: -1 });
    console.log("Last DM Sent:", lastDm ? lastDm.createdAt : null);

    process.exit(0);
}
verify();
