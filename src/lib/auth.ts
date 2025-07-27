import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { NextApiRequest, NextApiResponse } from 'next';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const JWT_EXPIRES_IN = '7d';

export interface JWTPayload {
  userId: string;
  username: string;
  email: string;
  iat?: number;
  exp?: number;
}

export function generateToken(payload: Omit<JWTPayload, 'iat' | 'exp'>): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

export function verifyToken(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload;
  } catch (error) {
    return null;
  }
}

export function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export function comparePassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}

export function getTokenFromRequest(req: NextApiRequest): string | null {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  return null;
}

export function authenticateRequest(req: NextApiRequest, res: NextApiResponse): JWTPayload | null {
  const token = getTokenFromRequest(req);
  
  if (!token) {
    res.status(401).json({
      message: 'Authentication token required',
      code: 'AUTH_TOKEN_MISSING',
      status: 401,
    });
    return null;
  }

  const payload = verifyToken(token);
  
  if (!payload) {
    res.status(401).json({
      message: 'Invalid or expired token',
      code: 'AUTH_TOKEN_INVALID',
      status: 401,
    });
    return null;
  }

  return payload;
}

export function withAuth(handler: (req: NextApiRequest, res: NextApiResponse, user: JWTPayload) => Promise<void>) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    const user = authenticateRequest(req, res);
    
    if (!user) {
      return; // Response already sent by authenticateRequest
    }

    return handler(req, res, user);
  };
} 