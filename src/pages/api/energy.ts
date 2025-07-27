import { NextApiRequest, NextApiResponse } from 'next';
import { EnergyResponse, ApiError } from '@/types';
import connectDB from '@/lib/database';
import { UserModel } from '@/lib/database';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<EnergyResponse | ApiError>
) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,DELETE,PATCH,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, x-user-id');

  // Handle preflight request
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'GET') {
    return res.status(405).json({
      message: 'Method not allowed',
      code: 'METHOD_NOT_ALLOWED',
      status: 405,
    });
  }

  try {
    // Connect to MongoDB
    await connectDB();

    const userId = req.headers['x-user-id'] as string || 'demo-user';

    // Get or create user
    let user = await UserModel.findOne({ username: userId });
    if (!user) {
      user = await UserModel.create({
        username: userId,
        email: `${userId}@demo.com`,
        energy: 100,
        maxEnergy: 100,
        lastEnergyRegeneration: new Date(),
      });
    }

    // Calculate energy regeneration (1 energy per 2 minutes)
    const now = new Date();
    const timeDiff = now.getTime() - user.lastEnergyRegeneration.getTime();
    const minutesPassed = timeDiff / (1000 * 60); // Convert to minutes with decimals
    const energyGained = Math.floor(minutesPassed / 2); // 1 energy per 2 minutes

    // Update energy (max 100)
    const oldEnergy = user.energy;
    user.energy = Math.min(100, user.energy + energyGained);

    // Update last regeneration time only if energy was actually gained
    if (energyGained > 0) {
      user.lastEnergyRegeneration = now;
    }

    // Save changes
    await user.save();

    // Calculate regeneration time - simple countdown from 120 seconds
    const secondsSinceLastRegeneration = Math.floor(timeDiff / 1000);
    const regenerationTime = Math.max(0, 120 - (secondsSinceLastRegeneration % 120)); // 120 seconds = 2 minutes

    const response: EnergyResponse = {
      energy: user.energy,
      regenerationTime,
      regenerationRate: 1, // 1 energy per 2 minutes
      success: true,
    };

    return res.status(200).json(response);

  } catch (error) {
    console.error('Energy API error:', error);
    return res.status(500).json({
      message: 'Internal server error',
      code: 'INTERNAL_ERROR',
      status: 500,
    });
  }
} 