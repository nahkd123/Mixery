import * as fs from "fs";
import * as http from "http";
import * as https from "https";
import * as path from "path";
import * as _mime from "mime-types";
import { MixeryLiveServer } from "../live/server/index.js";
const mime = _mime.default;
var Prefixes;
(function (Prefixes) {
    Prefixes.WARN = "\x1b[93m[WARN] \x1b[0m";
    Prefixes.LOG = "\x1b[96m[LOG ] \x1b[0m";
    Prefixes.ERR = "\x1b[96m[ERR ] \x1b[0m";
})(Prefixes || (Prefixes = {}));
const CONFIG = JSON.parse(fs.readFileSync("config.serverside.json", "utf-8"));
const ARGS = process.argv.splice(2);
ARGS.forEach(arg => {
    if (arg === "--daw")
        CONFIG.daw.enable = true;
    else if (arg === "--nodaw")
        CONFIG.daw.enable = false;
    else if (arg === "--live")
        CONFIG.live.enable = true;
    else if (arg === "--nolive")
        CONFIG.live.enable = false;
    else if (arg.startsWith("--port="))
        CONFIG.general.port = parseInt(arg.substr(7));
});
const PORT = process.env["PORT"] || CONFIG.general.port || 8080;
const CACHE = new Map();
function smashClientWithError(err, res) {
    console.error(err);
    res.statusCode = 500;
    res.end("500 OOF");
}
function resolveResource(p, res) {
    p = p.toLowerCase();
    if ((p === "app" || p === "app/index.html") && !CONFIG.daw.enable) {
        res.statusCode = 423;
        res.end("423 The server does not allow you to use Mixery DAW. To continue, please visit nahkd123.github.io/Mixery/app");
        return;
    }
    if (CACHE.has(p)) {
        res.statusCode = 200;
        res.end(CACHE.get(p));
    }
    else
        fs.stat(p, (err, stats) => {
            if (err == null) {
                if (stats.isDirectory())
                    resolveResource(path.join(p, "index.html"), res);
                else
                    fs.readFile(p, (err, data) => {
                        if (err == null) {
                            res.statusCode = 200;
                            res.setHeader("Content-Type", mime.contentType(p) || "application/octet-stream");
                            res.end(data);
                            if (CONFIG.daw.cacheResources)
                                CACHE.set(p, data);
                        }
                        else {
                            smashClientWithError(err, res);
                            process.stderr.write(Prefixes.ERR + "Cannot stats " + p + ". See error above\n");
                            return;
                        }
                    });
            }
            else if (err.code === "ENOENT") {
                res.statusCode = 404;
                res.end("404 Nope!");
                return;
            }
            else {
                smashClientWithError(err, res);
                process.stderr.write(Prefixes.ERR + "Cannot stats " + p + ". See error above\n");
                return;
            }
        });
}
let listener = (req, res) => {
    const SERVER_PATH = path.join("./", req.url);
    if (SERVER_PATH.startsWith(".." + path.sep)) {
        res.statusCode = 403;
        res.end("403 Totally forbidden lol");
        return;
    }
    resolveResource(SERVER_PATH, res);
};
let server;
if (CONFIG.https.enable) {
    server = https.createServer({
        key: CONFIG.https.key,
        cert: CONFIG.https.cert
    }, listener);
}
else
    server = http.createServer(listener);
let live;
if (CONFIG.live.enable) {
    live = new MixeryLiveServer(server, CONFIG.live.logins);
    process.stdout.write(Prefixes.LOG + "Mixery Live created.\n");
}
server.listen(PORT, () => {
    if (!CONFIG.https.enable)
        process.stdout.write(Prefixes.WARN + "You're using HTTP (not HTTPS). Some features like MIDI devices access or WebRTC will not work, unless you connect to server using localhost IP address.\n");
    process.stdout.write(Prefixes.LOG + "Mixery DAW availablity: " + CONFIG.daw.enable + "\n");
    process.stdout.write(Prefixes.LOG + "Mixery Live availablity: " + CONFIG.live.enable + "\n");
});