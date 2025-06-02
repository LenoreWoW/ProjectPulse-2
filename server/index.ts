import express from 'express';
import { Express, Request, Response, NextFunction } from 'express';
import { registerRoutes } from './routes';
import { serveStatic } from './vite';
import { Server as HttpServer } from 'http';
import { reminderService } from './reminder-service';
import { PgStorage } from './pg-storage';
import { initDb } from './db-config';
import cors from 'cors';

// Load environment variables
const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 7000;
const app: Express = express();

// Debug logs
console.log("Starting server with configuration:");
console.log(`- Environment: ${process.env.NODE_ENV}`);
console.log(`- Port: ${port} (from env: ${process.env.PORT || 'not set'})`);

// Middleware for parsing request bodies
app.use(express.json());

// CORS settings
const corsOptions = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:5173', // Vite default port
      'http://localhost:7000', // API port
    ];

    // Allow requests with no origin (like mobile apps, curl, etc)
    if (!origin) {
      return callback(null, true);
    }

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      // Production origin handling
      const prodOrigin = process.env.CLIENT_URL || 'https://yourdomain.com';
      if (process.env.NODE_ENV === 'production' && origin === prodOrigin) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'), false);
      }
    }
  },
  methods: ['GET', 'POST', 'OPTIONS', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['X-Requested-With', 'content-type', 'Authorization'],
  credentials: true,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));

// Middleware for logging API requests
app.use((req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  
  // Store the original end method
  const originalEnd = res.end;
  
  // Define a function to log the request details after completion
  const logRequestDetails = () => {
    const duration = Date.now() - start;
    const { method, url } = req;
    const { statusCode } = res;
    
    // Only log API requests, not static files
    if (url && url.startsWith('/api')) {
      console.log(`${method} ${url} ${statusCode} ${duration}ms`);
    }
  };
  
  // Monkey-patch the writeHead method to log after response is sent
  res.on('finish', logRequestDetails);
  
  next();
});

// Add a basic test route to verify the server is responding
app.get('/test', (req: Request, res: Response) => {
  res.send('Server is working!');
});

// Error handling middleware
app.use((err: Error & { status?: number }, req: Request, res: Response, next: NextFunction) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    message: err.message || 'Internal server error',
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
  });
});

// Initialize the database and start the server
async function startServer(): Promise<void> {
  try {
    console.log("Starting server initialization...");
    
    // Initialize the database connection
    try {
      console.log("Initializing database connection...");
      await initDb();
      console.log("Database initialization completed successfully");
    } catch (dbError) {
      console.error('Database initialization failed:', dbError);
      throw dbError;
    }
    
    // Register all API routes first
    console.log("Registering API routes...");
    const server: HttpServer = await registerRoutes(app);
    
    // In production mode, serve static files
    if (process.env.NODE_ENV === 'production') {
      console.log("Setting up static file serving for production...");
      serveStatic(app);
    }
    
    // Start listening for connections
    server.listen(port, () => {
      console.log(`⚡️ Backend server is running at http://localhost:${port}`);
      console.log(`📱 Frontend should run on http://localhost:5173 with proxy to backend`);
      
      // Log all routes (in development)
      if (process.env.NODE_ENV === 'development') {
        console.log('Registered API routes:');
        (app._router.stack as any[])
          .filter((r) => r.route)
          .forEach((r) => {
            const methods = Object.keys(r.route.methods)
              .filter(m => m !== '_all')
              .join(', ')
              .toUpperCase();
            console.log(`${methods} ${r.route.path}`);
          });
      }
      
      // Start the reminder service to check every 24 hours
      reminderService.start(24, true);
      console.log("Reminder service started successfully");
    });
    
    // Handle server errors
    server.on('error', (error: NodeJS.ErrnoException) => {
      if (error.code === 'EADDRINUSE') {
        console.error(`Port ${port} is already in use. Please try a different port.`);
        process.exit(1);
      } else {
        console.error('Server error:', error);
        process.exit(1);
      }
    });
    
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Handle uncaught exceptions
process.on('uncaughtException', (error: Error) => {
  console.error('Uncaught exception:', error);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

console.log("Calling startServer()...");
startServer();
