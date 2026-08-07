const jwt = require('jsonwebtoken');
const axios = require('axios');
require('dotenv').config();

async function testMe() {
    const token = jwt.sign({ 
        userId: '69f876394ca244ca3b09dfeb', 
        email: 'veerdata00@gmail.com', 
        name: 'Veer',
        role: 'user',
        firebaseId: 'test' 
    }, process.env.JWT_SECRET, { expiresIn: '7d' });

    console.log("Generated Token:", token);

    try {
        const res = await axios.get('http://localhost:3000/api/me', {
            headers: {
                'Cookie': `token=${token}`
            }
        });
        console.log("=== GET /api/me RESPONSE ===");
        console.log(JSON.stringify(res.data, null, 2));
    } catch (err) {
        console.error("Error fetching /api/me:", err.response ? err.response.data : err.message);
    }
}

testMe();
