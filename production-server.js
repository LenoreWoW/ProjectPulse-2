import express from 'express';
import cors from 'cors';
import session from 'express-session';
import { Pool } from 'pg';
import ConnectPgSimple from 'connect-pg-simple';
import passport from 'passport';
import { Strategy as LDAPStrategy } from 'passport-ldapauth';
import { Strategy as LocalStrategy } from 'passport-local';
import { randomBytes, scrypt, timingSafeEqual } from 'crypto';
import { promisify } from 'util';
import path from 'path';
import { fileURLToPath } from 'url';

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

// Helper for password hashing
const scryptAsync = promisify(scrypt);

// Database functions
async function getUserByUsername(username) {
  // Make the query case-insensitive
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
  const result = await pool.query('SELECT * FROM users');
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

// Hash password with scrypt
async function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const derivedKey = (await scryptAsync(password, salt, 64));
  return salt + "." + derivedKey.toString("hex");
}

// Compare a password with a hash
async function comparePasswords(providedPassword, storedHash) {
  const [salt, key] = storedHash.split(".");
  const derivedKey = (await scryptAsync(providedPassword, salt, 64));
  const keyBuffer = Buffer.from(key, "hex");
  return timingSafeEqual(derivedKey, keyBuffer);
}

// Ensure the Hold department exists
async function ensureHoldDepartmentExists() {
  try {
    // Check if Hold department exists
    let holdDepartment = await getDepartmentByName("Hold");
    
    if (holdDepartment) {
      return holdDepartment.id;
    }
    
    // Create Hold department if it doesn't exist
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
      
      const passwordValid = await comparePasswords(password, user.password);
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
      // Extract user information from LDAP response
      const username = user.uid || user.sAMAccountName;
      const email = user.mail || user.email;
      const name = user.cn || user.displayName || 'LDAP User';
      
      console.log(`LDAP authentication attempt for user: ${username}`);
      
      if (!username || !email) {
        console.log(`Missing required user information from LDAP for user: ${username}`);
        return done(null, false, { message: "Missing required user information from LDAP" });
      }
      
      // Check if user already exists in our system
      let existingUser = await getUserByUsername(username);
      
      if (!existingUser) {
        // First-time LDAP login, create user in our system
        console.log(`Creating new user from LDAP: ${username}`);
        
        // Ensure Hold department exists
        const holdDepartmentId = await ensureHoldDepartmentExists();
        
        // Create user with Hold department and User role
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
      
      // Existing user
      console.log(`LDAP authentication successful for existing user: ${username}`);
      return done(null, existingUser);
      
    } catch (error) {
      console.error(`LDAP authentication error:`, error);
      return done(error);
    }
  })
);

passport.serializeUser((user, done) => {
  console.log(`Serializing user: ${user.id}`);
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await getUserById(id);
    console.log(`Deserialized user: ${id}`);
    done(null, user);
  } catch (error) {
    console.error(`Error deserializing user: ${id}`, error);
    done(error);
  }
});

// Authentication middleware
function isAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ message: "Unauthenticated" });
}

// Routes
app.get('/api/test', (req, res) => {
  res.json({ message: 'Server is working!' });
});

