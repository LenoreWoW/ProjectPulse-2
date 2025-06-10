import { Express, Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';

declare global {
  namespace Express {
    interface User {
      id: number;
      name: string;
      email: string;
      phone?: string | null;
      username: string;
      password: string;
      role?: string | null;
      status?: string | null;
      departmentid?: number | null;
      passportImage?: string | null;
      idCardImage?: string | null;
      language?: string | null;
      lastlogin?: Date | null;
      createdat: Date;
      updatedat: Date;
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