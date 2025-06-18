import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from "next-auth";
import { authOptions } from "@auth/[...nextauth]/authOption";
import { connectDB } from "@lib/mongodb";
import Analysis from "@models/Analysis";
import User from "@models/User";

export async function GET(request: NextRequest) {
  try {
    console.log("🧪 Iniciando teste da rota de análise...");
    
    // Testar conexão com MongoDB
    await connectDB();
    console.log("✅ Conexão com MongoDB OK");
    
    // Testar getServerSession
    const session = await getServerSession(authOptions);
    console.log("✅ getServerSession OK:", !!session);
    
    // Testar busca de usuário
    if (session?.user?.email) {
      const user = await User.findOne({ email: session.user.email });
      console.log("✅ Busca de usuário OK:", !!user);
      
      if (user) {
        // Testar busca de análises
        const analyses = await Analysis.find({ userId: user._id }).limit(1);
        console.log("✅ Busca de análises OK:", analyses.length);
      }
    }
    
    return NextResponse.json({
      success: true,
      message: "Teste concluído com sucesso",
      session: !!session,
      user: !!session?.user?.email
    });
    
  } catch (error) {
    console.error("❌ Erro no teste:", error);
    return NextResponse.json(
      { 
        error: "Erro no teste", 
        details: error instanceof Error ? error.message : "Erro desconhecido" 
      },
      { status: 500 }
    );
  }
} 