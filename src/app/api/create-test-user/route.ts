// src/app/api/test-mongodb/route.ts
import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';

export async function GET() {
  try {
    console.log('🔍 API: Testando conexão MongoDB...');
    
    // Testar conexão
    const { db } = await connectDB();
    console.log('✅ API: Conexão estabelecida');
    
    // Testar operações básicas
    const testDoc = {
      test: true,
      timestamp: new Date(),
      api: 'test-mongodb'
    };
    
    // Insert
    const insertResult = await db.collection('test').insertOne(testDoc);
    console.log('✅ API: Insert realizado');
    
    // Find
    const findResult = await db.collection('test').findOne({ _id: insertResult.insertedId });
    console.log('✅ API: Find realizado');
    
    // Delete
    const deleteResult = await db.collection('test').deleteOne({ _id: insertResult.insertedId });
    console.log('✅ API: Delete realizado');
    
    // Stats
    const usersCount = await db.collection('users').countDocuments();
    const collections = await db.listCollections().toArray();
    
    const result = {
      success: true,
      message: 'MongoDB funcionando perfeitamente!',
      stats: {
        usersCount,
        collections: collections.map(c => c.name),
        operations: {
          insert: !!insertResult.insertedId,
          find: !!findResult,
          delete: deleteResult.deletedCount === 1
        }
      },
      timestamp: new Date().toISOString()
    };
    
    console.log('🎉 API: Teste concluído:', result);
    
    return NextResponse.json(result);
    
  } catch (error) {
    console.error('❌ API: Erro no teste MongoDB:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}