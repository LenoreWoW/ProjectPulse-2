import express, { type Express, Request, Response, NextFunction } from "express";
import fs from "fs";
import path from "path";
import { createServer as createViteServer, createLogger, ViteDevServer } from "vite";
import { type Server } from "http";
import { nanoid } from "nanoid";
// Import the vite config directly as before
import viteConfig from "../vite.config";

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
export async function setupVite(app: Express, server: Server): Promise<void> {
  try {
    log("Creating Vite dev server...");
    const vite = await createViteServer({
      configFile: path.resolve(projectRoot, 'vite.config.ts'),
      server: {
        middlewareMode: true,
        hmr: {
          server: server
        }
      },
      customLogger: {
        ...viteLogger,
        error: (msg: string, options?: any) => {
          viteLogger.error(msg, options);
          // Don't exit the process on error, just log it
          console.error('Vite server error:', msg);
        }
      }
    });

    app.use(vite.middlewares);
    app.use("*", async (req: Request, res: Response, next: NextFunction) => {
      // Skip problematic URLs that might trigger path-to-regexp issues
      const url = req.originalUrl;
      
      // Skip processing API routes and problematic URLs
      if (url.startsWith('/api') || url.includes('https://') || url.includes('http://')) {
        return next();
      }

      try {
        // Always read fresh index.html in dev
        let template = fs.readFileSync(
          path.resolve(projectRoot, 'client/index.html'),
          'utf-8'
        );

        // Apply Vite HTML transforms
        template = await vite.transformIndexHtml(url, template);
        
        res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
      } catch (e) {
        console.error(`Error processing ${url}:`, e);
        next(e);
      }
    });

    log("Vite development server set up successfully");
  } catch (error) {
    console.error("Failed to set up Vite:", error);
    throw error;
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
