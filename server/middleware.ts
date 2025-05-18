import { NextFunction, Request, Response } from "express";
import { AnyZodObject, ZodError, ZodType } from "zod";

/**
 * Middleware to validate request body against a Zod schema
 * Returns detailed error messages on validation failure
 */
export function validateBody(schema: ZodType<any, any, any>) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Log the incoming request body for debugging
      console.log("Validating request body:", JSON.stringify(req.body, null, 2));
      
      // Perform the validation
      const validatedData = await schema.parseAsync(req.body);
      
      // Replace the request body with the validated data
      req.body = validatedData;
      
      // Validation passed, continue to the route handler
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        // Format Zod error messages for more detailed feedback
        const errors = error.errors.map(err => ({
          path: err.path.join('.'),
          message: err.message,
          code: err.code
        }));
        
        console.error("Validation errors:", JSON.stringify(errors, null, 2));
        
        return res.status(400).json({
          message: "Validation failed",
          errors
        });
      }
      
      // Pass other errors to the next error handler
      next(error);
    }
  };
}

/**
 * Error handling middleware that provides consistent error responses
 */
export function errorHandler(err: any, req: Request, res: Response, next: NextFunction) {
  console.error(`Error processing ${req.method} ${req.path}:`, err);
  
  // If response is already sent, skip to next middleware
  if (res.headersSent) {
    return next(err);
  }
  
  // Handle different types of errors
  if (err instanceof ZodError) {
    const errors = err.errors.map(error => ({
      path: error.path.join('.'),
      message: error.message,
      code: error.code
    }));
    
    return res.status(400).json({
      message: "Validation failed",
      errors
    });
  }
  
  // Handle known error types with status codes
  if (err.statusCode) {
    return res.status(err.statusCode).json({
      message: err.message || "An error occurred",
      errors: err.errors || []
    });
  }
  
  // Default error response
  res.status(500).json({
    message: process.env.NODE_ENV === 'production' 
      ? "Internal server error" 
      : err.message || "Internal server error",
    stack: process.env.NODE_ENV === 'production' ? undefined : err.stack
  });
}

/**
 * Create a custom error with status code
 */
export class AppError extends Error {
  statusCode: number;
  errors?: any[];
  
  constructor(message: string, statusCode: number = 500, errors?: any[]) {
    super(message);
    this.statusCode = statusCode;
    this.errors = errors;
    
    // Maintain proper stack trace
    Error.captureStackTrace(this, this.constructor);
  }
} 