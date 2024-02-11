import { config } from "./config";

import http from "http";
import https from "https";
import fs from "fs";

import { app, dbSync } from "./app";
import { models } from "./models"
import { SocketService } from "./services/socket";
import { PromiseLib } from "./utils/promise";

const { server: serverConfig, domainName } = config;

const { promise: serverSync, ...sub } = PromiseLib.Create()
let server: http.Server | https.Server;
dbSync.then(() => {
  if (serverConfig.protocol == "http://") {
    server = http.createServer(app);
  } else {
    const options = {
      key: fs.readFileSync("../../../etc/letsencrypt/live/" + domainName + "/privkey.pem"),
      cert: fs.readFileSync("../../../etc/letsencrypt/live/" + domainName + "/fullchain.pem"),
    };
    server = https.createServer(options, app);
  }
  server.listen(serverConfig.port, function () {
    sub.resolve(server)
    console.log("Express server listening on port " + serverConfig.port);
  });
  SocketService.Init(server, models)
});
export default serverSync