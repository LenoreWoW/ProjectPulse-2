import express from 'express';
import cors from 'cors';
import session from 'express-session';
import { Pool } from 'pg';
import ConnectPgSimple from 'connect-pg-simple';
import passport from 'passport';
import { Strategy as LDAPStrategy } from 'passport-ldapauth';
import { Strategy as LocalStrategy } from 'passport-local';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';

// Setup Express
const app = express();
const port = process.env.PORT || 7000;
const __dirname = path.dirname(fileURLToPath(import.meta.url));

console.log("Setting up server...");

// Middleware
app.use(express.json());
app.use(cors({
  origin: true,
  credentials: true
}));

// Create a PostgreSQL client
const pool = new Pool({
  host: process.env.POSTGRES_HOST || 'localhost',
  port: parseInt(process.env.POSTGRES_PORT || '5432', 10),
  database: process.env.POSTGRES_DB || 'projectpulse',
  user: process.env.POSTGRES_USER || 'postgres',
  password: process.env.POSTGRES_PASSWORD || 'postgres'
});

console.log("Database configuration:");
console.log(`- Host: ${process.env.POSTGRES_HOST || 'localhost'}`);
console.log(`- Port: ${parseInt(process.env.POSTGRES_PORT || '5432', 10)}`);
console.log(`- Database: ${process.env.POSTGRES_DB || 'projectpulse'}`);
console.log(`- User: ${process.env.POSTGRES_USER || 'postgres'}`);
console.log(`- SSL Enabled: ${process.env.POSTGRES_SSL === 'true'}`);

// Set up session store
const PgSession = ConnectPgSimple(session);
const sessionStore = new PgSession({
  pool,
  tableName: 'user_sessions'
});

console.log("PostgreSQL session store initialized");

// Database functions
async function getUserByUsername(username) {
  const result = await pool.query('SELECT * FROM users WHERE LOWER(username) = LOWER($1)', [username]);
  return result.rows.length > 0 ? result.rows[0] : null;
}

async function getUserById(id) {
  const result = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
  return result.rows.length > 0 ? result.rows[0] : null;
}

async function getDepartmentByName(name) {
  const result = await pool.query('SELECT * FROM departments WHERE LOWER(name) = LOWER($1)', [name]);
  return result.rows.length > 0 ? result.rows[0] : null;
}

async function createDepartment(department) {
  const result = await pool.query(
    'INSERT INTO departments (name, description) VALUES ($1, $2) RETURNING *',
    [department.name, department.description]
  );
  return result.rows[0];
}

async function createUser(user) {
  const result = await pool.query(
    'INSERT INTO users (username, email, name, password, role, status, departmentid) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
    [user.username, user.email, user.name, user.password, user.role, user.status, user.departmentid]
  );
  return result.rows[0];
}

async function getUsers() {
    const result = await pool.query('SELECT id, username, email, name, role, status, departmentid, preferredlanguage, isactive, phone, passportimage, idcardimage, title, position, avatarurl, created_at, updated_at FROM users');
    return result.rows;
}

async function getDepartments() {
  const result = await pool.query('SELECT * FROM departments');
  return result.rows;
}

async function getProjects() {
  const result = await pool.query('SELECT * FROM projects');
  return result.rows;
}

// Hash password with bcrypt
async function hashPassword(password) {
  return bcrypt.hash(password, 10);
}

// Verify password with bcrypt
async function verifyPassword(password, hash) {
  return bcrypt.compare(password, hash);
}

// Ensure the Hold department exists
async function ensureHoldDepartmentExists() {
  try {
    let holdDepartment = await getDepartmentByName("Hold");
    if (holdDepartment) {
      return holdDepartment.id;
    }
    holdDepartment = await createDepartment({
      name: "Hold",
      description: "Temporary department for new LDAP users"
    });
    return holdDepartment.id;
  } catch (error) {
    console.error("Error ensuring Hold department exists:", error);
    throw error;
  }
}

// Setup session
app.use(session({
  store: sessionStore,
  secret: process.env.SESSION_SECRET || "pmo-projects-secret-key",
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    secure: process.env.NODE_ENV === "production" && process.env.COOKIE_SECURE !== 'false'
  }
}));

// Setup Passport
app.use(passport.initialize());
app.use(passport.session());

// Local authentication strategy
passport.use('local', 
  new LocalStrategy(async (username, password, done) => {
    try {
      console.log(`Local authentication attempt for user: ${username}`);
      const user = await getUserByUsername(username);
      
      if (!user) {
        console.log(`User not found: ${username}`);
        return done(null, false, { message: "Invalid username or password" });
      }
      
      const passwordValid = await verifyPassword(password, user.password);
      if (!passwordValid) {
        console.log(`Invalid password for user: ${username}`);
        return done(null, false, { message: "Invalid username or password" });
      }
      
      if (user.status !== "Active") {
        console.log(`User account not active: ${username}`);
        return done(null, false, { message: "Your account is not active. Please contact the administrator." });
      }
      
      console.log(`Local authentication successful for user: ${username}`);
      return done(null, user);
    } catch (error) {
      console.error(`Local authentication error for user ${username}:`, error);
      return done(error);
    }
  })
);

