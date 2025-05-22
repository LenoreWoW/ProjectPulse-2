import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
// @ts-ignore - Ignoring the default import issue for passport-ldapauth
import { Strategy as LDAPStrategy } from "passport-ldapauth";
import { Express, Request, Response, NextFunction } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
// @ts-ignore - Ignoring missing type declarations for jsonwebtoken
import jwt from "jsonwebtoken";
import { storage } from "./storage";
import { User as SelectUser, insertUserSchema, InsertUser } from "@shared/schema";
import { z } from "zod";
import { sendRegistrationAcceptedEmail, sendRegistrationRejectedEmail } from "./email";

declare global {
  namespace Express {
    interface User extends SelectUser {
      role?: string; // Adding role to match the actual usage
      status?: string; // Adding status to match the actual usage
    }
  }
}

const JWT_SECRET = process.env.JWT_SECRET || "pmo-jwt-secret-key";
const scryptAsync = promisify(scrypt);

// Define JWT payload interface
interface JwtPayload {
  id: number;
  role: string | null;
  iat?: number;
  exp?: number;
}

// Generate JWT token for authentication
export function generateAuthToken(userId: number, role: string | null): string {
  return jwt.sign(
    { id: userId, role },
    JWT_SECRET,
    { expiresIn: '24h' }
  );
}

// JWT token middleware
export function authenticateToken(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: "Unauthorized: No token provided" });
  }

  jwt.verify(token, JWT_SECRET, async (err: any, decoded: object | undefined) => {
    if (err) {
      return res.status(403).json({ message: "Forbidden: Invalid token" });
    }

    try {
      const payload = decoded as JwtPayload;
      const user = await storage.getUser(payload.id);
      if (!user) {
        return res.status(403).json({ message: "Forbidden: User not found" });
      }

      // Add user to request object
      (req as any).user = user;
      next();
    } catch (error) {
      return res.status(500).json({ message: "Internal server error" });
    }
  });
}

// Hash password with scrypt
export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const derivedKey = (await scryptAsync(password, salt, 64)) as Buffer;
  return salt + "." + derivedKey.toString("hex");
}

// Compare a password with a hash
export async function comparePasswords(
  providedPassword: string,
  storedHash: string
): Promise<boolean> {
  const [salt, key] = storedHash.split(".");
  const derivedKey = (await scryptAsync(providedPassword, salt, 64)) as Buffer;
  const keyBuffer = Buffer.from(key, "hex");
  return timingSafeEqual(derivedKey, keyBuffer);
}

// Authentication middleware
export function isAuthenticated(req: Request, res: Response, next: NextFunction) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ message: "Unauthorized" });
}

// Role-based access control middleware
export function hasRole(allowedRoles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    const user = req.user as Express.User;
    
    if (!user.role || !allowedRoles.includes(user.role)) {
      return res.status(403).json({ message: "Forbidden: Insufficient permissions" });
    }
    
    next();
  };
}

