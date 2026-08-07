const axios = require('axios');
const token = "EAAY0VpLhNgIBRw0Y2ZBYbH0sQ8WZCIArrUYRt92tNPmmJ143AYt3I10F9buiwlEIUiIDihgRKruLA5chrxuQQhD13bVKh6ZAcGP5e32fmZAdm57YxUB9k8FaZBSyfiLRIIF4TdZAFbzYxXuRLcNSoWaSiaSufUFDw221dCGDyoGCvNbZCerqI4VMxqC3s6k909fiyJYnNpMMcgHhp5FT71T9LC9izTLEaqb";

async function getPageToken() {
    try {
        const accs = await axios.get(`https://graph.facebook.com/v19.0/me/accounts?access_token=${token}`);
        if(accs.data && accs.data.data && accs.data.data.length > 0) {
            const page = accs.data.data[0];
            const pageToken = page.access_token;
            const pageId = page.id;
            console.log("Page ID:", pageId);
            
            // Now get subscribed apps
            const apps = await axios.get(`https://graph.facebook.com/v19.0/${pageId}/subscribed_apps?access_token=${pageToken}`);
            console.log("Subscribed Apps:", JSON.stringify(apps.data, null, 2));
        } else {
            console.log("No pages found for this user.");
        }
    } catch (e) {
        console.error("Error:", e.response ? e.response.data : e.message);
    }
}
getPageToken();
