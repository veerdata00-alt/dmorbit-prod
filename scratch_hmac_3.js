const crypto = require('crypto');
const secret = '976f1dd407381d2ef79162db49aefd78';
const payload = '{"object":"instagram","entry":[{"time":1784201825393,"id":"17841421930215757","messaging":[{"timestamp":1784201823243,"read":{"mid":"aWdfZAG1faXRlbToxOklHTWVzc2FnZAUlEOjE3ODQxNDIxOTMwMjE1NzU3OjM0MDI4MjM2Njg0MTcxMDMwMTI0NDI3NjI3MDQyNzMzODYwMzc1NTozMjkxMjcxNDM5ODc2MjU4NzI2NDE5NTA2NTUxNTM0Mzg3MgZDZD"}}]}]}';
console.log('Computed HMAC:', crypto.createHmac('sha256', secret).update(payload).digest('hex'));
console.log('Expected HMAC:', '9c0e52385777dc1499661b973b354473cbe5e3be9984122e850345a9144b1420');
