import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import mongoose from "mongoose";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
        console.warn("MONGODB_URI not found in environment. Database features will be limited.");
        return;
      }
      await mongoose.connect(uri);
      dbConnected = true;
      console.log("Connected to MongoDB established successfully.");
    } catch (err) {
      console.error("MongoDB connection error:", err);
    }
  };

  // API Routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", database: dbConnected ? "connected" : "disconnected" });
  });

  // TMDB Proxy (to keep key on server)
  app.get("/api/movies/*", async (req, res) => {
    const tmdbUrl = `https://api.themoviedb.org/3${req.url.replace("/api/movies", "")}${req.url.includes("?") ? "&" : "?"}api_key=${process.env.TMDB_API_KEY || "d24d707ba3fb208316f0a0ec7589a90f"}`;
    try {
      const response = await fetch(tmdbUrl);
      const data = await response.json();
      res.json(data);
    } catch (error) {
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
    connectDB(); // Attempt initial connection
  });
}

startServer();
