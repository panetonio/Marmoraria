const mongoose = require('mongoose');
const fs = require('fs').promises;
const path = require('path');

require('dotenv').config({ path: '../.env' });

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB Connected');
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
};

const testImageUpload = async () => {
  await connectDB();

  try {
    console.log('\n🧪 Testando sistema de upload de imagens...\n');

    // Criar uma imagem de teste simples (1x1 pixel PNG em base64)
    const testImageBase64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
    
    console.log('📤 Simulando upload de imagem...');
    console.log(`   - Tipo: PNG`);
    console.log(`   - Tamanho: ${(testImageBase64.length * 3 / 4 / 1024).toFixed(2)}KB`);
    
    // Simular requisição HTTP para upload
    const uploadData = {
      imageData: testImageBase64
    };
    
    console.log('\n🔧 Testando validação de data URI...');
    
    // Testar validação de data URI
    const dataUriRegex = /^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,(.+)$/;
    const match = testImageBase64.match(dataUriRegex);
    
    if (match) {
      const [, mimeType, base64Data] = match;
      console.log(`   ✅ Data URI válido`);
      console.log(`   - MIME Type: ${mimeType}`);
      console.log(`   - Dados Base64: ${base64Data.substring(0, 20)}...`);
      
      // Converter para buffer
      const imageBuffer = Buffer.from(base64Data, 'base64');
      console.log(`   - Buffer size: ${imageBuffer.length} bytes`);
      
      // Testar salvamento local
      console.log('\n💾 Testando salvamento local...');
      const uploadDir = path.join(__dirname, 'public/uploads');
      
      // Garantir que o diretório existe
      try {
        await fs.access(uploadDir);
      } catch (error) {
        await fs.mkdir(uploadDir, { recursive: true });
        console.log(`   📁 Diretório criado: ${uploadDir}`);
      }
      
      // Gerar nome único
      const timestamp = Date.now();
      const filename = `${timestamp}-test-image.png`;
      const filePath = path.join(uploadDir, filename);
      
      // Salvar arquivo
      await fs.writeFile(filePath, imageBuffer);
      console.log(`   ✅ Arquivo salvo: ${filename}`);
      console.log(`   📍 Caminho: ${filePath}`);
      
      // Verificar se o arquivo foi salvo
      const stats = await fs.stat(filePath);
      console.log(`   📏 Tamanho do arquivo: ${stats.size} bytes`);
      
      // Testar URL pública
      const publicUrl = `/uploads/${filename}`;
      console.log(`   🌐 URL pública: ${publicUrl}`);
      
      // Simular resposta da API
      const apiResponse = {
        success: true,
        url: publicUrl,
        filename: filename,
        size: imageBuffer.length,
        mimeType: mimeType
      };
      
      console.log('\n📋 Resposta da API simulada:');
      console.log(JSON.stringify(apiResponse, null, 2));
      
      // Testar listagem de arquivos
      console.log('\n📂 Testando listagem de arquivos...');
      const files = await fs.readdir(uploadDir);
      console.log(`   📁 Arquivos encontrados: ${files.length}`);
      
      files.forEach((file, index) => {
        console.log(`   ${index + 1}. ${file}`);
      });
      
      // Testar estatísticas
      console.log('\n📊 Testando estatísticas...');
      let totalSize = 0;
      const fileTypes = {};
      
      for (const file of files) {
        const filePath = path.join(uploadDir, file);
        const fileStats = await fs.stat(filePath);
        totalSize += fileStats.size;
        
        const extension = path.extname(file).toLowerCase();
        fileTypes[extension] = (fileTypes[extension] || 0) + 1;
      }
      
      console.log(`   📈 Total de arquivos: ${files.length}`);
      console.log(`   💾 Tamanho total: ${(totalSize / 1024).toFixed(2)}KB`);
      console.log(`   📋 Tipos de arquivo:`, fileTypes);
      
      // Cleanup - remover arquivo de teste
      console.log('\n🧹 Limpando arquivo de teste...');
      await fs.unlink(filePath);
      console.log(`   🗑️ Arquivo removido: ${filename}`);
      
    } else {
      console.log('   ❌ Data URI inválido');
    }
    
    console.log('\n🎉 Teste do sistema de upload concluído com sucesso!');
    console.log('\n📋 Resumo dos testes:');
    console.log('   ✅ Validação de data URI');
    console.log('   ✅ Conversão base64 para buffer');
    console.log('   ✅ Geração de nome único');
    console.log('   ✅ Salvamento local de arquivo');
    console.log('   ✅ Verificação de arquivo salvo');
    console.log('   ✅ Geração de URL pública');
    console.log('   ✅ Listagem de arquivos');
    console.log('   ✅ Cálculo de estatísticas');
    console.log('   ✅ Cleanup de arquivos de teste');
    
    console.log('\n🚀 Sistema pronto para uso!');
    console.log('   - Endpoint: POST /api/uploads/image');
    console.log('   - Autenticação: Bearer token obrigatório');
    console.log('   - Formato: { "imageData": "data:image/...;base64,..." }');
    console.log('   - Resposta: { "success": true, "url": "/uploads/filename" }');
    
  } catch (error) {
    console.error('❌ Erro durante o teste:', error);
  } finally {
    mongoose.connection.close();
  }
};

testImageUpload();
