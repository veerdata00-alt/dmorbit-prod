import server from "./frontend/dist/server/server.js";
import { createServerAdapter } from "@whatwg-node/server";
import http from "http";

const handler = createServerAdapter(server.fetch);

const srv = http.createServer((req, res) => {
  handler(req, res).catch(console.error);
});

srv.listen(3001, () => {
  console.log("Listening on 3001");
});
