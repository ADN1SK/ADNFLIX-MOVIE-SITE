import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import proxy from "express-http-proxy";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  // 1. Proxy backend routes FIRST (before body-parsers)
  // This ensures multipart/form-data and other streams are forwarded correctly
  const backendUrl = "http://localhost:5000";
  // Added regex pattern to match /api/movies/:id/reviews and other nested paths
  const backendPaths = ["/api/auth", "/api/user-movies", "/api/history", "/api/reviews", "/api/movies/*/reviews", "/api/movies/*/credits", "/api/movies/*/recommendations", "/api/movies/*/videos"];
  
  backendPaths.forEach(path => {
    app.use(path, proxy(backendUrl, {
      parseReqBody: false, // REQUIRED for multipart/form-data
      proxyReqPathResolver: (req) => {
        // Skip proxying for avatar upload to test
        if (req.originalUrl === "/api/auth/upload-avatar") {
          console.log("[DEBUG] Skipping proxy for avatar upload");
          return "/api/auth/upload-avatar";
        }
        return req.originalUrl;
      },
      // Ensure all headers including Authorization are forwarded
      proxyReqOptDecorator: (proxyReqOpts, srcReq) => {
        // Remove 'content-type' from the original request headers
        // to let the proxy library set the correct multipart content-type with boundary
        delete proxyReqOpts.headers['content-type'];
        return proxyReqOpts;
      },
      userResDecorator: (proxyRes, proxyResData, userReq, userRes) => {
        // Log errors for debugging
        if (proxyRes.statusCode && proxyRes.statusCode >= 400) {
          console.error(`[BACKEND_ERROR] ${userReq.method} ${userReq.url} -> ${proxyRes.statusCode}`);
        }
        return proxyResData;
      },
      proxyErrorHandler: (err, res, next) => {
        console.error("[PROXY_CONNECTION_ERROR] Error:", err.message);
        console.error("[PROXY_CONNECTION_ERROR] Stack:", err.stack);
        res.status(502).json({ 
          error: "Failed to connect to backend", 
          message: "The backend server might be down or unreachable.",
          details: err.message
        });
      }
    }));
  });

  app.use(express.json());
  app.use(cookieParser());

  // API Health check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", database: "not_applicable" });
  });

  // TMDB Proxy (to keep key on server) - Keep this for general movie lookups
  app.get("/api/movies/*", async (req, res) => {
    const tmdbUrl = `https://api.themoviedb.org/3${req.url.replace("/api/movies", "")}${req.url.includes("?") ? "&" : "?"}api_key=${process.env.TMDB_API_KEY || "d24d707ba3fb208316f0a0ec7589a90f"}`;
    try {
      const response = await fetch(tmdbUrl);
      const data = await response.json();
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
