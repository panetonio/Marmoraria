// Script para build do frontend (Windows compatible)
const { execSync } = require('child_process');
const path = require('path');

console.log('📦 Gerando build do frontend...');

try {
  const frontendPath = path.join(__dirname, '..', 'frontend');
  execSync('npm run build', { 
    cwd: frontendPath, 
    stdio: 'inherit',
    shell: true 
  });
  console.log('✅ Build do frontend concluído!');
} catch (error) {
  console.error('❌ Erro ao gerar build do frontend:', error.message);
  process.exit(1);
}