// LDAP configuration
const LDAP_CONFIG = {
  server: {
    url: process.env.LDAP_URL || 'ldap://localhost:389',
    bindDN: process.env.LDAP_BIND_DN || 'cn=admin,dc=example,dc=com',
    bindCredentials: process.env.LDAP_BIND_PASSWORD || 'admin',
    searchBase: process.env.LDAP_SEARCH_BASE || 'ou=users,dc=example,dc=com',
    searchFilter: process.env.LDAP_SEARCH_FILTER || '(uid={{username}})',
    searchAttributes: ['uid', 'cn', 'mail']
  },
  credentialsLookup: 'body'
};

console.log("LDAP Configuration:");
console.log(`- URL: ${LDAP_CONFIG.server.url}`);
console.log(`- Bind DN: ${LDAP_CONFIG.server.bindDN}`);
console.log(`- Search Base: ${LDAP_CONFIG.server.searchBase}`);
console.log(`- Search Filter: ${LDAP_CONFIG.server.searchFilter}`);

// LDAP authentication strategy
passport.use('ldap', 
  new LDAPStrategy(LDAP_CONFIG, async (user, done) => {
    try {
      const username = user.uid || user.sAMAccountName;
      const email = user.mail || user.email;
      const name = user.cn || user.displayName || 'LDAP User';
      
      console.log(`LDAP authentication attempt for user: ${username}`);
      
      if (!username || !email) {
        console.log(`Missing required user information from LDAP for user: ${username}`);
        return done(null, false, { message: "Missing required user information from LDAP" });
      }
      
      let existingUser = await getUserByUsername(username);
      
      if (!existingUser) {
        console.log(`Creating new user from LDAP: ${username}`);
        const holdDepartmentId = await ensureHoldDepartmentExists();
        const hashedPassword = await hashPassword(randomBytes(16).toString('hex'));
        const newUser = await createUser({
          username,
          email,
          name,
          password: hashedPassword,
          role: 'User',
          status: 'Active',
          departmentid: holdDepartmentId
        });
        
        console.log(`New user created from LDAP: ${username}`);
        return done(null, newUser);
      }
      
      console.log(`LDAP authentication successful for existing user: ${username}`);
      return done(null, existingUser);
      
    } catch (error) {
      console.error(`LDAP authentication error:`, error);
      return done(error);
    }
  })
);

// Serialize and deserialize user
passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await getUserById(id);
    done(null, user);
  } catch (error) {
    done(error);
  }
});

// Middleware to check if user is authenticated
function isAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ message: 'You are not authenticated' });
}

// API routes
app.get('/api/users', isAuthenticated, async (req, res) => {
    try {
        const users = await getUsers();
        res.json(users);
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ message: 'Error fetching users' });
    }
});

app.get('/api/projects', isAuthenticated, async (req, res) => {
    try {
        const projects = await getProjects();
        res.json(projects);
    } catch (error) {
        console.error('Error fetching projects:', error);
        res.status(500).json({ message: 'Error fetching projects' });
    }
});

app.get('/api/departments', isAuthenticated, async (req, res) => {
    try {
        const departments = await getDepartments();
        res.json(departments);
    } catch (error) {
        console.error('Error fetching departments:', error);
        res.status(500).json({ message: 'Error fetching departments' });
    }
});

// Login route using the custom handler
app.post('/api/login', handleAuth);

// Logout route
app.post('/api/logout', (req, res, next) => {
    req.logout((err) => {
        if (err) {
            return next(err);
        }
        res.status(200).json({ message: "Logged out successfully" });
    });
});

// Get current user route
app.get('/api/user', (req, res) => {
  if (req.isAuthenticated()) {
    const { password, ...userWithoutPassword } = req.user;
    res.json(userWithoutPassword);
  } else {
    res.status(401).json({ message: 'Not authenticated' });
  }
});

// Serve static files from the 'public' directory
const publicPath = path.join(__dirname, '..', 'public');
app.use(express.static(publicPath));

// Custom authentication handler to manage multiple strategies
function handleAuth(req, res, next) {
  const { username } = req.body;
  
  // Example: use LDAP unless username ends with @local, or some other indicator
  const useLdap = !username.endsWith('@local'); 
  const strategy = useLdap ? 'ldap' : 'local';
  
  console.log(`Login attempt with strategy: ${strategy}`);
  
  passport.authenticate(strategy, (err, user, info) => {
    handleAuthResult(err, user, info, req, res);
  })(req, res, next);
}

// Generic function to handle authentication results
function handleAuthResult(err, user, info, req, res) {
  if (res.headersSent) {
    console.error("Error after headers sent:", err || (info ? info.message : 'Unknown error'));
    return;
  }

  if (err) {
    console.log(`Login error:`, err);
    if (err.code === 'ECONNREFUSED' || err.name === 'LdapAuthenticationError') {
      // Fallback to local authentication
      console.log('LDAP connection failed, falling back to local strategy.');
      passport.authenticate('local', (localErr, localUser, localInfo) => {
        handleAuthResult(localErr, localUser, localInfo, req, res);
      })(req, res, next);
      return;
    }
    return res.status(500).json({ message: 'An unexpected error occurred during authentication.' });
  }
  
  if (!user) {
    return res.status(401).json({ message: info.message || "Authentication failed" });
  }
  
  req.logIn(user, (loginErr) => {
    if (loginErr) {
      console.error(`Login error for user ${user.username}:`, loginErr);
      return res.status(500).json({ message: "Error during login" });
    }
    const { password, ...userWithoutPassword } = user;
    res.json(userWithoutPassword);
  });
}

// Start the server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
  console.log(`Server URL: http://localhost:${port}`);
}); 