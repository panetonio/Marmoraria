require('dotenv').config();
const mongoose = require('mongoose');

console.log('🔍 Testando conexão com MongoDB...\n');
console.log('URI:', process.env.MONGODB_URI ? 'Configurada ✓' : 'NÃO CONFIGURADA ✗');
console.log('\nConectando...\n');

mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('✅ Conexão bem-sucedida!');
    console.log('📊 Database:', mongoose.connection.name);
    console.log('🌍 Host:', mongoose.connection.host);
    process.exit(0);
  })
  .catch((err) => {
    console.error('❌ Erro na conexão:');
    console.error(err.message);
    process.exit(1);
  });

