const crypto = require('crypto');
const axios = require('axios');
const config = require('../utilities/config');

function generateSignature(payload) {
    return 'sha256=' + crypto.createHmac('sha256', config.APP_SECRET).update(payload).digest('hex');
}

async function sendWebhook(payloadObj, target = 'local') {
    const payloadStr = JSON.stringify(payloadObj);
    const signature = generateSignature(payloadStr);
    
    const url = target === 'prod' ? config.PROD_WEBHOOK_URL : config.LOCAL_WEBHOOK_URL;

    try {
        console.log(`🚀 Sending mock webhook to ${url}...`);
        const response = await axios.post(url, payloadStr, {
            headers: {
                'Content-Type': 'application/json',
                'X-Hub-Signature-256': signature
            }
        });
        console.log('✅ Success! Server responded with:', response.status);
    } catch (error) {
        console.error('❌ Error sending webhook:');
        if (error.response) {
            console.error(`Status: ${error.response.status}`);
            console.error(`Data:`, error.response.data);
        } else {
            console.error(error.message);
        }
    }
}

function getPayload(type, keyword) {
    const timestamp = Date.now();
    switch (type) {
        case 'dm':
            return {
                "object": "instagram",
                "entry": [
                    {
                        "id": config.DEFAULT_PAGE_ID,
                        "time": Math.floor(timestamp / 1000),
                        "messaging": [
                            {
                                "sender": { "id": config.DEFAULT_SENDER_ID },
                                "recipient": { "id": config.DEFAULT_PAGE_ID },
                                "timestamp": timestamp,
                                "message": {
                                    "mid": `mid.${timestamp}`,
                                    "text": keyword
                                }
                            }
                        ]
                    }
                ]
            };
        case 'comment':
            return {
                "object": "instagram",
                "entry": [
                    {
                        "id": config.DEFAULT_PAGE_ID,
                        "time": Math.floor(timestamp / 1000),
                        "changes": [
                            {
                                "value": {
                                    "from": { "id": config.DEFAULT_SENDER_ID, "username": "test_user" },
                                    "media": { "id": "18068030105710679", "media_product_type": "REEL" },
                                    "id": `comment_id_${timestamp}`,
                                    "text": keyword
                                },
                                "field": "comments"
                            }
                        ]
                    }
                ]
            };
        default:
            throw new Error('Unknown webhook type');
    }
}

module.exports = {
    sendWebhook,
    getPayload
};
