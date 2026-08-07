import server from "./frontend/dist/server/server.js";
import { createServerAdapter } from "@whatwg-node/server";

const handler = createServerAdapter(server.fetch);

const req = {
  method: "GET",
  url: "/home",
  headers: {
    host: "localhost:3000"
  }
};

const res = {
  setHeader: () => {},
  end: (d) => {
    console.log("RESPONSE DATA:");
    console.log(d?.toString());
  }
};

handler(req, res).catch(console.error);
