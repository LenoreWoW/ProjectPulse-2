# PostgreSQL Configuration for ProjectPulse

This guide explains how to set up and use PostgreSQL as the database for ProjectPulse.

## Prerequisites

1. PostgreSQL installed (version 12 or higher recommended)
2. Node.js and npm installed

## Setup Instructions

### 1. Install PostgreSQL

#### For macOS:
```bash
brew install postgresql
brew services start postgresql
```

#### For Ubuntu/Debian:
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

#### For Windows:
Download and install from the [PostgreSQL official website](https://www.postgresql.org/download/windows/)

### 2. Create a Database

```bash
# Log in as the postgres user
sudo -u postgres psql

# In the PostgreSQL shell, create a new database
CREATE DATABASE projectpulse;

# Create a user (or use existing postgres user)
CREATE USER projectpulseuser WITH ENCRYPTED PASSWORD 'yourpassword';

# Grant privileges to the user
GRANT ALL PRIVILEGES ON DATABASE projectpulse TO projectpulseuser;

# Exit PostgreSQL shell
\q
```

### 3. Configure Environment Variables

Create or update the `.env` file in the project root with your PostgreSQL configuration:

```
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=projectpulse
DB_USER=projectpulseuser
DB_PASSWORD=yourpassword
DB_POOL_MAX=10
DB_IDLE_TIMEOUT=30000
```

### 4. Initialize the Database

Run the database initialization script to create all necessary tables:

```bash
# Make the script executable
chmod +x server/init-database.sh

# Run the script
./server/init-database.sh
```

## Database Schema

The database schema includes tables for:
- Users
- Departments
- Projects
- Tasks
- Change Requests
- Goals
- Risks and Issues
- Notifications
- Assignments
- Action Items
- Weekly Updates
- Project Cost History
- Milestones
- And more

See `server/db-init.sql` for the complete schema.

## Using the PostgreSQL Storage

The application has been configured to use PostgreSQL instead of in-memory storage. This provides:

1. **Persistence**: Data remains after server restarts
2. **Scalability**: Better performance for large datasets
3. **Reliability**: Robust data storage with ACID compliance
4. **Concurrent Access**: Handles multiple simultaneous connections

## Troubleshooting

### Connection Issues

If you experience connection issues:

1. Ensure PostgreSQL service is running
2. Verify the credentials in your `.env` file
3. Check PostgreSQL logs: `sudo tail -f /var/log/postgresql/postgresql-<version>-main.log`
4. Ensure your firewall allows connections to port 5432

### Schema Issues

If you notice schema-related errors:

1. Check the database tables: 
   ```
   psql -U projectpulseuser -d projectpulse -c "\dt"
   ```
2. Verify table structure:
   ```
   psql -U projectpulseuser -d projectpulse -c "\d+ users"
   ```
3. Re-run the initialization script if necessary:
   ```
   ./server/init-database.sh
   ```

## Backup and Restore

### Create a backup

```bash
pg_dump -U projectpulseuser -d projectpulse -F c -f projectpulse_backup.dump
```

### Restore from backup

```bash
pg_restore -U projectpulseuser -d projectpulse -c projectpulse_backup.dump
``` 