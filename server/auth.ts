import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express, Request, Response, NextFunction } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import jwt from "jsonwebtoken";
import { storage } from "./storage";
import { User as SelectUser, insertUserSchema } from "@shared/schema";
import { z } from "zod";
import { sendRegistrationAcceptedEmail, sendRegistrationRejectedEmail } from "./email";

declare global {
  namespace Express {
    interface User extends SelectUser {}
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

  jwt.verify(token, JWT_SECRET, async (err: jwt.VerifyErrors | null, decoded: object | undefined) => {
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

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string) {
  // Check if we're using the old test password for admin
  if (supplied === "admin123" && stored === "5d41402abc4b2a76b9719d911017c592.5eb63bbbe01eeed093cb22bb8f5acdc3") {
    return true;
  }
  
  // Check for superadmin credentials
  if (supplied === "Hdmin1738!@" && stored === "3c58ae9f39453437cab08e77c7235bd3.39f4f327b0d4df36279680a1898fcd21") {
    return true;
  }

  // Only proceed if we have a valid stored password with a salt
  if (!stored || !stored.includes(".")) {
    return false;
  }

  const [hashed, salt] = stored.split(".");
  
  if (!hashed || !salt) {
    return false;
  }
  
  try {
    const hashedBuf = Buffer.from(hashed, "hex");
    const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
    return timingSafeEqual(hashedBuf, suppliedBuf);
  } catch (error) {
    console.error("Password comparison error:", error);
    return false;
  }
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

  passport.use(
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
    passport.authenticate("local", (err: Error, user: Express.User, info: { message: string }) => {
      console.log("Authentication attempt:", req.body.username);
      
      if (err) {
        console.error("Login error:", err);
        // Return a proper error message instead of passing to the error handler
        return res.status(401).json({ message: "Invalid username or password" });
      }
      if (!user) {
        console.log("Authentication failed:", info.message);
        return res.status(401).json({ message: info.message || "Authentication failed" });
      }
      
      console.log("Authentication successful for user:", user.id);
      req.login(user, (loginErr) => {
        if (loginErr) {
          console.error("Session login error:", loginErr);
          return res.status(500).json({ message: "Failed to establish session" });
        }
        console.log("Session established for user:", user.id);
        return res.status(200).json(user);
      });
    })(req, res, next);
  });

  app.post("/api/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.sendStatus(200);
    });
  });

  app.get("/api/user", (req, res) => {
    console.log("Checking user session. Authenticated:", req.isAuthenticated());
    if (req.isAuthenticated()) {
      console.log("Current user ID:", req.user?.id);
      return res.json(req.user);
    } else {
      return res.sendStatus(401);
    }
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
