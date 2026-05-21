const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
require('dotenv').config();

mongoose.connect(process.env.MONGO_URI || 'mongodb+srv://veerdata:Siddharth%402005@cluster0.b5z2e.mongodb.net/dmorbit?retryWrites=true&w=majority&appName=Cluster0')
.then(async () => {
    // We can just sign a token with a mock user id for testing
    const token = jwt.sign({ userId: '6738982aeb14c8106967e918' }, process.env.JWT_SECRET || 'dmorbit_secret_key_2026_super_secure', { expiresIn: '1h' });
    console.log("TOKEN:", token);
    process.exit(0);
})
.catch(err => {
    console.log(err);
    process.exit(1);
});
