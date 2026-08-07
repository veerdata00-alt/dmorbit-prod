import express from 'express';
import server from "./frontend/dist/server/server.js";
import { createServerAdapter } from "@whatwg-node/server";

const app = express();
import path from 'path';
import { fileURLToPath } from 'url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
app.use(express.static(path.join(__dirname, 'frontend/dist/client')));

const ssrHandler = createServerAdapter(server.fetch);

app.get('*', (req, res, next) => {
    if (ssrHandler) {
        return ssrHandler(req, res, next);
    }
    next();
});

app.use((err, req, res, next) => {
    res.status(500).json({ error: err.message });
});

app.listen(3002, () => {
    console.log("Test Express server on 3002");
});
