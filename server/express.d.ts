import { Express, Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';

declare global {
  namespace Express {
    interface User {
      id: number;
      name: string;
      email: string;
      roles: string[];
      departmentId?: number;
      preferredLanguage?: string;
    }
  }
}

export type AuthHandler = (
  req: Request,
  res: Response,
  next: NextFunction
) => Response<any, Record<string, any>> | void | Promise<Response<any, Record<string, any>> | void | undefined>;

export type ValidateBodyMiddleware = (schema: ZodSchema<any>) => 
  (req: Request, res: Response, next: NextFunction) => void | Response<any, Record<string, any>> | undefined;

export type HasAuthMiddleware = (handler: AuthHandler) => 
  (req: Request, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | void | undefined>;

export type HasRoleMiddleware = (roles: string[]) => 
  (req: Request, res: Response, next: NextFunction) => void | Response<any, Record<string, any>> | undefined; 