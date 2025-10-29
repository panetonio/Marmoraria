const mongoose = require('mongoose');
const CutPiece = require('../models/CutPiece');
const { parseAssetUri, getAssetConfig } = require('../controllers/assetController');

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

const testCutPieceAssetIntegration = async () => {
  await connectDB();

  try {
    console.log('\n🧪 Testando integração CutPiece com AssetController...\n');

    // Limpar dados de teste anteriores
    await CutPiece.deleteMany({ pieceId: { $regex: /^OS-TEST-ASSET/ } });
    console.log('🗑️ Dados de teste anteriores removidos');

    // Criar uma CutPiece de teste
    const testCutPiece = {
      pieceId: 'OS-TEST-ASSET-001-ITEM-1-P1',
      serviceOrderId: new mongoose.Types.ObjectId(),
      originalQuoteItemId: 'ITEM-1',
      originalStockItemId: 'SLAB-TEST-001',
      materialId: 'mat-001',
      description: 'Bancada Teste Asset Controller',
      category: 'bancada',
      dimensions: '2.40 x 0.60 m',
      status: 'pending_cut',
      qrCodeValue: 'marmoraria://asset/cut_piece/OS-TEST-ASSET-001-ITEM-1-P1'
    };

    const cutPiece = await CutPiece.create(testCutPiece);
    console.log(`✅ CutPiece criada: ${cutPiece.pieceId}`);

    // Testar parseAssetUri
    console.log('\n🔍 Testando parseAssetUri...');
    const qrCode = 'marmoraria://asset/cut_piece/OS-TEST-ASSET-001-ITEM-1-P1';
    const parsed = parseAssetUri(qrCode);
    
    if (parsed) {
      console.log(`   ✅ QR Code parseado:`);
      console.log(`      - Tipo: ${parsed.type}`);
      console.log(`      - ID: ${parsed.id}`);
    } else {
      console.log('   ❌ Falha ao parsear QR Code');
    }

    // Testar getAssetConfig
    console.log('\n⚙️ Testando getAssetConfig...');
    const config = getAssetConfig('cut_piece');
    
    if (config) {
      console.log(`   ✅ Configuração encontrada:`);
      console.log(`      - Tipo normalizado: ${config.normalizedType}`);
      console.log(`      - Modelo: ${config.model.modelName}`);
      console.log(`      - Campo de status: ${config.statusField}`);
      console.log(`      - Campo de localização: ${config.locationField}`);
      console.log(`      - Campo de ID: ${config.idField}`);
      console.log(`      - Status permitidos: ${config.allowedStatuses.join(', ')}`);
      console.log(`      - Label: ${config.logLabel}`);
    } else {
      console.log('   ❌ Configuração não encontrada');
    }

    // Testar busca usando findAssetById (simulando a função auxiliar)
    console.log('\n🔎 Testando busca por pieceId...');
    const foundCutPiece = await config.model.findOne({ [config.idField]: parsed.id });
    
    if (foundCutPiece) {
      console.log(`   ✅ CutPiece encontrada:`);
      console.log(`      - ID: ${foundCutPiece.pieceId}`);
      console.log(`      - Descrição: ${foundCutPiece.description}`);
      console.log(`      - Status: ${foundCutPiece.status}`);
      console.log(`      - QR Code: ${foundCutPiece.qrCodeValue}`);
    } else {
      console.log('   ❌ CutPiece não encontrada');
    }

    // Testar diferentes aliases
    console.log('\n🏷️ Testando aliases...');
    const aliases = ['cut_piece', 'cutpiece', 'peca_cortada', 'peca'];
    
    aliases.forEach(alias => {
      const aliasConfig = getAssetConfig(alias);
      if (aliasConfig) {
        console.log(`   ✅ Alias '${alias}' → ${aliasConfig.normalizedType}`);
      } else {
        console.log(`   ❌ Alias '${alias}' não reconhecido`);
      }
    });

    console.log('\n🎉 Teste de integração concluído com sucesso!');

  } catch (error) {
    console.error('❌ Erro durante o teste:', error);
  } finally {
    mongoose.connection.close();
  }
};

testCutPieceAssetIntegration();

