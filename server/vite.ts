import express, { type Express, Request, Response, NextFunction } from "express";
import fs from "fs";
import path from "path";
import { createServer as createViteServer, createLogger, ViteDevServer } from "vite";
import { type Server } from "http";
import { nanoid } from "nanoid";

// Use process.cwd() to avoid path resolution issues with import.meta
const projectRoot = process.cwd();

const viteLogger = createLogger();

export function log(message: string, source = "express") {
  const id = nanoid(6);
  const timestamp = new Date().toISOString().slice(11, 19);
  console.log(`[${timestamp}] [${source}:${id}] ${message}`);
}

/**
 * Set up Vite middleware for development
 */
export async function registerVite(app: Express): Promise<ViteDevServer | undefined> {
  if (process.env.NODE_ENV === "production") {
    app.use(express.static(path.resolve("dist")));
    return;
  }

  try {
    log("Creating Vite dev server...");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
      logLevel: "info",
      root: path.resolve(projectRoot, "client"),
      resolve: {
        alias: {
          "@": path.resolve(projectRoot, "client", "src"),
          "@shared": path.resolve(projectRoot, "shared"),
          "@assets": path.resolve(projectRoot, "attached_assets"),
        },
      },
    });
    
    app.use(vite.ssrFixStacktrace);
    app.use(vite.middlewares);
    
    console.log("Vite dev server setup complete");
    return vite;
  } catch (error) {
    console.error("Vite server error:", error);
    console.error("Failed to set up Vite:", error);
    throw error; // Re-throw to prevent server from continuing with broken setup
  }
}

/**
 * Serve static files from the dist directory in production
 */
export function serveStatic(app: Express): void {
  const distPath = path.resolve(projectRoot, 'dist/public');
  
  // serve static assets
  if (fs.existsSync(distPath)) {
    app.use(express.static(distPath, { index: false }));
  }
  
  // fall through to index.html if the file doesn't exist
  app.use("*", (req: Request, res: Response, next: NextFunction) => {
    // Skip processing API routes and problematic URLs
    const url = req.originalUrl;
    if (url.startsWith('/api') || url.includes('https://') || url.includes('http://')) {
      return next();
    }
    
    // Otherwise send index.html
    res.sendFile(path.resolve(distPath, "index.html"));
  });
}
