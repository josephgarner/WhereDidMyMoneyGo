import { Request, Response, NextFunction } from 'express';
import { User } from '@finances/shared';

declare module 'express-session' {
  interface SessionData {
    user?: User;
    codeVerifier?: string;
    state?: string;
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.session.user) {
    return res.status(401).json({
      success: false,
      error: 'Unauthorized',
      message: 'You must be logged in to access this resource',
    });
  }
  next();
}

export function attachUser(req: Request, res: Response, next: NextFunction) {
  // User is already attached via session
  // This middleware can be extended to add additional user context
  next();
}
