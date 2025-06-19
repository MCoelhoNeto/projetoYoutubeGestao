// Teste simples para verificar variáveis de ambiente
console.log('🧪 Testando variáveis de ambiente...');
console.log('');

// Verificar se as variáveis estão carregadas
const envVars = {
  'GEMINI_API_KEY': process.env.GEMINI_API_KEY,
  'ENABLE_WORKER': process.env.ENABLE_WORKER,
  'MONGODB_URI': process.env.MONGODB_URI,
  'NODE_ENV': process.env.NODE_ENV
};

console.log('📋 Variáveis de ambiente:');
for (const [key, value] of Object.entries(envVars)) {
  if (value) {
    console.log(`✅ ${key}: ${key.includes('KEY') || key.includes('SECRET') ? '***' + value.slice(-4) : value}`);
  } else {
    console.log(`❌ ${key}: não definida`);
  }
}

console.log('');
console.log('🔍 Verificando se GEMINI_API_KEY está acessível...');

if (process.env.GEMINI_API_KEY) {
  console.log('✅ GEMINI_API_KEY encontrada!');
  console.log('🔑 Chave (últimos 4 caracteres):', process.env.GEMINI_API_KEY.slice(-4));
} else {
  console.log('❌ GEMINI_API_KEY não encontrada');
  console.log('💡 Verifique se o arquivo .env está na raiz do projeto');
  console.log('💡 Em desenvolvimento, Next.js carrega automaticamente .env.local');
} 