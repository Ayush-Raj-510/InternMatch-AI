import "dotenv/config";
import express from "express";
import cors from "cors";
import { handleDemo } from "./routes/demo";
import { handleAI } from "./routes/ai";
import { handleGuidance } from "./routes/guidance";
import { handleRecommend } from "./routes/recommend";
import { handleInitDb } from "./routes/initDb";
import { initDb } from "./db";

export function createServer() {
  const app = express();

  // Middleware
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Example API routes
  app.get("/api/ping", (_req, res) => {
    const ping = process.env.PING_MESSAGE ?? "ping";
    res.json({ message: ping });
  });

  app.get("/api/demo", handleDemo);
  app.post("/api/ai-chat", handleAI);
  app.post("/api/guidance", handleGuidance);
  app.post("/api/recommend", handleRecommend);
  app.post("/api/db/init", handleInitDb);
  // Internships management: dynamic import so server can start even if routes fail
  import('./routes/internships')
    .then(({ listInternships, createInternship, updateInternship, deleteInternship }) => {
      app.get('/api/internships', listInternships);
      app.post('/api/internships', createInternship);
      app.put('/api/internships/:id', updateInternship);
      app.delete('/api/internships/:id', deleteInternship);
    })
    .catch((e) => console.warn('Failed to load internships routes', e));

  // Try to initialize DB in the background (non-blocking)
  initDb().catch((e) => console.error('background initDb failed', e));

  return app;
}
