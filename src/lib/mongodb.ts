// src/lib/mongodb.ts
import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI!;

if (!MONGODB_URI) {
  throw new Error("⚠️ Defina MONGODB_URI no .env.local");
}

let isConnected = false;

export const connectDB = async () => {
  if (isConnected) return;

  try {
    const db = await mongoose.connect(MONGODB_URI);
    isConnected = true;
    console.log('✅ MongoDB conectado com sucesso');
    return db;
  } catch (err) {
    console.error('❌ Erro ao conectar ao MongoDB:', err);
    throw err;
  }
};
