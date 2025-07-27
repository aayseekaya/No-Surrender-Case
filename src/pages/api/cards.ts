import { NextApiRequest, NextApiResponse } from 'next';
import connectDB, { UserModel, CardModel } from '@/lib/database';
import { CARD_TYPES, getCardDescription } from '@/lib/cardData';

interface CardsResponse {
  cards: any[];
  success: boolean;
  message?: string;
}

interface ApiError {
  message: string;
  code: string;
  status: number;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<CardsResponse | ApiError>
) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-user-id');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
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

    // Get existing cards for user
    let cards = await CardModel.find({ userId: user._id });

    // If no cards exist, create default cards
    if (cards.length === 0) {
      const defaultCards = CARD_TYPES.map((type, index) => ({
        name: type === 'uzun_kilic' ? 'Uzun Kılıç' :
              type === 'savas_baltasi' ? 'Savaş Baltası' :
              type === 'buyu_asasi' ? 'Büyü Asası' :
              type === 'kalkan' ? 'Kalkan' :
              type === 'savas_cekici' ? 'Savaş Çekici' :
              type === 'egri_kilic' ? 'Eğri Kılıç' :
              type === 'kisa_kilic' ? 'Kısa Kılıç' :
              'Büyü Kitabı',
        description: getCardDescription(type, 1),
        level: 1,
        progress: 0,
        image: `/images/${type}_1.png`,
        type: type,
        userId: user._id,
      }));

      cards = await CardModel.insertMany(defaultCards);
    }

    // Transform cards to match frontend expectations and sort by CARD_TYPES order
    const transformedCards = cards
      .map(card => ({
        id: card._id.toString(),
        name: card.name,
        description: card.description,
        level: card.level,
        progress: card.progress,
        image: card.image,
        type: card.type,
        createdAt: card.createdAt,
        updatedAt: card.updatedAt,
      }))
      .sort((a, b) => {
        const aIndex = CARD_TYPES.indexOf(a.type as any);
        const bIndex = CARD_TYPES.indexOf(b.type as any);
        return aIndex - bIndex;
      });

    const response: CardsResponse = {
      cards: transformedCards,
      success: true,
    };

    return res.status(200).json(response);

  } catch (error) {
    console.error('Cards API error:', error);
    return res.status(500).json({
      message: 'Internal server error',
      code: 'INTERNAL_ERROR',
      status: 500,
    });
  }
} 