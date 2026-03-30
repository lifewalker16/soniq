import ytdlp from "yt-dlp-exec";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);
const searchCache = new Map();
const urlCache = new Map(); // cache the raw yt-dlp URL (expires fast, just for dedup)

// ── Search ────────────────────────────────────────────────────────────────────
export const search = async (req, res) => {
  const query = req.query.q;
  if (searchCache.has(query)) return res.json(searchCache.get(query));

  try {
    const result = await ytdlp(`ytsearch3:${query}`, {
      dumpSingleJson: true,
      noWarnings: true,
    });
    const clean = result.entries.map((video) => ({
      id: video.id,
      title: video.title,
      url: video.webpage_url,
      duration: video.duration,
      thumbnail: video.thumbnail,
      uploader: video.uploader,
    }));
    searchCache.set(query, clean);
    return res.json(clean);
  } catch (err) {
    return res.status(500).json({ error: "Failed to find song" });
  }
};

// ── Get audio URL (kept for any internal use) ─────────────────────────────────
const getRawAudioUrl = async (url) => {
  if (urlCache.has(url)) return urlCache.get(url);
  const info = await ytdlp(url, {
    dumpSingleJson: true,
    noWarnings: true,
    format: "bestaudio",
  });
  // YouTube signed URLs expire in ~6 hours — don't cache too long
  urlCache.set(url, info.url);
  setTimeout(() => urlCache.delete(url), 5 * 60 * 60 * 1000); // 5h TTL
  return info.url;
};

// ── Proxy stream — this is the key fix for CORS ───────────────────────────────
// Instead of returning the raw googlevideo URL to the browser, we pipe it
// through Express. The browser only ever talks to localhost:3000, which has
// no CORS restrictions, so createMediaElementSource() works fine.
export const stream = async (req, res) => {
  const url = req.query.url;
  if (!url) return res.status(400).json({ error: "url param required" });

  try {
    const audioUrl = await getRawAudioUrl(url);

    // Fetch the YouTube CDN stream server-side and pipe it to the client
    const response = await fetch(audioUrl, {
      headers: {
        // Forward range header if the browser sent one (enables seeking)
        ...(req.headers.range ? { Range: req.headers.range } : {}),
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
          "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
    });

    if (!response.ok && response.status !== 206) {
      return res.status(response.status).json({ error: "Upstream fetch failed" });
    }

    // Mirror status & relevant headers so the browser can seek
    res.status(response.status);
    const forward = [
      "content-type",
      "content-length",
      "content-range",
      "accept-ranges",
    ];
    forward.forEach((h) => {
      const v = response.headers.get(h);
      if (v) res.setHeader(h, v);
    });

    // Ensure the browser sees this as same-origin (CORS solved by proxy)
    res.setHeader("Access-Control-Allow-Origin", "*");

    // Pipe the upstream body straight to the client
    const reader = response.body.getReader();
    const pump = async () => {
      while (true) {
        const { done, value } = await reader.read();
        if (done) { res.end(); break; }
        // If client disconnected, stop pumping
        if (res.destroyed) { reader.cancel(); break; }
        res.write(Buffer.from(value));
      }
    };
    await pump();
  } catch (err) {
    console.error("Stream error:", err.message);
    if (!res.headersSent) {
      res.status(500).json({ error: "Failed to stream song" });
    }
  }
};  