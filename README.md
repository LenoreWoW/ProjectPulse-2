# ProjectPulse

ProjectPulse is a comprehensive project management system specifically designed for Qatar Air Force project tracking and management. It provides features for managing projects, tasks, assignments, risks, issues, and various reporting capabilities.

## Version Overview

ProjectPulse is available in three different versions:

### Version 0: In-Memory Storage (Default)

This is the default development version that uses in-memory storage. All data is stored in memory and will be reset when the server restarts. This version is perfect for development, testing, and demonstrations where persistence is not required.

**Branch:** `version-0-memory`

**Key Features:**
- No database setup required
- Fast and simple for development
- Sample data loaded at startup
- All data resets on server restart

### Version 1: Clean Database

This version connects to a PostgreSQL database and starts with empty tables. It's ideal for production environments or when you want to start with a clean slate.

**Branch:** `version-1-clean`

**Key Features:**
- Uses PostgreSQL for data persistence
- Starts with empty database tables
- Requires database setup (see Database Setup section)
- All data persists across server restarts

### Version 2: Populated Database

This version connects to a PostgreSQL database and populates it with comprehensive mock data. It's perfect for demonstrations, testing, and scenarios where you need realistic data without manual entry.

**Branch:** `version-2-populated`

**Key Features:**
- Uses PostgreSQL for data persistence
- Pre-populated with realistic mock data including:
  - Multiple departments and users with various roles
  - Projects in different statuses with realistic budgets
  - Tasks, assignments, risks, issues, and change requests
  - Strategic and annual goals
- Requires database setup (see Database Setup section)
- All data persists across server restarts

## Setup Instructions

### Prerequisites

- Node.js (v16 or newer)
- npm (v7 or newer)
- PostgreSQL (v13 or newer) - for Version 1 and 2 only

### Common Setup

1. Clone the repository:
   ```
   git clone https://github.com/your-repo/projectpulse.git
   cd projectpulse
   ```

2. Install dependencies:
   ```
   npm install
   ```

### Version-Specific Setup

#### Version 0: In-Memory Storage

1. Switch to the in-memory branch:
   ```
   git checkout version-0-memory
   ```

2. Start the application:
   ```
   npm run dev
   ```

3. Access the application at http://localhost:5000

#### Version 1: Clean Database

1. Switch to the clean database branch:
   ```
   git checkout version-1-clean
   ```

2. Configure your database connection in `.env`:
   ```
   DB_HOST=localhost
   DB_PORT=5432
   DB_NAME=projectpulse
   DB_USER=postgres
   DB_PASSWORD=yourpassword
   DB_SSL=false
   ```

3. Start the application:
   ```
   npm run dev
   ```

4. Access the application at http://localhost:5000

#### Version 2: Populated Database

1. Switch to the populated database branch:
   ```
   git checkout version-2-populated
   ```

2. Configure your database connection in `.env`:
   ```
   DB_HOST=localhost
   DB_PORT=5432
   DB_NAME=projectpulse
   DB_USER=postgres
   DB_PASSWORD=yourpassword
   DB_SSL=false
   ```

3. Start the application with the populated data script:
   ```
   ./start-populated.sh
   ```
   
   Or manually:
   ```
   export APP_VERSION=populated
   npm run dev
   ```

4. Access the application at http://localhost:5000

### PostgreSQL Database Setup

For Version 1 and Version 2, you need to set up a PostgreSQL database:

1. Install PostgreSQL if you haven't already
2. Create a new database:
   ```
   createdb projectpulse
   ```
3. Configure the database connection in your `.env` file

## Default Users

The system comes with the following default users:

### Version 0 (In-Memory)
- **Administrator**: 
  - Username: `admin`
  - Password: `admin123`
- **Super Admin**:
  - Username: `Hdmin`
  - Password: `Hdmin1738!@`

### Version 2 (Populated)
All users have the password: `Password123!`

- **Administrators**:
  - `admin`
  - `superadmin`
- **Department Directors**: 
  - `director1` through `director5`
- **Main PMO**:
  - `mainpmo`
- **Sub PMO**:
  - `subpmo1` through `subpmo5`
- **Project Managers**:
  - `pm1` through `pm10`
- **Regular Users**:
  - `user1` through `user25`
- **Executive**:
  - `executive`

## Features

ProjectPulse includes a wide range of features:

- **Project Management**: Create, track, and manage projects
- **Task Management**: Assign and track tasks
- **Risk & Issue Management**: Identify and manage risks and issues
- **Change Request Management**: Process and approve change requests
- **Department Management**: Organize projects by department
- **User Management**: Comprehensive user role system
- **Reporting**: Generate reports on budgets, forecasts, and project status
- **Goals Management**: Set and track strategic and annual goals
- **Assignment System**: Assign and track work assignments
- **Notifications**: Receive notifications for important events

## Technologies Used

- **Frontend**: React, TailwindCSS, Radix UI, TanStack Query
- **Backend**: Node.js, Express.js
- **Database**: 
  - In-memory storage (Version 0)
  - PostgreSQL with Drizzle ORM (Version 1 & 2)
- **Authentication**: Passport.js, cookies-based sessions
- **Internationalization**: Custom i18n implementation with English and Arabic support 