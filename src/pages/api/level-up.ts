import { NextApiRequest, NextApiResponse } from 'next';
import { LevelUpResponse, ApiError } from '@/types';
import connectDB from '@/lib/database';
import { CardModel, UserModel } from '@/lib/database';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<LevelUpResponse | ApiError>
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

    const { cardId } = req.body;
    const userId = req.headers['x-user-id'] as string || 'demo-user';

    if (!cardId) {
      return res.status(400).json({
        message: 'Card ID is required',
        code: 'MISSING_CARD_ID',
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

    // Check if card is ready for level up
    if (card.progress < 100) {
      return res.status(400).json({
        message: 'Card progress must be 100% to level up',
        code: 'INSUFFICIENT_PROGRESS',
        status: 400,
      });
    }

    // Check if card is at max level
    if (card.level >= 3) {
      return res.status(400).json({
        message: 'Card is already at maximum level',
        code: 'MAX_LEVEL_REACHED',
        status: 400,
      });
    }

    // Level up the card
    card.level = Math.min(3, card.level + 1);
    card.progress = 0;
    // Update image based on new level
    card.image = `/images/${card.type}_${card.level}.png`;

    // Save changes
    await card.save();

    const response: LevelUpResponse = {
      level: card.level,
      progress: card.progress,
      success: true,
      message: `Card leveled up to level ${card.level}!`,
    };

    return res.status(200).json(response);

  } catch (error) {
    console.error('Level Up API error:', error);
    return res.status(500).json({
      message: 'Internal server error',
      code: 'INTERNAL_ERROR',
      status: 500,
    });
  }
} 