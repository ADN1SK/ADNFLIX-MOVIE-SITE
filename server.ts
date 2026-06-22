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
  const backendUrl = "http://localhost:5000";

  // 1. Proxy backend routes FIRST
  // Catching all /api paths at once handles routing dynamically and cleanly
  app.use("/api", proxy(backendUrl, {
    parseReqBody: false, // REQUIRED for multipart/form-data (avatar uploads)
    
    proxyReqPathResolver: (req) => {
      // Passes the exact full URL (e.g., /api/auth/login) straight to the backend
      return req.originalUrl;
    },
    
    proxyReqOptDecorator: (proxyReqOpts, srcReq) => {
      // ONLY strip content-type for the avatar upload to let the form-data boundary auto-generate.
      // This leaves application/json intact for your login requests!
      if (srcReq.originalUrl === "/api/auth/upload-avatar") {
        if (proxyReqOpts.headers) {
          delete proxyReqOpts.headers['content-type'];
        }
      }
      return proxyReqOpts;
    },
    
    userResDecorator: (proxyRes, proxyResData, userReq, userRes) => {
      if (proxyRes.statusCode && proxyRes.statusCode >= 400) {
        console.error(`[BACKEND_ERROR] ${userReq.method} ${userReq.originalUrl} -> ${proxyRes.statusCode}`);
      }
      return proxyResData;
    },
    
    proxyErrorHandler: (err, res, next) => {
      console.error("[PROXY_CONNECTION_ERROR] Error:", err.message);
      res.status(502).json({ 
        error: "Failed to connect to backend", 
        message: "The backend server might be down or unreachable.",
        details: err.message
      });
    }
  }));

  // 2. Global Parsers (Only applies to routes that don't match the proxy above)
  app.use(express.json());
  app.use(cookieParser());

  // API Health check (Fallback if backend doesn't handle it)
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", database: "not_applicable" });
  });

  // TMDB Proxy (To keep key hidden on the server side)
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

  // 3. Vite Frontend Middleware
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