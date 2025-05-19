# ProjectPulse Database Management Guide

This guide explains how to set up, manage, and troubleshoot the PostgreSQL database for the ProjectPulse application.

## Database Overview

ProjectPulse uses PostgreSQL for data persistence. The application is configured to automatically initialize the database when starting, ensuring all required tables are created and ready to use.

## Quick Start

1. Make sure PostgreSQL is installed and running.
2. Set your database credentials in the `.env` file.
3. Run `npm run db:init` to initialize the database.
4. Start the application with `npm run dev` or `npm run start`.

## Database Scripts

The following npm scripts are available for database management:

- `npm run db:init` - Initialize the database (automatically run when starting the application)
- `npm run db:check` - Check the database connection and structure
- `npm run db:backup` - Create a backup of the database
- `npm run db:push` - Push schema changes (using drizzle-kit)

## Database Configuration

All database configuration is stored in the `.env` file:

```
# Database Configuration
DB_HOST=localhost         # Database server hostname
DB_PORT=5432              # PostgreSQL port
DB_NAME=projectpulse      # Database name
DB_USER=postgres          # Database username
DB_PASSWORD=postgres      # Database password (change this in production!)
DB_POOL_MAX=10            # Maximum number of connections in the pool
DB_IDLE_TIMEOUT=30000     # Connection idle timeout in milliseconds
DB_SSL=false              # Whether to use SSL for database connection
```

## Manual Database Setup

If you need to manually set up the database:

1. Install PostgreSQL if not already installed.
2. Create a database named `projectpulse`:
   ```bash
   createdb -h localhost -U postgres projectpulse
   ```
3. Run the schema creation script:
   ```bash
   psql -h localhost -U postgres -d projectpulse -f server/db-init.sql
   ```
4. Create an admin user:
   ```bash
   psql -h localhost -U postgres -d projectpulse -c "
   INSERT INTO users (username, email, password, name, role, status) 
   VALUES ('admin', 'admin@projectpulse.com', '\$2a\$10\$tEyxm5CWqLj/8X6OKUm1r.xhp4GxC3lxA5j8JYQjghRbGvyKXMjAy', 'Admin User', 'Administrator', 'Active');
   "
   ```

## Database Backups

The `backup-database.sh` script creates backups of your database:

```bash
# Create a backup manually
./backup-database.sh
```

Backups are stored in the `backups` directory with timestamps in the filename.

For regular backups, set up a cron job:

```bash
# Example: backup daily at 2am
0 2 * * * cd /path/to/projectpulse && ./backup-database.sh
```

## Database Structure

The ProjectPulse database consists of multiple tables for managing projects, tasks, users, and other entities:

- `users` - User accounts and authentication information
- `departments` - Department information
- `projects` - Main project data
- `tasks` - Tasks associated with projects
- `change_requests` - Project change requests
- `goals` - Strategic and annual goals
- `risks_issues` - Project risks and issues
- `notifications` - User notifications
- `assignments` - User assignments
- `action_items` - Action items from meetings
- `weekly_updates` - Weekly project updates
- `project_cost_history` - Historical project cost data
- `project_goals` - Relationships between projects and goals
- `goal_relationships` - Parent-child relationships between goals
- `task_comments` - Comments on tasks
- `assignment_comments` - Comments on assignments
- `project_dependencies` - Dependencies between projects
- `milestones` - Project milestones
- `task_milestones` - Relationships between tasks and milestones
- `sessions` - Session storage for authentication

## Troubleshooting

### Connection Issues

If you encounter connection issues:

1. Check if PostgreSQL is running:
   ```bash
   pg_isready -h localhost -p 5432
   ```

2. Verify your credentials:
   ```bash
   psql -h localhost -p 5432 -U postgres -c "SELECT 1"
   ```

3. Make sure the database exists:
   ```bash
   psql -h localhost -p 5432 -U postgres -l
   ```

4. Check PostgreSQL logs for errors:
   ```bash
   # Location varies by platform
   sudo cat /var/log/postgresql/postgresql-14-main.log
   ```

### Run Database Diagnostics

Use the diagnostic script to check your database connection and structure:

```bash
npm run db:check
```

This will show:
- Connection status
- PostgreSQL version
- List of tables
- Number of users
- Whether the admin user exists

## Production Considerations

For production environments:

1. **Use a strong password**: Change the default PostgreSQL password in the `.env` file.

2. **Set up regular backups**: Configure automated backups with the provided script.

3. **Consider a managed service**: For critical applications, consider using a managed PostgreSQL service like AWS RDS, DigitalOcean Managed Databases, or Google Cloud SQL.

4. **Secure your database**:
   - Configure proper network access rules
   - Use SSL for database connections
   - Follow the principle of least privilege for database users

5. **Monitor performance**:
   - Set up monitoring for database performance
   - Watch for slow queries
   - Set up alerts for high resource usage 