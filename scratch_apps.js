const axios = require('axios');
const token = "EAAY0VpLhNgIBRfNb5ZBouZBymXRUKXZCfWMZCw2Tza8rWqF6boZBsFgCeTlYEe2XMWlCiq4pD2hROYQLefiJmQWyDjGCKZBZB0UbChfQZCljYrXgyqqU4mXHE67co16IyZBFavPim67uAZAg069gBRwRzhHFz28B7xYasZBkxNNUIBZCpoi0senIqJnYhbxBtOcbrL3hDFhywgZDZD";
async function getApps() {
    try {
        const me = await axios.get(`https://graph.facebook.com/v19.0/me?access_token=${token}`);
        const pageId = me.data.id;
        console.log("Page ID:", pageId);

        const apps = await axios.get(`https://graph.facebook.com/v19.0/${pageId}/subscribed_apps?access_token=${token}`);
        console.log("Subscribed Apps:", JSON.stringify(apps.data, null, 2));
    } catch (e) {
        console.error("Error:", e.response ? e.response.data : e.message);
    }
}
getApps();
