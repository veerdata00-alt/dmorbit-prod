const crypto = require('crypto');
const secret = '976f1dd407381d2ef79162db49aefd78';
const payload = '{"entry":[{"id":"17841421930215757","time":1778494689,"changes":[{"value":{"from":{"id":"1666373194407721","username":"veerchopra809"},"media":{"id":"18114683101754675","media_product_type":"REELS"},"id":"17880990537428645","text":"Link"},"field":"comments"}]}],"object":"instagram"}';
const expectedHash = crypto.createHmac('sha256', secret).update(payload).digest('hex');
console.log('Computed:', expectedHash);
console.log('Expected:', '5af66973eb2b05c4155e149981125643bf8d6ae618f9a0bf98d1e833b8b7ae21');
