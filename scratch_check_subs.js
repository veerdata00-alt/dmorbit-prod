const axios = require('axios');
const appId = "1746396296328706";
const appSecret = "976f1dd407381d2ef79162db49aefd78";
const appToken = `${appId}|${appSecret}`;

async function getAppWebhooks() {
    try {
        const webhooks = await axios.get(`https://graph.facebook.com/v19.0/${appId}/subscriptions?access_token=${appToken}`);
        console.log(JSON.stringify(webhooks.data, null, 2));
    } catch (e) {
        console.error("Error:", e.response ? e.response.data : e.message);
    }
}
getAppWebhooks();
