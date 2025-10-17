require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB Connected');
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
};

const seedUsers = async () => {
  try {
    // Limpar usuários existentes (CUIDADO!)
    // await User.deleteMany({});

    // Criar usuário admin padrão
    const adminExists = await User.findOne({ email: 'admin@marmoraria.com' });
    
    if (!adminExists) {
      await User.create({
        name: 'Administrador',
        email: 'admin@marmoraria.com',
        password: 'admin123',
        role: 'admin',
        isActive: true,
      });
      console.log('✅ Usuário admin criado');
    } else {
      console.log('ℹ️  Usuário admin já existe');
    }

    // Criar usuários de exemplo
    const vendedorExists = await User.findOne({ email: 'vendedor@marmoraria.com' });
    if (!vendedorExists) {
      await User.create({
        name: 'João Vendedor',
        email: 'vendedor@marmoraria.com',
        password: 'vendedor123',
        role: 'vendedor',
        isActive: true,
      });
      console.log('✅ Usuário vendedor criado');
    }

    const producaoExists = await User.findOne({ email: 'producao@marmoraria.com' });
    if (!producaoExists) {
      await User.create({
        name: 'Maria Produção',
        email: 'producao@marmoraria.com',
        password: 'producao123',
        role: 'producao',
        isActive: true,
      });
      console.log('✅ Usuário produção criado');
    }

    console.log('\n✅ Seed concluído com sucesso!');
    console.log('\n📝 Credenciais de acesso:');
    console.log('   Admin:    admin@marmoraria.com / admin123');
    console.log('   Vendedor: vendedor@marmoraria.com / vendedor123');
    console.log('   Produção: producao@marmoraria.com / producao123');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro no seed:', error);
    process.exit(1);
  }
};

// Executar
connectDB().then(() => {
  seedUsers();
});

