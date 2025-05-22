# ProjectPulse

ProjectPulse is a comprehensive project management system designed for organizations to track projects, manage departments, and handle user authentication with support for both local and LDAP authentication methods.

## Features

- **User Authentication**: Supports both local database authentication and LDAP integration
- **Project Management**: Create, update, and manage projects across departments
- **Department Organization**: Organize teams and projects by departments
- **User Management**: Admin controls for user accounts and permissions
- **Dashboard Analytics**: Visual representations of project status and progress
- **Responsive Design**: Works on desktop and mobile devices

## Tech Stack

- **Backend**: Node.js with Express
- **Database**: PostgreSQL
- **Authentication**: Passport.js with Local and LDAP strategies
- **Frontend**: HTML, CSS, JavaScript with Bootstrap 5

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- PostgreSQL database
- LDAP server (optional, for LDAP authentication)

### Installation

1. Clone the repository:

```bash
git clone https://github.com/your-organization/projectpulse.git
cd projectpulse
```

2. Install dependencies:

```bash
npm install
```

3. Set up the database:

```bash
node create-db-schema.js
```

4. Create the admin user:

```bash
node create-admin.js
```

5. Start the server:

```bash
node production-server.js
```

### Configuration

1. Database configuration can be modified in `db-config.js`
2. LDAP settings can be configured in `ldap-config.js`
3. Server port and other settings can be adjusted in `server-config.js`

## Usage

### Accessing the Application

Once the server is running, you can access the application at:

- **Dashboard**: Open `projectpulse-dashboard.html` in your browser
- **API**: Access the API at `http://localhost:7000/api`
- **Test Page**: A simple test page is available at `test-production.html`

### Default Admin Credentials

The system comes with a default administrator account:

- **Username**: Hdmin
- **Password**: Hdmin1738!@

It is recommended to change this password after the first login.

### API Endpoints

#### Authentication

- `POST /api/login` - Authenticate a user
- `POST /api/logout` - Log out the current user
- `GET /api/user` - Get the current logged-in user

#### Projects

- `GET /api/projects` - List all projects
- `POST /api/projects` - Create a new project
- `GET /api/projects/:id` - Get a specific project
- `PUT /api/projects/:id` - Update a project
- `DELETE /api/projects/:id` - Delete a project

#### Departments

- `GET /api/departments` - List all departments
- `POST /api/departments` - Create a new department
- `GET /api/departments/:id` - Get a specific department
- `PUT /api/departments/:id` - Update a department
- `DELETE /api/departments/:id` - Delete a department

#### Users

- `GET /api/users` - List all users (admin only)
- `POST /api/users` - Create a new user (admin only)
- `GET /api/users/:id` - Get a specific user
- `PUT /api/users/:id` - Update a user
- `DELETE /api/users/:id` - Delete a user (admin only)

## Troubleshooting

### Common Issues

1. **Database Connection Errors**:
   - Ensure PostgreSQL is running
   - Check database credentials in `db-config.js`
   - Verify the database exists and is accessible

2. **LDAP Authentication Issues**:
   - Verify LDAP server is reachable
   - Check LDAP configuration settings
   - Ensure proper bind credentials

3. **Server Startup Problems**:
   - Check for port conflicts
   - Verify Node.js version is compatible
   - Look for error messages in the console

### Logging

The application logs can be found in:
- `logs/server.log` - General server logs
- `logs/error.log` - Error-specific logs

## Development

### Project Structure

```
projectpulse/
├── server/             # Server-side code
│   ├── routes/         # API routes
│   ├── middleware/     # Express middleware
│   ├── controllers/    # Business logic
│   └── models/         # Data models
├── client/             # Client-side code
│   ├── components/     # UI components
│   ├── pages/          # Page layouts
│   └── utils/          # Helper functions
├── config/             # Configuration files
├── scripts/            # Utility scripts
└── public/             # Static assets
```

### Development Server

For development, use the development server which includes hot-reloading:

```bash
npm run dev
```

### Building for Production

To build the application for production:

```bash
npm run build
```

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgements

- Bootstrap for the UI framework
- Passport.js for authentication strategies
- Express.js for the API framework 