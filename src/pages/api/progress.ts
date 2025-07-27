import { NextApiRequest, NextApiResponse } from 'next';
import { ProgressResponse, ApiError } from '@/types';
import connectDB from '@/lib/database';
import { CardModel, UserModel } from '@/lib/database';
import { getCardDescription } from '@/lib/cardData';
import { updateCardProgressWithTransaction } from '@/lib/transactions';

export default async function handler(
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

    // Check if user has enough energy
    if (user.energy < 1) {
      return res.status(400).json({
        message: 'Insufficient energy',
        code: 'INSUFFICIENT_ENERGY',
        status: 400,
      });
    }

    // Use transaction for atomic updates
    const result = await updateCardProgressWithTransaction(
      cardId,
      user._id.toString(),
      2, // progress increase
      1  // energy cost
    );

    if (!result.success) {
      return res.status(500).json({
        message: result.error || 'Transaction failed',
        code: 'TRANSACTION_FAILED',
        status: 500,
      });
    }

    const { card: updatedCard, user: updatedUser } = result.data!;

    const isLevelUp = updatedCard.progress === 0 && card.progress < 100;
    
    const response: ProgressResponse = {
      progress: updatedCard.progress,
      energy: updatedUser.energy,
      level: updatedCard.level,
      success: true,
      message: isLevelUp ? 'Card leveled up!' : 'Progress updated successfully',
    };

    return res.status(200).json(response);

  } catch (error) {
    console.error('Progress API error:', error);
    return res.status(500).json({
      message: 'Internal server error',
      code: 'INTERNAL_ERROR',
      status: 500,
    });
  }
} 