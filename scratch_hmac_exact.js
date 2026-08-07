const crypto = require('crypto');
const secret = '976f1dd407381d2ef79162db49aefd78';
const payload = '{"object":"instagram","entry":[{"time":1784201469429,"id":"17841421930215757","messaging":[{"timestamp":1784200184302,"read":{"mid":"aWdfZAG1faXRlbToxOklHTWVzc2FnZAUlEOjE3ODQxNDIxOTMwMjE1NzU3OjM0MDI4MjM2Njg0MTcxMDMwMTI0NDI3NjI3MDQyNzMzODYwMzc1NTozMjkxMjY4NTE1Mzk3MDQwMzA2MTE4ODU3Nzc3MDYwMjQ5NgZDZD"}}]}]}';
console.log('Computed HMAC:', crypto.createHmac('sha256', secret).update(payload).digest('hex'));
console.log('Received HMAC:', '7c0fd0212a2501b3209fff86c7287935793c115e0f1b4325e26500a8fe0e80df');
