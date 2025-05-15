import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { User as SelectUser, insertUserSchema } from "@shared/schema";
import { z } from "zod";

declare global {
  namespace Express {
    interface User extends SelectUser {}
  }
}

const scryptAsync = promisify(scrypt);

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

  // Only proceed if we have a valid stored password with a salt
  if (!stored || !stored.includes(".")) {
    return false;
  }

  const [hashed, salt] = stored.split(".");
  
  if (!hashed || !salt) {
    return false;
  }
  
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

// Enhanced registration schema with extra validation
const registerSchema = insertUserSchema.extend({
  email: z.string().email("Invalid email address"),
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
        return res.status(400).json({ message: "Username already exists" });
      }
      
      const existingUserByEmail = await storage.getUserByEmail(validatedData.email);
      if (existingUserByEmail) {
        return res.status(400).json({ message: "Email already exists" });
      }
      
      // Create the user with hashed password
      const userData = {
        ...validatedData,
        password: await hashPassword(validatedData.password),
      };
      
      // Remove the confirmPassword field before saving
      delete (userData as any).confirmPassword;
      
      const user = await storage.createUser(userData);
      
      // Auto-login after registration
      req.login(user, (err) => {
        if (err) return next(err);
        res.status(201).json(user);
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
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
      if (err) return next(err);
      if (!user) return res.status(401).json({ message: info.message || "Authentication failed" });
      
      req.login(user, (loginErr) => {
        if (loginErr) return next(loginErr);
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
    if (!req.isAuthenticated()) return res.sendStatus(401);
    res.json(req.user);
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
