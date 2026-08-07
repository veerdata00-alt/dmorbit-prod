const express = require('express');
const crypto = require('crypto');
const app = express();
const port = 4000;

const APP_SECRET = '976f1dd407381d2ef79162db49aefd78';
const VERIFY_TOKEN = 'temp_verify_token_123';

app.use(express.json({
    verify: (req, res, buf) => {
        req.rawBody = buf;
    }
}));

app.get('/temp-webhook', (req, res) => {
    if (req.query['hub.mode'] === 'subscribe' && req.query['hub.verify_token'] === VERIFY_TOKEN) {
        console.log('Webhook verified');
        res.status(200).send(req.query['hub.challenge']);
    } else {
        res.sendStatus(403);
    }
});

app.post('/temp-webhook', (req, res) => {
    console.log('--- NEW EVENT RECEIVED ---');
    
    const signatureHeader = req.headers['x-hub-signature-256'];
    console.log('x-hub-signature-256:', signatureHeader);
    
    const expectedHash = crypto
        .createHmac('sha256', APP_SECRET)
        .update(req.rawBody)
        .digest('hex');
    
    console.log('HMAC computed with current App Secret: sha256=' + expectedHash);
    
    console.log('Raw request body string:');
    console.log(req.rawBody.toString('utf8'));
    console.log('Raw length:', req.rawBody.length);
    console.log('--------------------------');
    
    res.status(200).send('EVENT_RECEIVED');
});

app.listen(port, () => {
    console.log(`Temp webhook server listening at http://localhost:${port}`);
});
