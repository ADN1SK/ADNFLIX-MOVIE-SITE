import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import mongoose from "mongoose";
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

  // MongoDB Connection (Lazy)
  let dbConnected = false;
  const connectDB = async () => {
    if (dbConnected) return;
    try {
      const uri = process.env.MONGODB_URI;
      if (!uri) {
        console.error("❌ ERROR: MONGODB_URI is missing from your .env file.");
        return;
      }
      await mongoose.connect(uri);
      dbConnected = true;
      console.log("✅ Connected to MongoDB established successfully.");
    } catch (err) {
      console.error(
        "❌ MongoDB connection error. Check your network or credentials:",
        err,
      );
    }
  };

  // API Proxy to standalone backend (port 5000)
  app.all("/api/*", async (req, res) => {
    const backendUrl = `http://localhost:5000${req.url}`;
    
    try {
      const response = await fetch(backendUrl, {
        method: req.method,
        headers: {
          "Content-Type": "application/json",
          ...(req.headers.authorization ? { "Authorization": req.headers.authorization } : {}),
        },
        body: ["POST", "PUT", "PATCH"].includes(req.method) ? JSON.stringify(req.body) : undefined,
      });

      const data = await response.json();
      res.status(response.status).json(data);
    } catch (error) {
      console.error("Backend proxy error:", error);
      res.status(500).json({ error: "Failed to connect to backend", details: (error as Error).message });
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
    connectDB(); // Attempt initial connection
  });
}

startServer();
