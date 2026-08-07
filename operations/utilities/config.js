require('dotenv').config({ path: '../../.env' }); // Adjusted for utilities folder depth

module.exports = {
    // Meta Config
    APP_SECRET: (process.env.FB_APP_SECRET || process.env.APP_SECRET || '').trim(),
    DEFAULT_PAGE_ID: '17841421930215757', // DMOrbit page
    DEFAULT_SENDER_ID: '1666373194407721', // Test user sending the message

    // Endpoints
    LOCAL_WEBHOOK_URL: 'http://localhost:3000/webhook',
    PROD_WEBHOOK_URL: 'https://dmorbit.in/webhook'
};
