var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// server.ts
var import_express = __toESM(require("express"), 1);
var import_path = __toESM(require("path"), 1);
var import_vite = require("vite");
var app = (0, import_express.default)();
var PORT = 3e3;
app.use(import_express.default.json());
var cloudflareStats = {
  totalRequests: 0,
  blockedRequests: 0,
  bypassedRequests: 0,
  lastBlockedTimestamp: null,
  activeCountermeasures: {
    headerRotation: true,
    mirrorBridge: true,
    emulateChrome120: true,
    autoFallback: true
  }
};
app.get("/api/cloudflare-stats", (_req, res) => {
  res.json({
    ...cloudflareStats,
    shieldStatus: cloudflareStats.blockedRequests > 0 ? "Active Shield Intercepted" : "Idle"
  });
});
app.post("/api/cloudflare-countermeasures", (req, res) => {
  if (req.body && typeof req.body === "object") {
    cloudflareStats.activeCountermeasures = {
      ...cloudflareStats.activeCountermeasures,
      ...req.body
    };
  }
  res.json({ success: true, activeCountermeasures: cloudflareStats.activeCountermeasures });
});
app.post("/api/cloudflare-countermeasures/reset", (_req, res) => {
  cloudflareStats.totalRequests = 0;
  cloudflareStats.blockedRequests = 0;
  cloudflareStats.bypassedRequests = 0;
  cloudflareStats.lastBlockedTimestamp = null;
  res.json({ success: true });
});
app.get("/api/proxy", async (req, res) => {
  const targetUrl = req.query.url;
  if (!targetUrl) {
    return res.status(400).send("Missing target url parameter");
  }
  cloudflareStats.totalRequests++;
  const chromeEmulationHeaders = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
    "Accept-Language": "en-US,en;q=0.9",
    "Accept-Encoding": "gzip, deflate, br",
    "Sec-Ch-Ua": '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
    "Sec-Ch-Ua-Mobile": "?0",
    "Sec-Ch-Ua-Platform": '"Windows"',
    "Sec-Fetch-Dest": "document",
    "Sec-Fetch-Mode": "navigate",
    "Sec-Fetch-Site": "none",
    "Sec-Fetch-User": "?1",
    "Upgrade-Insecure-Requests": "1",
    "Cache-Control": "max-age=0"
  };
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 1e4);
    const directResponse = await fetch(targetUrl, {
      headers: chromeEmulationHeaders,
      signal: controller.signal
    });
    clearTimeout(timeout);
    const directBodyText = await directResponse.text();
    const isCloudflareChallenge = directResponse.status === 403 || directResponse.status === 503 || directBodyText.includes("cf-mitigated") || directBodyText.includes("Just a moment...") || directBodyText.includes("Attention Required! | Cloudflare");
    if (!isCloudflareChallenge && directResponse.ok) {
      res.setHeader("Content-Type", "text/html; charset=utf-8");
      return res.send(directBodyText);
    }
    cloudflareStats.blockedRequests++;
    cloudflareStats.lastBlockedTimestamp = (/* @__PURE__ */ new Date()).toISOString();
    if (cloudflareStats.activeCountermeasures.mirrorBridge) {
      const mirrorUrls = [
        `https://api.allorigins.win/raw?url=${encodeURIComponent(targetUrl)}`,
        `https://corsproxy.io/?${encodeURIComponent(targetUrl)}`
      ];
      for (const mirrorUrl of mirrorUrls) {
        try {
          const mirrorController = new AbortController();
          const mirrorTimeout = setTimeout(() => mirrorController.abort(), 8e3);
          const mirrorRes = await fetch(mirrorUrl, {
            headers: { "User-Agent": chromeEmulationHeaders["User-Agent"] },
            signal: mirrorController.signal
          });
          clearTimeout(mirrorTimeout);
          if (mirrorRes.ok) {
            const mirrorHtml = await mirrorRes.text();
            if (mirrorHtml.length > 300 && !mirrorHtml.includes("cf-mitigated") && !mirrorHtml.includes("Just a moment...")) {
              cloudflareStats.bypassedRequests++;
              res.setHeader("X-Cloudflare-Bypassed", "true");
              res.setHeader("Content-Type", "text/html; charset=utf-8");
              return res.send(mirrorHtml);
            }
          }
        } catch (mErr) {
        }
      }
    }
    res.setHeader("X-Cloudflare-Shield", "intercepted");
    return res.status(403).send(directBodyText || "Cloudflare Anti-Bot Shield Intercepted Request");
  } catch (err) {
    console.error("Proxy error for:", targetUrl, err.message);
    res.setHeader("X-Cloudflare-Shield", "error");
    return res.status(500).send(`Failed to proxy request: ${err.message}`);
  }
});
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", app: "FreeWebNovel Reader" });
});
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await (0, import_vite.createServer)({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = import_path.default.join(process.cwd(), "dist");
    app.use(import_express.default.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(import_path.default.join(distPath, "index.html"));
    });
  }
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`FreeWebNovel Reader Server running on http://0.0.0.0:${PORT}`);
  });
}
startServer();
//# sourceMappingURL=server.cjs.map
