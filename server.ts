import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";

const app = express();
const PORT = 3000;

app.use(express.json());

// In-memory Cloudflare Protection / Shield Stats & Countermeasures
const cloudflareStats = {
  totalRequests: 0,
  blockedRequests: 0,
  bypassedRequests: 0,
  lastBlockedTimestamp: null as string | null,
  activeCountermeasures: {
    headerRotation: true,
    mirrorBridge: true,
    emulateChrome120: true,
    autoFallback: true,
  },
};

// Cloudflare Stats API Endpoint
app.get("/api/cloudflare-stats", (_req, res) => {
  res.json({
    ...cloudflareStats,
    shieldStatus: cloudflareStats.blockedRequests > 0 ? "Active Shield Intercepted" : "Idle",
  });
});

// Cloudflare Countermeasures Config Endpoint
app.post("/api/cloudflare-countermeasures", (req, res) => {
  if (req.body && typeof req.body === "object") {
    cloudflareStats.activeCountermeasures = {
      ...cloudflareStats.activeCountermeasures,
      ...req.body,
    };
  }
  res.json({ success: true, activeCountermeasures: cloudflareStats.activeCountermeasures });
});

// Reset Cloudflare Counters Endpoint
app.post("/api/cloudflare-countermeasures/reset", (_req, res) => {
  cloudflareStats.totalRequests = 0;
  cloudflareStats.blockedRequests = 0;
  cloudflareStats.bypassedRequests = 0;
  cloudflareStats.lastBlockedTimestamp = null;
  res.json({ success: true });
});

// Proxy route for fetching HTML with Cloudflare Anti-Bot Countermeasures
app.get("/api/proxy", async (req, res) => {
  const targetUrl = req.query.url as string;
  if (!targetUrl) {
    return res.status(400).send("Missing target url parameter");
  }

  cloudflareStats.totalRequests++;

  const chromeEmulationHeaders = {
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    Accept:
      "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
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
    "Cache-Control": "max-age=0",
  };

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    const directResponse = await fetch(targetUrl, {
      headers: chromeEmulationHeaders,
      signal: controller.signal,
    });

    clearTimeout(timeout);

    const directBodyText = await directResponse.text();
    const isCloudflareChallenge =
      directResponse.status === 403 ||
      directResponse.status === 503 ||
      directBodyText.includes("cf-mitigated") ||
      directBodyText.includes("Just a moment...") ||
      directBodyText.includes("Attention Required! | Cloudflare");

    if (!isCloudflareChallenge && directResponse.ok) {
      res.setHeader("Content-Type", "text/html; charset=utf-8");
      return res.send(directBodyText);
    }

    // Cloudflare Anti-Bot Shield Intercepted!
    cloudflareStats.blockedRequests++;
    cloudflareStats.lastBlockedTimestamp = new Date().toISOString();

    // Try Countermeasure: Proxy Mirror Bridge Fallback
    if (cloudflareStats.activeCountermeasures.mirrorBridge) {
      const mirrorUrls = [
        `https://api.allorigins.win/raw?url=${encodeURIComponent(targetUrl)}`,
        `https://corsproxy.io/?${encodeURIComponent(targetUrl)}`,
      ];

      for (const mirrorUrl of mirrorUrls) {
        try {
          const mirrorController = new AbortController();
          const mirrorTimeout = setTimeout(() => mirrorController.abort(), 8000);

          const mirrorRes = await fetch(mirrorUrl, {
            headers: { "User-Agent": chromeEmulationHeaders["User-Agent"] },
            signal: mirrorController.signal,
          });

          clearTimeout(mirrorTimeout);

          if (mirrorRes.ok) {
            const mirrorHtml = await mirrorRes.text();
            if (
              mirrorHtml.length > 300 &&
              !mirrorHtml.includes("cf-mitigated") &&
              !mirrorHtml.includes("Just a moment...")
            ) {
              cloudflareStats.bypassedRequests++;
              res.setHeader("X-Cloudflare-Bypassed", "true");
              res.setHeader("Content-Type", "text/html; charset=utf-8");
              return res.send(mirrorHtml);
            }
          }
        } catch (mErr) {
          // Continue to next mirror or fallback
        }
      }
    }

    // If all countermeasures are blocked by Cloudflare Shield, return 403 with indicator header
    res.setHeader("X-Cloudflare-Shield", "intercepted");
    return res.status(403).send(directBodyText || "Cloudflare Anti-Bot Shield Intercepted Request");
  } catch (err: any) {
    console.error("Proxy error for:", targetUrl, err.message);
    res.setHeader("X-Cloudflare-Shield", "error");
    return res.status(500).send(`Failed to proxy request: ${err.message}`);
  }
});

// Health endpoint
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", app: "FreeWebNovel Reader" });
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`FreeWebNovel Reader Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
