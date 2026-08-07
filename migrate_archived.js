const mongoose = require('mongoose');
require('dotenv').config();

async function migrate() {
    try {
        console.log("Connecting to MongoDB...");
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected successfully. Running migration...");

        const db = mongoose.connection.db;
        const result = await db.collection('automations').updateMany(
            { status: 'archived' },
            { 
                $set: { 
                    status: 'deleted', 
                    deletedAt: new Date() 
                } 
            }
        );

        console.log(`Migration complete!`);
        console.log(`Matched: ${result.matchedCount}`);
        console.log(`Modified: ${result.modifiedCount}`);
        
    } catch (err) {
        console.error("Migration failed:", err);
    } finally {
        await mongoose.disconnect();
        console.log("Disconnected from MongoDB.");
    }
}

migrate();
