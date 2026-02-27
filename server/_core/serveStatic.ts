import express from "express";
import fs from "fs";
import path from "path";

// This file intentionally has **no** Vite/Tailwind imports.
// It must stay production-safe so the server build can bundle cleanly.

export function serveStatic(app: express.Express) {
  // In production we run from the project root (Railway usually uses /app),
  // and the client build outputs to dist/public.
  // Use process.cwd() so bundling doesn't break relative paths.
  const publicPath = path.resolve(process.cwd(), "dist/public");

  if (!fs.existsSync(publicPath)) {
    throw new Error(`Could not find the built client at: ${publicPath}`);
  }

  app.use(express.static(publicPath));

  // SPA fallback
  app.get("*", (_req, res) => {
    res.sendFile(path.join(publicPath, "index.html"));
  });
}