app.get('/api/db-test', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW()');
    res.json({ success: true, time: result.rows[0].now });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Auth routes
app.post('/api/login', (req, res, next) => {
  console.log("Login attempt with strategy:", req.body.strategy || "auto");
  
  // Allow explicit strategy selection
  if (req.body.strategy === 'local') {
    return passport.authenticate("local", (err, user, info) => {
      handleAuthResult(err, user, info, req, res);
    })(req, res, next);
  } else if (req.body.strategy === 'ldap') {
    return passport.authenticate("ldap", (err, user, info) => {
      handleAuthResult(err, user, info, req, res);
    })(req, res, next);
  }
  
  // Try LDAP authentication first, then fall back to local
  let responded = false; // Flag to track if we've already sent a response
  
  passport.authenticate("ldap", { session: false }, (ldapErr, ldapUser, ldapInfo) => {
    if (responded) return; // Don't proceed if we've already sent a response
    
    if (ldapUser) {
      // LDAP authentication succeeded
      console.log("LDAP Authentication successful for user:", ldapUser.username);
      req.login(ldapUser, (loginErr) => {
        if (responded) return;
        responded = true;
        
        if (loginErr) {
          console.error("Session login error:", loginErr);
          return res.status(500).json({ message: "Failed to establish session" });
        }
        return res.status(200).json(ldapUser);
      });
    } else {
      // LDAP authentication failed, try local authentication
      passport.authenticate("local", (err, user, info) => {
        if (responded) return;
        responded = true;
        
        if (err) {
          console.error("Login error:", err);
          return res.status(500).json({ message: "Authentication error" });
        }
        if (!user) {
          console.log("Authentication failed:", info?.message);
          return res.status(401).json({ message: info?.message || "Authentication failed" });
        }
        
        req.login(user, (loginErr) => {
          if (loginErr) {
            console.error("Session login error:", loginErr);
            return res.status(500).json({ message: "Failed to establish session" });
          }
          return res.status(200).json(user);
        });
      })(req, res, next);
    }
  })(req, res, next);
});

function handleAuthResult(err, user, info, req, res) {
  if (err) {
    console.error("Login error:", err);
    return res.status(500).json({ message: "Authentication error" });
  }
  if (!user) {
    console.log("Authentication failed:", info?.message);
    return res.status(401).json({ message: info?.message || "Authentication failed" });
  }
  
  req.login(user, (loginErr) => {
    if (loginErr) {
      console.error("Session login error:", loginErr);
      return res.status(500).json({ message: "Failed to establish session" });
    }
    return res.status(200).json(user);
  });
}

app.get('/api/logout', (req, res) => {
  req.logout((err) => {
    if (err) {
      console.error("Logout error:", err);
      return res.status(500).json({ message: "Error during logout" });
    }
    res.status(200).json({ message: "Logged out successfully" });
  });
});

app.get('/api/current-user', (req, res) => {
  if (req.isAuthenticated()) {
    res.json(req.user);
  } else {
    res.status(401).json({ message: "Not logged in" });
  }
});

// Add a new alias for /api/user that matches the client's expectations
app.get('/api/user', (req, res) => {
  if (req.isAuthenticated()) {
    res.json(req.user);
  } else {
    res.status(401).json({ message: "Not logged in" });
  }
});

// API routes
app.get('/api/users', isAuthenticated, async (req, res) => {
  try {
    const users = await getUsers();
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch users", error: error.message });
  }
});

app.get('/api/departments', isAuthenticated, async (req, res) => {
  try {
    const departments = await getDepartments();
    res.json(departments);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch departments", error: error.message });
  }
});

app.get('/api/projects', isAuthenticated, async (req, res) => {
  try {
    const projects = await getProjects();
    res.json(projects);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch projects", error: error.message });
  }
});

// Audit logs endpoint
app.get('/api/audit-logs', isAuthenticated, async (req, res) => {
  try {
    // Since we don't have full audit log functionality in the production server,
    // return an empty array to prevent 404 errors
    res.json([]);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch audit logs", error: error.message });
  }
});

// Risks and issues endpoint
app.get('/api/risks-issues', isAuthenticated, async (req, res) => {
  try {
    // Since we don't have full risks and issues functionality in the production server,
    // return an empty array to prevent 404 errors
    res.json([]);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch risks and issues", error: error.message });
  }
});

// Tasks endpoint
app.get('/api/tasks', isAuthenticated, async (req, res) => {
  try {
    // Since we don't have full tasks functionality in the production server,
    // return an empty array to prevent 404 errors
    res.json([]);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch tasks", error: error.message });
  }
});

// LDAP configuration endpoint
app.get('/api/ldap-config', (req, res) => {
  res.json({
    url: LDAP_CONFIG.server.url,
    searchBase: LDAP_CONFIG.server.searchBase,
    searchFilter: LDAP_CONFIG.server.searchFilter
  });
});

// Serve static files from the dist directory in production
const distPath = path.resolve(__dirname, 'dist/public');
app.use(express.static(distPath, { index: false }));

// All unhandled routes should serve the index.html for client-side routing
app.get('*', (req, res) => {
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ message: "API route not found" });
  }
  
  // Make sure we're setting proper content type and cache control
  res.set({
    'Content-Type': 'text/html',
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0'
  });
  
  // Send the index.html file for all client-side routes
  res.sendFile(path.join(distPath, 'index.html'));
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
  console.log(`Server URL: http://localhost:${port}`);
}); 