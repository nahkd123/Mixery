/**
 * Service worker. This worker provides offline experience.
 */
console.log("[sw] Hello world!");
let sw = globalThis;
sw.addEventListener("install", e => {
    e.waitUntil(cacheFiles("/app", "/app/index.html", "/css/index.css", "/bin/app/index.js", "/assets/icon.svg"));
});
sw.addEventListener("activate", e => {
    console.log("[sw] Activated. Claiming clients");
    e.waitUntil(sw.clients.claim());
});
const CACHE_NAME = "mixery-cache";
async function cacheFile(path) {
    await sw.caches.open(CACHE_NAME).then(cache => {
        cache.add(path);
    });
}
async function cacheFiles(...path) {
    await sw.caches.open(CACHE_NAME).then(cache => {
        cache.addAll(path);
    });
}
async function getFromCache(req) {
    let res = await caches.match(req);
    if (res)
        return res;
    let externRes = await fetch(req);
    if (!externRes || externRes.status !== 200 || externRes.type !== "basic")
        return externRes;
    let cacheRes = externRes.clone();
    caches.open(CACHE_NAME).then(cache => {
        cache.put(req, cacheRes);
    });
    return externRes;
}
sw.addEventListener("fetch", e => {
    e.respondWith(getFromCache(e.request));
});
