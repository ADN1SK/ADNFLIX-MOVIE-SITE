import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";

dotenv.config();

// Simple in-memory cache for TMDB proxy responses
const cache = new Map<string, { data: unknown; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes in milliseconds

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());
  app.use(cookieParser());

  // API Routes
  app.get("/api/health", (req, res) => {
    res.json({
      status: "ok",
      database: "not_applicable",
    });
  });

  // Proxy for auth and user routes to the backend
  app.use("/api/auth", async (req, res) => {
    const backendUrl = `http://localhost:5000${req.originalUrl}`;
    try {
      const response = await fetch(backendUrl, {
        method: req.method,
        headers: {
          "Content-Type": "application/json",
        },
        body: ["POST", "PUT"].includes(req.method)
          ? JSON.stringify(req.body)
          : undefined,
      });
      const data = await response.json();
      res.status(response.status).json(data);
    } catch {
      res.status(500).json({ error: "Failed to proxy to backend" });
    }
  });

  app.use("/api/user-movies", async (req, res) => {
    const backendUrl = `http://localhost:5000${req.originalUrl}`;
    try {
      const headers = new Headers();
      const authorization = req.headers.authorization;
      if (authorization) {
        headers.set("Authorization", authorization);
      }
      const contentType = req.headers["content-type"];
      if (contentType) {
        headers.set(
          "Content-Type",
          Array.isArray(contentType) ? contentType[0] : contentType,
        );
      }

      const hasBody = !["GET", "HEAD"].includes(req.method);
      const response = await fetch(backendUrl, {
        method: req.method,
        headers,
        body: hasBody ? JSON.stringify(req.body ?? {}) : undefined,
      });

      const text = await response.text();
      res.status(response.status);
      response.headers.forEach((value, key) => {
        if (
          !["content-length", "transfer-encoding"].includes(key.toLowerCase())
        ) {
          res.setHeader(key, value);
        }
      });
      res.send(text || undefined);
    } catch {
      res.status(500).json({ error: "Failed to proxy user-movies request" });
    }
  });

  // TMDB Proxy (to keep key on server)
  app.get("/api/movies/*", async (req, res) => {
    const cacheKey = req.url;
    const now = Date.now();

    // 1. Check if we have a valid cached response
    if (cache.has(cacheKey)) {
      const cached = cache.get(cacheKey)!;
      if (now - cached.timestamp < CACHE_TTL) {
        return res.json(cached.data);
      }
      cache.delete(cacheKey); // Remove expired entry
    }

    const tmdbUrl = `https://api.themoviedb.org/3${req.url.replace("/api/movies", "")}${req.url.includes("?") ? "&" : "?"}api_key=${process.env.TMDB_API_KEY || "d24d707ba3fb208316f0a0ec7589a90f"}`;
    try {
      const response = await fetch(tmdbUrl);
      const data = await response.json();

      // 2. Cache successful responses
      if (response.ok) {
        cache.set(cacheKey, { data, timestamp: now });
      }

      res.json(data);
    } catch {
      res.status(500).json({ error: "Failed to fetch from TMDB" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
