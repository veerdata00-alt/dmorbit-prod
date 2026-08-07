import server from "./frontend/dist/server/server.js";
import { createServerAdapter } from "@whatwg-node/server";

const handler = createServerAdapter(server.fetch);

const req = {
  method: "GET",
  url: "/home",
  headers: {
    host: "localhost:3000"
  },
  protocol: "http",
  originalUrl: "/home"
};

const res = {
  setHeader: () => {},
  end: (d) => {
    console.log("RES:", d?.toString()?.substring(0, 100));
  }
};

handler(req, res).catch(console.error);
