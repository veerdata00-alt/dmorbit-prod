const mongoose = require('mongoose');
require('dotenv').config();

async function audit() {
    console.log("=== DB AUDIT START ===");
    const uri = process.env.MONGO_URI;
    console.log("MONGODB_URI:", uri);
    
    await mongoose.connect(uri);
    console.log("Connected to MongoDB.");
    
    const dbName = mongoose.connection.db.databaseName;
    console.log("Database Name:", dbName);
    
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log("Collections:", collections.map(c => c.name));
    
    const User = mongoose.connection.db.collection('users');
    const totalUsers = await User.countDocuments();
    console.log("Total Users Count:", totalUsers);
    
    const targetUsers = await User.find({ email: /veerdata00@gmail.com/i }).toArray();
    console.log("\nUsers matching 'veerdata00@gmail.com':", targetUsers.length);
    targetUsers.forEach(u => {
        console.log(`- _id: ${u._id}`);
        console.log(`  email: ${u.email}`);
        console.log(`  createdAt: ${u.createdAt || u.created_at || 'unknown'}`);
        console.log(`  role: ${u.role}`);
        console.log(`  instagramConnected: ${u.instagramConnected}`);
        console.log(`  instagramAccountId: ${u.instagramAccountId}`);
        console.log(`  subscription status: ${u.subscription?.status || 'none'}`);
    });
    
    console.log("\n=== INSTAGRAM AUDIT START ===");
    const igUsers = await User.find({ instagramConnected: true }).toArray();
    console.log("Users with instagramConnected = true:", igUsers.length);
    igUsers.forEach(u => {
        console.log(`- _id: ${u._id}`);
        console.log(`  email: ${u.email}`);
        console.log(`  instagramAccountId: ${u.instagramAccountId}`);
    });
    
    await mongoose.disconnect();
    console.log("=== AUDIT END ===");
}

audit().catch(err => {
    console.error(err);
    process.exit(1);
});
