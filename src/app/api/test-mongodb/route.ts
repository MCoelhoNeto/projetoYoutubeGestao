import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Primeiro, vamos apenas testar se a API responde
    console.log('🔍 API de teste MongoDB chamada');
    
    // Verificar variáveis de ambiente
    const mongoUri = process.env.MONGODB_URI;
    
    if (!mongoUri) {
      return NextResponse.json({
        status: 'error',
        message: 'MONGODB_URI não encontrada no .env.local',
        details: {
          suggestion: 'Crie o arquivo .env.local na raiz do projeto com: MONGODB_URI=mongodb://localhost:27017/youtube-manager'
        },
        timestamp: new Date().toISOString()
      }, { status: 500 });
    }

    // Tentar importar mongoose
    let mongoose;
    try {
      mongoose = require('mongoose');
    } catch (error) {
      return NextResponse.json({
        status: 'error',
        message: 'Mongoose não está instalado',
        details: {
          suggestion: 'Execute: npm install mongoose'
        },
        timestamp: new Date().toISOString()
      }, { status: 500 });
    }

    // Verificar estado da conexão
    const currentState = mongoose.connection.readyState;
    const states = {
      0: 'disconnected',
      1: 'connected',
      2: 'connecting',
      3: 'disconnecting'
    };

    // Se já conectado, retornar sucesso
    if (currentState === 1) {
      return NextResponse.json({
        status: 'success',
        message: 'MongoDB já está conectado!',
        connection: {
          state: states[currentState],
          database: mongoose.connection.db?.databaseName,
          host: mongoose.connection.host,
          port: mongoose.connection.port
        },
        timestamp: new Date().toISOString()
      });
    }

    // Tentar conectar
    try {
      await mongoose.connect(mongoUri, {
        serverSelectionTimeoutMS: 5000, // 5 segundos
      });

      return NextResponse.json({
        status: 'success',
        message: 'Conectado ao MongoDB com sucesso!',
        connection: {
          state: 'connected',
          database: mongoose.connection.db?.databaseName,
          host: mongoose.connection.host,
          port: mongoose.connection.port,
          uri: mongoUri.replace(/\/\/([^:]+):([^@]+)@/, '//***:***@') // Mascarar senha
        },
        timestamp: new Date().toISOString()
      });

    } catch (connectionError: any) {
      return NextResponse.json({
        status: 'error',
        message: 'Falha ao conectar com MongoDB',
        error: connectionError.message,
        details: {
          mongoUri: mongoUri.replace(/\/\/([^:]+):([^@]+)@/, '//***:***@'),
          suggestions: [
            'Verificar se MongoDB está rodando',
            'Verificar se a URI está correta',
            'Verificar configurações de firewall',
            'Para MongoDB local: sudo systemctl start mongod (Linux) ou brew services start mongodb/brew/mongodb-community (macOS)'
          ]
        },
        timestamp: new Date().toISOString()
      }, { status: 500 });
    }

  } catch (error: any) {
    console.error('❌ Erro geral na API:', error);
    
    return NextResponse.json({
      status: 'error',
      message: 'Erro interno na API de teste',
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}