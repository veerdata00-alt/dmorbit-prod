require('dotenv').config();
const mongoose = require('mongoose');

async function testDB() {
    await mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true });
    
    // We recreate the schema just to test
    const logSchema = new mongoose.Schema({}, { strict: false });
    const Log = mongoose.model('Log', logSchema);
    
    const logs = await Log.find().sort({ timestamp: -1 }).limit(5);
    console.log("RECENT LOGS:", logs);
    
    mongoose.disconnect();
}
testDB();
