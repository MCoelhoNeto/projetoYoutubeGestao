// Teste que simula o ambiente do Next.js
const fs = require('fs');
const path = require('path');

console.log('🧪 Testando ambiente Next.js...');

// Carregar variáveis do .env manualmente
function loadEnvFile() {
  const envPath = path.join(__dirname, '.env');
  
  if (!fs.existsSync(envPath)) {
    console.log('❌ Arquivo .env não encontrado');
    return {};
  }
  
  const envContent = fs.readFileSync(envPath, 'utf8');
  const envVars = {};
  
  envContent.split('\n').forEach(line => {
    const trimmedLine = line.trim();
    if (trimmedLine && !trimmedLine.startsWith('#')) {
      const [key, ...valueParts] = trimmedLine.split('=');
      if (key && valueParts.length > 0) {
        envVars[key.trim()] = valueParts.join('=').trim();
      }
    }
  });
  
  return envVars;
}

const envVars = loadEnvFile();

console.log('📋 Variáveis carregadas do .env:');
for (const [key, value] of Object.entries(envVars)) {
  if (value) {
    console.log(`✅ ${key}: ${key.includes('KEY') || key.includes('SECRET') ? '***' + value.slice(-4) : value}`);
  } else {
    console.log(`❌ ${key}: vazio`);
  }
}

console.log('');
console.log('🔍 Verificando GEMINI_API_KEY...');

if (envVars.GEMINI_API_KEY) {
  console.log('✅ GEMINI_API_KEY encontrada no .env!');
  console.log('🔑 Chave (últimos 4 caracteres):', envVars.GEMINI_API_KEY.slice(-4));
} else {
  console.log('❌ GEMINI_API_KEY não encontrada no .env');
} 