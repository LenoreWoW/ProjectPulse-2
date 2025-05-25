# ProjectPulse Deployment Scripts

This directory contains deployment scripts for the ProjectPulse application.

## Current Deployment Scripts

### `deploy-current.sh` ✅ **RECOMMENDED**
- **Status**: Up-to-date with current project architecture
- **Technology Stack**: Node.js/Express + Vite/React
- **Features**: 
  - Local development deployment
  - Remote server deployment
  - Render platform deployment
  - PM2 process management
  - PostgreSQL setup
  - Nginx configuration

**Usage:**
```bash
# Local development
./deployment/deploy-current.sh local

# Remote server deployment  
./deployment/deploy-current.sh remote

# Render platform deployment
./deployment/deploy-current.sh render
```

### `deploy.sh`
- **Status**: Legacy script for reference
- **Note**: May contain useful server configuration patterns

## Legacy Scripts (Archived)

The following scripts have been moved to `deployment/legacy/` as they are **outdated** and don't match the current project structure:

### `legacy/deploy-all.sh` ❌ **OUTDATED**
- **Issues**: Expects .NET Core API + Next.js (we use Node.js/Express + Vite/React)
- **Issues**: Wrong project structure (`./apps/api` vs single-root)
- **Issues**: Uses `pnpm` instead of `npm`

### `legacy/deploy-combined.sh` ❌ **OUTDATED**
- **Issues**: Same technology stack mismatch
- **Issues**: Missing current server configuration

### `legacy/deploy-new.sh` ❌ **OUTDATED**
- **Issues**: Incomplete and doesn't match current setup

## Project Architecture

**Current Stack:**
- **Backend**: Node.js/Express (`production-server.js`)
- **Frontend**: Vite + React
- **Database**: PostgreSQL
- **Package Manager**: npm
- **Port**: 7000

**Project Structure:**
```
ProjectPulse/
├── client/                 # Vite + React frontend
├── server/                 # Server utilities
├── production-server.js    # Main Express server
├── package.json           # npm dependencies
└── deployment/            # Deployment scripts
```

## Migration Notes

If you were using the old deployment scripts:

1. **Stop using**: `deploy-all.sh`, `deploy-combined.sh`, `deploy-new.sh`
2. **Start using**: `deploy-current.sh`
3. **Update your CI/CD**: Reference the new script paths
4. **Check environment**: Ensure your `.env` matches the current server configuration

## Support

For deployment issues, check:
1. The current `deploy-current.sh` script
2. The `production-server.js` configuration
3. The `package.json` scripts section 