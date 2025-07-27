import { NextApiRequest, NextApiResponse } from 'next';
import connectDB, { UserModel } from '@/lib/database';
import { generateToken, comparePassword } from '@/lib/auth';

interface LoginRequest {
  username: string;
  password: string;
}

interface LoginResponse {
  success: boolean;
  token?: string;
  user?: {
    id: string;
    username: string;
    email: string;
  };
  message?: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<LoginResponse>
) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      message: 'Method not allowed',
    });
  }

  try {
    await connectDB();

    const { username, password }: LoginRequest = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Username and password are required',
      });
    }

    // Find user
    const user = await UserModel.findOne({ username });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
    }

    // Check if user has password (for demo users, we'll create a default password)
    if (!user.password) {
      // For demo purposes, create a default password
      user.password = await require('bcryptjs').hash('demo123', 12);
      await user.save();
    }

    // Verify password
    const isValidPassword = await comparePassword(password, user.password);

    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
    }

    // Generate JWT token
    const token = generateToken({
      userId: user._id.toString(),
      username: user.username,
      email: user.email,
    });

    return res.status(200).json({
      success: true,
      token,
      user: {
        id: user._id.toString(),
        username: user.username,
        email: user.email,
      },
    });

  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
} 