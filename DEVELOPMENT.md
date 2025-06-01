# Development Guide

## Running the Application

### Development Mode (Recommended)

To run the application in development mode with both frontend and backend integrated:

```bash
npm run dev
```

This will start the server on **http://localhost:7000** with:
- Express API server
- Vite development middleware for hot reloading
- PostgreSQL database connection
- Authentication system

**Important**: Access the application at `http://localhost:7000`, NOT `http://localhost:5173`

### Alternative: Vite-Only Mode

If you need to run only the Vite frontend (for testing frontend-only features):

```bash
npm run dev:vite-only
```

This runs Vite on port 5173, but you'll need to start the backend separately:

```bash
npx tsx server/index.ts
```

## Common Issues

### 500 Internal Server Error on /api/audit-logs

This error occurs when:
1. You're accessing the app via `http://localhost:5173` instead of `http://localhost:7000`
2. The backend server isn't running
3. You're not authenticated

**Solution**: Always use `http://localhost:7000` for development.

### Port Conflicts

If you see "Port 7000 is already in use":
1. Kill existing processes: `pkill -f "tsx server/index.ts"`
2. Wait a few seconds
3. Restart with `npm run dev`

## Authentication

The application requires authentication to access audit logs. Make sure you:
1. Access the app via `http://localhost:7000`
2. Log in with valid credentials
3. Have appropriate role permissions (Administrator, MainPMO, SubPMO, or DepartmentDirector)

## Database

The application uses PostgreSQL. Ensure your database is running and configured in your `.env` file. 