import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { connectDB } from '@lib/mongodb';
import Analysis from '@models/Analysis';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    await connectDB();

    const analysis = await Analysis.findById(params.id).populate('categoryId');
    if (!analysis) {
      return NextResponse.json({ error: 'Análise não encontrada' }, { status: 404 });
    }

    // Verificar se a análise está completa
    if (analysis.status !== 'completed') {
      return NextResponse.json({ error: 'Análise não está completa' }, { status: 400 });
    }

    // Configurações do WordPress
    const wpUser = process.env.USER_WORDPRESS;
    const wpPassword = process.env.SENHA_WORDPRESS;
    const wpIp = process.env.IP_WORDPRESS;

    if (!wpUser || !wpPassword || !wpIp) {
      return NextResponse.json({ error: 'Configurações do WordPress não encontradas' }, { status: 500 });
    }

    // Construir URL base do WordPress
    const wpUrl = wpIp.startsWith('http') ? wpIp : `http://${wpIp}`;
    
    // Criar header de autenticação Basic
    const authHeader = 'Basic ' + Buffer.from(`${wpUser}:${wpPassword}`).toString('base64');

    // Formatar o conteúdo para WordPress
    const content = formatContentForWordPress(analysis);
    
    // Preparar dados do post
    const postData = {
      title: analysis.videoTitle,
      content: content,
      status: 'publish',
      categories: [114] // ID da categoria fixo
    };

    console.log('📝 Criando post no WordPress via Basic Auth...');
    const wpResponse = await fetch(`${wpUrl}/wp-json/wp/v2/posts`, {
      method: 'POST',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(postData)
    });

    if (!wpResponse.ok) {
      const errorText = await wpResponse.text();
      console.error('❌ Erro WordPress:', wpResponse.status, errorText);
      return NextResponse.json({ 
        error: 'Erro ao enviar para WordPress',
        details: errorText
      }, { status: wpResponse.status });
    }

    const wpResult = await wpResponse.json();
    console.log('✅ Post criado com sucesso:', wpResult.id);

    return NextResponse.json({ 
      success: true, 
      message: 'Post enviado para o WordPress com sucesso!',
      postId: wpResult.id,
      postUrl: wpResult.link
    });

  } catch (error: any) {
    console.error('❌ Erro ao enviar para WordPress:', error);
    return NextResponse.json({ 
      error: 'Erro interno do servidor',
      details: error.message 
    }, { status: 500 });
  }
}

function formatContentForWordPress(analysis: any): string {
  const videoEmbed = `[embed]https://www.youtube.com/watch?v=${analysis.videoId}[/embed]`;
  
  let content = `<h2>Análise do Vídeo</h2>\n`;
  content += `<p><strong>Canal:</strong> ${analysis.channelName}</p>\n`;
  
  if (analysis.categoryId) {
    content += `<p><strong>Categoria:</strong> ${analysis.categoryId.name}</p>\n`;
  }
  
  content += `<p><strong>Data da Análise:</strong> ${new Date(analysis.createdAt).toLocaleDateString('pt-BR')}</p>\n\n`;
  
  // Vídeo embed
  content += `<h3>Vídeo</h3>\n`;
  content += `${videoEmbed}\n\n`;
  
  // Resumo da IA
  if (analysis.aiSummary) {
    content += `<h3>Resumo da IA</h3>\n`;
    content += `<div class="ai-summary">\n`;
    content += analysis.aiSummary.split('\n').map((line: string) => `<p>${line}</p>`).join('\n');
    content += `</div>\n\n`;
  }
  
  // Anotações
  if (analysis.notes && analysis.notes.length > 0) {
    content += `<h3>Anotações</h3>\n`;
    content += `<div class="notes">\n`;
    
    analysis.notes.forEach((note: any) => {
      const noteType = note.type === 'resumo' ? 'Meu Resumo' : 
                      note.type === 'observacao' ? 'Observações' : 
                      'Assuntos Correlatos';
      
      content += `<div class="note ${note.type}">\n`;
      content += `<h4>${noteType}</h4>\n`;
      content += `<p>${note.text.split('\n').join('</p><p>')}</p>\n`;
      content += `<small>Adicionado em: ${new Date(note.createdAt).toLocaleString('pt-BR')}</small>\n`;
      content += `</div>\n\n`;
    });
    
    content += `</div>\n\n`;
  }
  
  // Transcrição (resumida)
  if (analysis.transcription) {
    content += `<h3>Transcrição</h3>\n`;
    content += `<div class="transcription">\n`;
    content += `<details>\n`;
    content += `<summary>Clique para ver a transcrição completa</summary>\n`;
    content += `<div class="transcription-content">\n`;
    content += analysis.transcription.split('\n').map((line: string) => `<p>${line}</p>`).join('\n');
    content += `</div>\n`;
    content += `</details>\n`;
    content += `</div>\n\n`;
  }
  
  // Estilos CSS inline
  content += `<style>\n`;
  content += `.ai-summary { background: #f8f9fa; padding: 15px; border-left: 4px solid #007cba; margin: 15px 0; }\n`;
  content += `.notes { margin: 20px 0; }\n`;
  content += `.note { margin: 15px 0; padding: 15px; border-radius: 5px; }\n`;
  content += `.note.resumo { background: #e8f5e8; border-left: 4px solid #28a745; }\n`;
  content += `.note.observacao { background: #fff3cd; border-left: 4px solid #ffc107; }\n`;
  content += `.note.correlato { background: #d1ecf1; border-left: 4px solid #17a2b8; }\n`;
  content += `.transcription { margin: 20px 0; }\n`;
  content += `.transcription-content { background: #f8f9fa; padding: 15px; border-radius: 5px; max-height: 400px; overflow-y: auto; }\n`;
  content += `</style>\n`;
  
  return content;
} 