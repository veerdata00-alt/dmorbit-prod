const mongoose = require('mongoose');
require('dotenv').config();

async function run() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const db = mongoose.connection.db;
        const User = mongoose.connection.collection('users');
        const user = await User.find({ email: 'veerdata00@gmail.com' }).toArray();
        console.log(JSON.stringify(user, null, 2));
    } catch(err) {
        console.error(err);
    } finally {
        await mongoose.disconnect();
    }
}
run();
