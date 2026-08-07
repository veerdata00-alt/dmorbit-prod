const axios = require('axios');
const appId = '1746396296328706';
const appSecret = '976f1dd407381d2ef79162db49aefd78';
const appToken = `${appId}|${appSecret}`;

const newUrl = 'https://conduit-compare-nanometer.ngrok-free.dev/webhook';
const verifyToken = 'dmorbit_verify_token_123';

async function subscribe() {
    try {
        console.log(`Subscribing instagram webhooks to ${newUrl}...`);
        const res = await axios.post(`https://graph.facebook.com/v19.0/${appId}/subscriptions`, null, {
            params: {
                object: 'instagram',
                callback_url: newUrl,
                verify_token: verifyToken,
                fields: 'messages,comments,messaging_postbacks',
                access_token: appToken
            }
        });
        console.log('Success:', res.data);
    } catch (e) {
        console.error('Error:', e.response ? e.response.data : e.message);
    }
}
subscribe();
