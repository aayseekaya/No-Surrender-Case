import mongoose from 'mongoose';
import { UserModel, CardModel } from './database';

export interface TransactionResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

export async function withTransaction<T>(
  operation: (session: mongoose.ClientSession) => Promise<T>
): Promise<TransactionResult<T>> {
  const session = await mongoose.startSession();
  
  try {
    session.startTransaction();
    
    const result = await operation(session);
    
    await session.commitTransaction();
    
    return {
      success: true,
      data: result,
    };
  } catch (error) {
    await session.abortTransaction();
    
    console.error('Transaction failed:', error);
    
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  } finally {
    session.endSession();
  }
}

export async function updateCardProgressWithTransaction(
  cardId: string,
  userId: string,
  progressIncrease: number,
  energyCost: number
): Promise<TransactionResult<{ card: any; user: any }>> {
  return withTransaction(async (session) => {
    // Get card and user in transaction
    const card = await CardModel.findOne({ _id: cardId, userId }, null, { session });
    const user = await UserModel.findOne({ _id: userId }, null, { session });
    
    if (!card || !user) {
      throw new Error('Card or user not found');
    }
    
    // Check energy
    if (user.energy < energyCost) {
      throw new Error('Insufficient energy');
    }
    
    // Calculate new progress
    const newProgress = Math.min(100, card.progress + progressIncrease);
    const isLevelUp = newProgress >= 100 && card.progress < 100;
    
    // Update card
    card.progress = isLevelUp ? 0 : newProgress;
    
    if (isLevelUp) {
      card.level = Math.min(3, card.level + 1);
      card.image = `/images/${card.type}_${card.level}.png`;
      // Note: description update would need getCardDescription import
    }
    
    // Update user energy (only if not leveling up)
    if (!isLevelUp) {
      user.energy = Math.max(0, user.energy - energyCost);
    }
    
    // Save both documents
    await card.save({ session });
    await user.save({ session });
    
    return { card, user };
  });
}

export async function createUserWithCardsWithTransaction(
  username: string,
  email: string,
  cardTypes: string[]
): Promise<TransactionResult<{ user: any; cards: any[] }>> {
  return withTransaction(async (session) => {
    // Create user
    const user = await UserModel.create([{
      username,
      email,
      energy: 100,
      maxEnergy: 100,
      lastEnergyRegeneration: new Date(),
    }], { session });
    
    // Create cards
    const cards = await CardModel.create(
      cardTypes.map((type, index) => ({
        name: type === 'uzun_kilic' ? 'Uzun Kılıç' :
              type === 'savas_baltasi' ? 'Savaş Baltası' :
              type === 'buyu_asasi' ? 'Büyü Asası' :
              type === 'kalkan' ? 'Kalkan' :
              type === 'savas_cekici' ? 'Savaş Çekici' :
              type === 'egri_kilic' ? 'Eğri Kılıç' :
              type === 'kisa_kilic' ? 'Kısa Kılıç' :
              'Büyü Kitabı',
        description: 'Gümüş Diş - Sade, keskin bir savaş kılıcı.',
        level: 1,
        progress: 0,
        image: `/images/${type}_1.png`,
        type: type,
        userId: user[0]._id,
      })),
      { session }
    );
    
    return { user: user[0], cards };
  });
} 