import server from "./frontend/dist/server/server.js";
const req = new Request("http://localhost/home");
server.fetch(req, {}, {}).then(async res => {
    console.log("Status:", res.status);
    console.log("Body:", await res.text());
}).catch(console.error);
