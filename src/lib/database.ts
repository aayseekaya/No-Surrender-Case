import mongoose from 'mongoose';
import { Card, User } from '@/types';

// Global type declaration
declare global {
  var mongoose: {
    conn: typeof mongoose | null;
    promise: Promise<typeof mongoose> | null;
  };
}

// MongoDB bağlantısı
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/no-surrender';

if (!MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI environment variable');
}

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

async function connectDB() {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
    };

    cached.promise = mongoose.connect(MONGODB_URI, opts).then((mongooseInstance) => {
      return mongooseInstance;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}

// User Schema
const userSchema = new mongoose.Schema<User>({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
  },
  energy: {
    type: Number,
    default: 100,
    min: 0,
    max: 100,
  },
  maxEnergy: {
    type: Number,
    default: 100,
  },
  lastEnergyRegeneration: {
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: true,
});

// Card Schema
const cardSchema = new mongoose.Schema<Card>({
  name: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  level: {
    type: Number,
    default: 1,
    min: 1,
    max: 3,
  },
  progress: {
    type: Number,
    default: 0,
    min: 0,
    max: 100,
  },
  image: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    required: true,
    enum: [
      'uzun_kilic',
      'savas_baltasi',
      'buyu_asasi',
      'kalkan',
      'savas_cekici',
      'egri_kilic',
      'kisa_kilic',
      'buyu_kitabi'
    ],
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
}, {
  timestamps: true,
});

// Indexes for performance
userSchema.index({ email: 1 });
userSchema.index({ username: 1 });
cardSchema.index({ userId: 1, type: 1 });
cardSchema.index({ userId: 1, level: 1 });

// Virtual for energy regeneration
userSchema.virtual('energyInfo').get(function(this: any) {
  const now = new Date();
  const timeDiff = now.getTime() - this.lastEnergyRegeneration.getTime();
  const minutesPassed = Math.floor(timeDiff / (1000 * 60));
  const energyGained = Math.floor(minutesPassed * 1); // 1 energy per minute
  const newEnergy = Math.min(this.maxEnergy, this.energy + energyGained);
  
  return {
    current: newEnergy,
    max: this.maxEnergy,
    regenerationTime: Math.max(0, 60 - (timeDiff % (1000 * 60)) / 1000),
    regenerationRate: 1, // 1 energy per minute
  };
});

export const UserModel = mongoose.models.User || mongoose.model<User>('User', userSchema);
export const CardModel = mongoose.models.Card || mongoose.model<Card>('Card', cardSchema);

export default connectDB; 