const jwt = require('jsonwebtoken');
const axios = require('axios');
require('dotenv').config();

async function testStats() {
    const token = jwt.sign({ 
        userId: '69f876394ca244ca3b09dfeb', 
        email: 'veerdata00@gmail.com', 
        name: 'Veer',
        role: 'user'
    }, process.env.JWT_SECRET, { expiresIn: '7d' });

    try {
        const res = await axios.get('http://localhost:3000/api/dashboard/stats', {
            headers: {
                'Cookie': `token=${token}`
            }
        });
        console.log("=== GET /api/dashboard/stats RESPONSE ===");
        console.log(JSON.stringify(res.data, null, 2));
    } catch (err) {
        console.error("Error fetching stats:", err.response ? err.response.data : err.message);
    }
}

testStats();
