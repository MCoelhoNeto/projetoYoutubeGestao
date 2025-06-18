import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from "next-auth";
import { connectDB } from "@lib/mongodb";
import nodemailer from 'nodemailer';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession();
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json({ error: "Email é obrigatório" }, { status: 400 });
    }

    await connectDB();

    // Importar modelos após a conexão
    const Analysis = (await import("@models/Analysis")).default;
    const User = (await import("@models/User")).default;

    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 });
    }

    const analysis = await Analysis.findOne({ _id: id, userId: user._id });

    if (!analysis) {
      return NextResponse.json({ error: "Análise não encontrada" }, { status: 404 });
    }

    if (analysis.status !== "completed") {
      return NextResponse.json({ error: "Análise ainda não foi concluída" }, { status: 400 });
    }

    // Configurar transporter do nodemailer
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.EMAIL_PORT || '587'),
      secure: false, // true para 465, false para outras portas
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    // Criar conteúdo do email
    const emailContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #7c3aed; border-bottom: 2px solid #7c3aed; padding-bottom: 10px;">
          📊 Análise de Vídeo - YouTube Manager
        </h2>
        
        <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #1f2937; margin-top: 0;">🎥 ${analysis.videoTitle}</h3>
          <p style="color: #6b7280; margin: 5px 0;">
            <strong>Canal:</strong> ${analysis.channelName}
          </p>
          <p style="color: #6b7280; margin: 5px 0;">
            <strong>Data da análise:</strong> ${new Date(analysis.createdAt).toLocaleDateString('pt-BR')}
          </p>
        </div>

        <div style="background-color: #fef3c7; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b;">
          <h4 style="color: #92400e; margin-top: 0;">🤖 Resumo da IA</h4>
          <div style="color: #78350f; line-height: 1.6; white-space: pre-line;">
            ${analysis.aiSummary}
          </div>
        </div>

        <div style="background-color: #f1f5f9; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h4 style="color: #334155; margin-top: 0;">📝 Transcrição</h4>
          <div style="color: #475569; line-height: 1.6; max-height: 300px; overflow-y: auto; white-space: pre-line;">
            ${analysis.transcription}
          </div>
        </div>

        <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
          <p style="color: #6b7280; font-size: 14px;">
            📧 Enviado via YouTube Manager
          </p>
        </div>
      </div>
    `;

    // Enviar email
    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: email,
      subject: `Análise de Vídeo: ${analysis.videoTitle}`,
      html: emailContent,
    };

    await transporter.sendMail(mailOptions);

    return NextResponse.json({
      success: true,
      message: "Email enviado com sucesso"
    });

  } catch (error) {
    console.error("Erro ao enviar email:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
} 