// Enhanced registration schema with extra validation
const registerSchema = insertUserSchema.extend({
  email: z.string()
    .email("Invalid email address")
    .refine(email => {
      // Verify that the email domain is from Qatar Armed Forces or Ministry of Defense
      const domain = email.split('@')[1].toLowerCase();
      return domain === 'qaf.mil.qa' || domain === 'mod.gov.qa';
    }, {
      message: "Only email addresses from @qaf.mil.qa or @mod.gov.qa domains are allowed",
    }),
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string(),
  name: z.string().min(2, "Name must be at least 2 characters"),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

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

// Function to ensure Hold department exists
async function ensureHoldDepartmentExists(): Promise<number> {
  try {
    // Check if Hold department exists using the new method
    const holdDepartment = await storage.getDepartmentByName("Hold");
    
    if (holdDepartment) {
      return holdDepartment.id;
    }
    
    // Create Hold department if it doesn't exist
    const newDepartment = await storage.createDepartment({
      name: "Hold",
      description: "Temporary department for new LDAP users",
      isActive: true
    });
    
    return newDepartment.id;
  } catch (error) {
    console.error("Error ensuring Hold department exists:", error);
    throw error;
  }
}

export function setupAuth(app: Express) {
  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET || "pmo-projects-secret-key",
    resave: false,
    saveUninitialized: false,
    store: storage.sessionStore,
    cookie: {
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      secure: process.env.NODE_ENV === "production",
    }
  };

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  // Local authentication strategy
  passport.use('local', 
    new LocalStrategy(async (username, password, done) => {
      try {
        const user = await storage.getUserByUsername(username);
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
    }),
  );
  
  // LDAP authentication strategy
  passport.use('ldap', 
    new LDAPStrategy(LDAP_CONFIG, async (user: any, done: any) => {
      try {
        // Extract user information from LDAP response
        const username = user.uid || user.sAMAccountName;
        const email = user.mail || user.email;
        const name = user.cn || user.displayName || 'LDAP User';
        
        if (!username || !email) {
          return done(null, false, { message: "Missing required user information from LDAP" });
        }
        
        // Check if user already exists in our system
        let existingUser = await storage.getUserByUsername(username);
        
        if (!existingUser) {
          // First-time LDAP login, create user in our system
          console.log(`Creating new user from LDAP: ${username}`);
          
          // Ensure Hold department exists
          const holdDepartmentId = await ensureHoldDepartmentExists();
          
          // Create user with Hold department and User role
          const hashedPassword = await hashPassword(randomBytes(16).toString('hex'));
          const newUser = await storage.createUser({
            username,
            email,
            name,
            password: hashedPassword,
            roles: ['User'], // Using roles array instead of role string
            status: 'Active',
            departmentId: holdDepartmentId,
            preferredLanguage: 'ar', // Default to Arabic
            isActive: true
          } as InsertUser);
          
          return done(null, newUser);
        }
        
        // Existing user, update last login time if needed
        // Note: You might want to add a lastLogin field to your user schema
        return done(null, existingUser);
        
      } catch (error) {
        console.error('LDAP authentication error:', error);
        return done(error);
      }
    })
  );

  passport.serializeUser((user, done) => done(null, user.id));
  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (error) {
      done(error);
    }
  });

  app.post("/api/register", async (req, res, next) => {
    try {
      // Parse and validate the request data
      const validatedData = registerSchema.parse(req.body);
      
      // Check if username or email already exists
      const existingUserByUsername = await storage.getUserByUsername(validatedData.username);
      if (existingUserByUsername) {
        // Send rejection email
        await sendRegistrationRejectedEmail(validatedData.email);
        return res.status(400).json({ message: "Username already exists" });
      }
      
      const existingUserByEmail = await storage.getUserByEmail(validatedData.email);
      if (existingUserByEmail) {
        // Send rejection email
        await sendRegistrationRejectedEmail(validatedData.email);
        return res.status(400).json({ message: "Email already exists" });
      }
      
      // Verify email domain
      const emailDomain = validatedData.email.split('@')[1].toLowerCase();
      if (emailDomain !== 'qaf.mil.qa' && emailDomain !== 'mod.gov.qa') {
        // Send rejection email for unauthorized domain
        await sendRegistrationRejectedEmail(validatedData.email);
        return res.status(400).json({ 
          message: "Only email addresses from @qaf.mil.qa or @mod.gov.qa domains are allowed" 
        });
      }
      
      // Create the user with hashed password
      const userData = {
        ...validatedData,
        password: await hashPassword(validatedData.password),
        status: "Active" as const, // Set user as active (could be set to Pending for admin approval)
      };
      
      // Remove the confirmPassword field before saving
      delete (userData as any).confirmPassword;
      
      const user = await storage.createUser(userData);
      
      // Send acceptance email
      await sendRegistrationAcceptedEmail(user.email);
      
      // Auto-login after registration
      req.login(user, (err) => {
        if (err) return next(err);
        res.status(201).json(user);
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        // Handle validation errors, including email domain check
        // Send rejection email if validation failed
        if (req.body.email) {
          await sendRegistrationRejectedEmail(req.body.email);
        }
        
        return res.status(400).json({ 
          message: "Validation failed", 
          errors: error.errors 
        });
      }
      next(error);
    }
  });

  app.post("/api/login", (req, res, next) => {
    // Try LDAP authentication first
    passport.authenticate("ldap", { session: false }, (ldapErr: Error, ldapUser: Express.User | false, ldapInfo: { message: string }) => {
      if (ldapUser) {
        // LDAP authentication succeeded
        console.log("LDAP Authentication successful for user:", (ldapUser as any).username);
        req.login(ldapUser, (loginErr) => {
          if (loginErr) {
            console.error("Session login error:", loginErr);
            return res.status(500).json({ message: "Failed to establish session" });
          }
          return res.status(200).json(ldapUser);
        });
      } else {
        // LDAP authentication failed, try local authentication
        passport.authenticate("local", (err: Error, user: Express.User | false, info: { message: string }) => {
          console.log("Local authentication attempt:", req.body.username);
          
          if (err) {
            console.error("Login error:", err);
            return res.status(401).json({ message: "Invalid username or password" });
          }
          if (!user) {
            console.log("Authentication failed:", info.message);
            return res.status(401).json({ message: info.message || "Authentication failed" });
          }
          
          console.log("Local authentication successful for user:", (user as any).id);
          req.login(user, (loginErr) => {
            if (loginErr) {
              console.error("Session login error:", loginErr);
              return res.status(500).json({ message: "Failed to establish session" });
            }
            console.log("Session established for user:", (user as any).id);
            return res.status(200).json(user);
          });
        })(req, res, next);
      }
    })(req, res, next);
  });

  app.post("/api/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.sendStatus(200);
    });
  });

  app.get("/api/user", (req, res) => {
    if (req.isAuthenticated()) {
      return res.json(req.user);
    }
    return res.status(401).json({ message: "Not authenticated" });
  });
  
  // Update user profile
  app.put("/api/user", async (req, res, next) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    
    try {
      const updateData = req.body;
      
      // Don't allow updating role or status from this endpoint
      delete updateData.role;
      delete updateData.status;
      
      // If password is being updated, hash it
      if (updateData.password) {
        updateData.password = await hashPassword(updateData.password);
      }
      
      const updatedUser = await storage.updateUser(req.user.id, updateData);
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      res.json(updatedUser);
    } catch (error) {
      next(error);
    }
  });
  
  // Admin endpoint to update user roles/status
  app.put("/api/users/:id", async (req, res, next) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    
    if (req.user.role !== "Administrator" && 
        req.user.role !== "MainPMO" && 
        req.user.role !== "DepartmentDirector") {
      return res.status(403).json({ message: "Forbidden: Insufficient permissions" });
    }
    
    try {
      const userId = parseInt(req.params.id);
      const updateData = req.body;
      
      // Department Directors can only update users in their department
      if (req.user.role === "DepartmentDirector") {
        const user = await storage.getUser(userId);
        if (!user || user.departmentId !== req.user.departmentId) {
          return res.status(403).json({ message: "Forbidden: User is not in your department" });
        }
        
        // Department Directors cannot promote to Admin or MainPMO
        if (updateData.role === "Administrator" || updateData.role === "MainPMO") {
          return res.status(403).json({ message: "Forbidden: Cannot assign this role" });
        }
      }
      
      const updatedUser = await storage.updateUser(userId, updateData);
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      res.json(updatedUser);
    } catch (error) {
      next(error);
    }
  });
}
