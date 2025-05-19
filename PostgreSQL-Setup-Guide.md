# PostgreSQL Setup Guide for ProjectPulse

This guide will help you ensure that ProjectPulse is correctly configured to read from and write to the PostgreSQL database for persistent data storage.

## Current Configuration

The application is already set up to use PostgreSQL with connection pooling. The database configuration is managed through:

1. Environment variables in the `.env` file
2. Database initialization scripts in `server/db-init.sql`
3. PostgreSQL storage implementation in `server/pg-storage.ts`

## Ensuring Data Persistence

Follow these steps to ensure your data is properly persisted:

### 1. Verify PostgreSQL Installation

Make sure PostgreSQL is installed and running:

```bash
# Check if PostgreSQL is running
pg_isready -h localhost -p 5432

# If not running on macOS, start it with:
brew services start postgresql

# If not running on Ubuntu/Debian:
sudo service postgresql start

# If not running on Windows:
# Start PostgreSQL from the Services application
```

### 2. Initialize the Database

Before starting the application, run the database initialization script:

```bash
# Make the script executable
chmod +x server/init-database.sh

# Run the initialization script
./server/init-database.sh
```

This will:
- Create the `projectpulse` database if it doesn't exist
- Set up all required tables and relationships
- Create an admin user (username: admin, password: admin123)

### 3. Update Environment Variables

Make sure your `.env` file has the correct PostgreSQL connection parameters:

```
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=projectpulse
DB_USER=postgres
DB_PASSWORD=postgres  # Change this in production!
DB_POOL_MAX=10
DB_IDLE_TIMEOUT=30000
```

For production environments, use a strong password and potentially a different host.

### 4. Verify Database Connection on Startup

When you start the application with `npm run dev` or `npm start`, check the console logs to verify:
- "Database connection successful" message
- "Database initialized successfully" message
- "PostgreSQL storage initialized" message

### 5. Test Data Persistence

To confirm that data is being persisted:
1. Create a project, task, or user in the application
2. Restart the application completely
3. Verify that the data is still available after restart

### 6. Backup Strategy (For Production)

For production environments, set up a regular backup strategy:

```bash
# Create a simple backup script (pg_dump)
cat > backup-database.sh << 'EOL'
#!/bin/bash
source .env
BACKUP_DIR="./backups"
mkdir -p $BACKUP_DIR
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
PGPASSWORD=$DB_PASSWORD pg_dump -h $DB_HOST -p $DB_PORT -U $DB_USER $DB_NAME > "$BACKUP_DIR/projectpulse_$TIMESTAMP.sql"
echo "Backup created: $BACKUP_DIR/projectpulse_$TIMESTAMP.sql"
EOL

# Make it executable
chmod +x backup-database.sh
```

### 7. Troubleshooting Connection Issues

If you encounter connection issues:

1. Verify PostgreSQL credentials:
```bash
psql -h localhost -p 5432 -U postgres -d projectpulse
# You'll be prompted for a password
```

2. Check PostgreSQL logs for errors:
```bash
# Location varies by platform
sudo cat /var/log/postgresql/postgresql-13-main.log
```

3. Make sure PostgreSQL is accepting connections:
```bash
# Edit PostgreSQL configuration to allow connections
sudo nano /etc/postgresql/13/main/pg_hba.conf
# Add line: host all all 0.0.0.0/0 md5
```

## Production Considerations

For production deployments:

1. Use a dedicated PostgreSQL server or managed service (like AWS RDS, DigitalOcean Managed Databases)
2. Set up proper user accounts with limited permissions
3. Use connection pooling with appropriate limits
4. Implement regular backups and disaster recovery procedures
5. Monitor database performance and growth

Your application is already configured with appropriate connection pooling through the `pg` library, so these database operations should be efficient and reliable. 