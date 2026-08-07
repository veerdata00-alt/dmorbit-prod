const mongoose = require('mongoose');
require('dotenv').config();
mongoose.connect(process.env.MONGO_URI).then(async () => {
    const id = new mongoose.Types.ObjectId('6a58be41175304ca1144b37f');
    await mongoose.connection.db.collection('automations').updateOne(
        { _id: id },
        { 
            $set: { 
                privateMessageText: 'Here is your DM from the Comment automation test.', 
                replyText: 'Comment received!', 
                triggerType: 'ANY_COMMENT', 
                mode: 'any_comment',
                isActive: true,
                status: 'active'
            },
            $unset: { '`$set': 1 }
        }
    );
    console.log('Fixed DB successfully');
    process.exit();
});
