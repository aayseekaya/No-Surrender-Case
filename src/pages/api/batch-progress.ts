import { NextApiRequest, NextApiResponse } from 'next';
import { ProgressResponse, ApiError } from '@/types';
import { withSecurity, DEFAULT_SECURITY_CONFIG } from '@/lib/security';
import connectDB from '@/lib/database';
import { CardModel, UserModel } from '@/lib/database';
import { getCardDescription } from '@/lib/cardData';

async function batchProgressHandler(
  req: NextApiRequest,
  res: NextApiResponse<ProgressResponse | ApiError>
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

  if (req.method !== 'POST') {
    return res.status(405).json({
      message: 'Method not allowed',
      code: 'METHOD_NOT_ALLOWED',
      status: 405,
    });
  }

  try {
    // Connect to MongoDB
    await connectDB();

    const { cardId, clicks = 1 } = req.body;
    const userId = req.headers['x-user-id'] as string || 'demo-user';

    // Additional validation for batch clicks
    if (clicks > DEFAULT_SECURITY_CONFIG.maxBatchClicks) {
      return res.status(400).json({
        message: `Maximum ${DEFAULT_SECURITY_CONFIG.maxBatchClicks} clicks allowed per request`,
        code: 'BATCH_LIMIT_EXCEEDED',
        status: 400,
      });
    }

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

    // Get or create card
    let card = await CardModel.findOne({ _id: cardId, userId: user._id });
    if (!card) {
      // Create a demo card if not found
      card = await CardModel.create({
        name: 'Demo Card',
        description: 'Demo card for testing',
        level: 1,
        progress: 0,
        image: '/images/uzun_kilic_1.png',
        type: 'uzun_kilic',
        userId: user._id,
      });
    }

    // Check if user has enough energy
    if (user.energy < clicks) {
      return res.status(400).json({
        message: `Insufficient energy. Need ${clicks}, have ${user.energy}`,
        code: 'INSUFFICIENT_ENERGY',
        status: 400,
      });
    }

    // Calculate new progress (2% per click)
    const progressIncrease = clicks * 2;
    const newProgress = Math.min(100, card.progress + progressIncrease);
    const isLevelUp = newProgress >= 100 && card.progress < 100;

    // Update progress
    card.progress = isLevelUp ? 0 : newProgress;

    // Update level if leveling up
    if (isLevelUp) {
      card.level = Math.min(3, card.level + 1);
      // Update image and description based on new level
      card.image = `/images/${card.type}_${card.level}.png`;
      card.description = getCardDescription(card.type, card.level);
    }

    // Update energy (only if not leveling up)
    if (!isLevelUp) {
      user.energy = Math.max(0, user.energy - clicks);
    }

    // Save changes
    await card.save();
    await user.save();

    const response: ProgressResponse = {
      progress: card.progress,
      energy: user.energy,
      level: card.level,
      success: true,
      message: isLevelUp 
        ? `Card leveled up! Used ${clicks} clicks.` 
        : `Progress updated! Used ${clicks} clicks.`,
    };

    return res.status(200).json(response);

  } catch (error) {
    console.error('Batch Progress API error:', error);
    return res.status(500).json({
      message: 'Internal server error',
      code: 'INTERNAL_ERROR',
      status: 500,
    });
  }
}

// Export with security middleware
export default withSecurity(batchProgressHandler, {
  ...DEFAULT_SECURITY_CONFIG,
  maxRequestsPerMinute: 120, // Higher limit for batch operations
  cooldownPeriod: 50, // Shorter cooldown for better UX
}); 