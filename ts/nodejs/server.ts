import * as fs from "fs";
import * as http from "http";
import * as https from "https";
import * as path from "path";
import * as _mime from "mime-types";
import { MixeryLiveServer } from "../live/server/index.js";

// @ts-ignore
const mime = _mime.default;

type HTTPServer = http.Server | https.Server;
namespace Prefixes {
    export const WARN = "\x1b[93m[WARN] \x1b[0m";
    export const LOG  = "\x1b[96m[LOG ] \x1b[0m";
    export const ERR  = "\x1b[96m[ERR ] \x1b[0m";
}

const CONFIG: {
    general: {port: number}
    https: {enable: boolean, key: string, cert: string},
    daw: {enable: boolean, cacheResources: boolean},
    live: {enable: boolean, logins: {username: string, password: string}[]}
} = JSON.parse(fs.readFileSync("config.serverside.json", "utf-8"));

const ARGS = process.argv.splice(2);
ARGS.forEach(arg => {
    if (arg === "--daw") CONFIG.daw.enable = true;
    else if (arg === "--nodaw") CONFIG.daw.enable = false;
    else if (arg === "--live") CONFIG.live.enable = true;
    else if (arg === "--nolive") CONFIG.live.enable = false;
    else if (arg.startsWith("--port=")) CONFIG.general.port = parseInt(arg.substr(7));
});

const PORT = process.env["PORT"] || CONFIG.general.port || 8080;
const CACHE = new Map<string, Buffer>();

function smashClientWithError(err: NodeJS.ErrnoException, res: http.ServerResponse) {
    console.error(err);
    res.statusCode = 500;
    res.end("500 OOF");
}
function resolveResource(p: string, res: http.ServerResponse) {
    p = p.toLowerCase();
    if ((p === "app" || p === "app/index.html") && !CONFIG.daw.enable) {
        res.statusCode = 423;
        res.end("423 The server does not allow you to use Mixery DAW. To continue, please visit nahkd123.github.io/Mixery/app");
        return;
    }

    if (CACHE.has(p)) {
        res.statusCode = 200;
        res.end(CACHE.get(p));
    } else fs.stat(p, (err, stats) => {
        if (err == null) {
            if (stats.isDirectory()) resolveResource(path.join(p, "index.html"), res);
            else fs.readFile(p, (err, data) => {
                if (err == null) {
                    res.statusCode = 200;
                    res.setHeader("Content-Type", mime.contentType(p) || "application/octet-stream");
                    res.end(data);

                    if (CONFIG.daw.cacheResources) CACHE.set(p, data);
                } else {
                    smashClientWithError(err, res);
                    process.stderr.write(Prefixes.ERR + "Cannot stats " + p + ". See error above\n");
                    return;
                }
            });
        } else if (err.code === "ENOENT") {
            res.statusCode = 404;
            res.end("404 Nope!");
            return;
        } else {
            smashClientWithError(err, res);
            process.stderr.write(Prefixes.ERR + "Cannot stats " + p + ". See error above\n");
            return;
        }
    });
}

let listener: http.RequestListener = (req, res) => {
    //process.stdout.write(Prefixes.LOG + `\x1b[1;36m${req.socket.remoteAddress} \x1b[0;90m(\x1b[97m${req.method}\x1b[90m) => \x1b[4;93m${req.url}` + "\x1b[0m\n");
    
    const SERVER_PATH = path.join("./", req.url);
    if (SERVER_PATH.startsWith(".." + path.sep)) {
        // We can't share parent directory contents to client.
        res.statusCode = 403;
        res.end("403 Totally forbidden lol");
        return;
    }
    
    resolveResource(SERVER_PATH, res);
};

let server: HTTPServer;
if (CONFIG.https.enable) {
    server = https.createServer({
        key: CONFIG.https.key,
        cert: CONFIG.https.cert
    }, listener);
} else server = http.createServer(listener);

let live: MixeryLiveServer;
if (CONFIG.live.enable) {
    live = new MixeryLiveServer(server, CONFIG.live.logins);
    process.stdout.write(Prefixes.LOG + "Mixery Live created.\n");
}

server.listen(PORT, () => {
    if (!CONFIG.https.enable) process.stdout.write(Prefixes.WARN + "You're using HTTP (not HTTPS). Some features like MIDI devices access or WebRTC will not work, unless you connect to server using localhost IP address.\n");
    process.stdout.write(Prefixes.LOG + "Mixery DAW availablity: " + CONFIG.daw.enable + "\n");
    process.stdout.write(Prefixes.LOG + "Mixery Live availablity: " + CONFIG.live.enable + "\n");
});