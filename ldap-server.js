import express from 'express';
import cors from 'cors';
import session from 'express-session';
import { Pool } from 'pg';
import passport from 'passport';
import { Strategy as LDAPStrategy } from 'passport-ldapauth';
import { Strategy as LocalStrategy } from 'passport-local';
import { randomBytes, scrypt, timingSafeEqual } from 'crypto';
import { promisify } from 'util';

// Setup Express
const app = express();
const port = process.env.PORT || 7000;

// Middleware
app.use(express.json());
app.use(cors({
  origin: true, // Allow all origins
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

// Helper for password hashing
const scryptAsync = promisify(scrypt);

// Database functions
async function getUserByUsername(username) {
  const result = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
  return result.rows.length > 0 ? result.rows[0] : null;
}

async function getDepartmentByName(name) {
  const result = await pool.query('SELECT * FROM departments WHERE LOWER(name) = LOWER($1)', [name]);
  return result.rows.length > 0 ? result.rows[0] : null;
}

async function createDepartment(department) {
  const result = await pool.query(
    'INSERT INTO departments (name, description, "isActive") VALUES ($1, $2, $3) RETURNING *',
    [department.name, department.description, department.isActive]
  );
  return result.rows[0];
}

async function createUser(user) {
  const result = await pool.query(
    'INSERT INTO users (username, email, name, password, role, status, "departmentId", "preferredLanguage", "isActive") VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *',
    [user.username, user.email, user.name, user.password, user.role, user.status, user.departmentId, user.preferredLanguage, user.isActive]
  );
  return result.rows[0];
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
      description: "Temporary department for new LDAP users",
      isActive: true
    });
    
    return holdDepartment.id;
  } catch (error) {
    console.error("Error ensuring Hold department exists:", error);
    throw error;
  }
}

// Setup session
app.use(session({
  secret: process.env.SESSION_SECRET || "pmo-projects-secret-key",
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    secure: process.env.NODE_ENV === "production"
  }
}));

// Setup Passport
app.use(passport.initialize());
app.use(passport.session());

// Local authentication strategy
passport.use('local', 
  new LocalStrategy(async (username, password, done) => {
    try {
      const user = await getUserByUsername(username);
      if (!user || !(await comparePasswords(password, user.password))) {
        return done(null, false, { message: "Invalid username or password" });
      }
      
      if (user.status !== "Active") {
        return done(null, false, { message: "Your account is not active. Please contact the administrator." });
      }
      
      return done(null, user);
    } catch (error) {
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

// LDAP authentication strategy
passport.use('ldap', 
  new LDAPStrategy(LDAP_CONFIG, async (user, done) => {
    try {
      // Extract user information from LDAP response
      const username = user.uid || user.sAMAccountName;
      const email = user.mail || user.email;
      const name = user.cn || user.displayName || 'LDAP User';
      
      if (!username || !email) {
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
          departmentId: holdDepartmentId,
          preferredLanguage: 'ar', // Default to Arabic
          isActive: true
        });
        
        return done(null, newUser);
      }
      
      // Existing user
      return done(null, existingUser);
      
    } catch (error) {
      console.error('LDAP authentication error:', error);
      return done(error);
    }
  })
);

passport.serializeUser((user, done) => done(null, user.id));
passport.deserializeUser(async (id, done) => {
  try {
    const result = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
    done(null, result.rows[0]);
  } catch (error) {
    done(error);
  }
});

// Routes
app.get('/test', (req, res) => {
  res.send('Server is working!');
});

app.get('/db-test', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW()');
    res.json({ success: true, time: result.rows[0].now });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/login', (req, res, next) => {
  // Try LDAP authentication first
  passport.authenticate("ldap", { session: false }, (ldapErr, ldapUser, ldapInfo) => {
    if (ldapUser) {
      // LDAP authentication succeeded
      console.log("LDAP Authentication successful for user:", ldapUser.username);
      req.login(ldapUser, (loginErr) => {
        if (loginErr) {
          console.error("Session login error:", loginErr);
          return res.status(500).json({ message: "Failed to establish session" });
        }
        return res.status(200).json(ldapUser);
      });
    } else {
      // LDAP authentication failed, try local authentication
      passport.authenticate("local", (err, user, info) => {
        console.log("Local authentication attempt:", req.body.username);
        
        if (err) {
          console.error("Login error:", err);
          return res.status(401).json({ message: "Invalid username or password" });
        }
        if (!user) {
          console.log("Authentication failed:", info.message);
          return res.status(401).json({ message: info.message || "Authentication failed" });
        }
        
        console.log("Local authentication successful for user:", user.id);
        req.login(user, (loginErr) => {
          if (loginErr) {
            console.error("Session login error:", loginErr);
            return res.status(500).json({ message: "Failed to establish session" });
          }
          console.log("Session established for user:", user.id);
          return res.status(200).json(user);
        });
      })(req, res, next);
    }
  })(req, res, next);
});

app.post('/api/logout', (req, res, next) => {
  req.logout((err) => {
    if (err) return next(err);
    res.sendStatus(200);
  });
});

app.get('/api/user', (req, res) => {
  if (req.isAuthenticated()) {
    return res.json(req.user);
  }
  return res.status(401).json({ message: "Not authenticated" });
});

// Simple route to display LDAP configuration
app.get('/api/ldap-config', (req, res) => {
  // Only show non-sensitive information
  res.json({
    url: process.env.LDAP_URL || 'ldap://localhost:389',
    bindDN: process.env.LDAP_BIND_DN || 'cn=admin,dc=example,dc=com',
    searchBase: process.env.LDAP_SEARCH_BASE || 'ou=users,dc=example,dc=com',
    searchFilter: process.env.LDAP_SEARCH_FILTER || '(uid={{username}})'
  });
});

// Start server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
  console.log('Available routes:');
  console.log(`- GET http://localhost:${port}/test`);
  console.log(`- GET http://localhost:${port}/db-test`);
  console.log(`- POST http://localhost:${port}/api/login`);
  console.log(`- POST http://localhost:${port}/api/logout`);
  console.log(`- GET http://localhost:${port}/api/user`);
  console.log(`- GET http://localhost:${port}/api/ldap-config`);
}); 