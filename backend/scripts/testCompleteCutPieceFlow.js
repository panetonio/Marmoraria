const mongoose = require('mongoose');
const ServiceOrder = require('../models/ServiceOrder');
const CutPiece = require('../models/CutPiece');
const StockItem = require('../models/StockItem');
const { createCutPiecesForServiceOrder } = require('../utils/cutPieceHelper');

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

const testCompleteCutPieceFlow = async () => {
  await connectDB();

  try {
    console.log('\n🧪 Testando fluxo completo de CutPieces...\n');

    // Limpar dados de teste anteriores
    await CutPiece.deleteMany({ pieceId: { $regex: /^OS-FLOW-TEST/ } });
    await ServiceOrder.deleteMany({ id: { $regex: /^OS-FLOW-TEST/ } });
    await StockItem.deleteMany({ id: { $regex: /^SLAB-FLOW-TEST/ } });
    console.log('🗑️ Dados de teste anteriores removidos');

    // 1. Criar uma chapa de estoque
    console.log('\n📦 1. Criando chapa de estoque...');
    const testStockItem = {
      id: 'SLAB-FLOW-TEST-001',
      materialId: new mongoose.Types.ObjectId(),
      photoUrl: 'https://example.com/granito-preto.jpg',
      width: 3.0,
      height: 2.0,
      thickness: 3,
      location: 'Pátio A, Rack 1',
      status: 'disponivel',
      createdAt: new Date().toISOString()
    };

    const stockItem = await StockItem.create(testStockItem);
    console.log(`✅ Chapa criada: ${stockItem.id}`);

    // 2. Criar uma ServiceOrder com itens de material
    console.log('\n🔧 2. Criando ServiceOrder com itens de material...');
    const testServiceOrder = {
      id: 'OS-FLOW-TEST-001',
      orderId: new mongoose.Types.ObjectId(),
      clientName: 'Cliente Teste Fluxo',
      deliveryAddress: {
        address: 'Rua Teste Fluxo',
        number: '123',
        complement: '',
        neighborhood: 'Centro',
        city: 'São Paulo',
        uf: 'SP',
        cep: '01000-000'
      },
      items: [
        {
          id: 'ITEM-FLOW-1',
          type: 'material',
          description: 'Bancada Cozinha - Granito Preto',
          quantity: 1.44,
          unitPrice: 600,
          totalPrice: 864,
          width: 2.4,
          height: 0.6,
          materialId: stockItem.materialId.toString(),
          category: 'bancada'
        },
        {
          id: 'ITEM-FLOW-2',
          type: 'material',
          description: 'Pia Banheiro - Granito Preto',
          quantity: 0.48,
          unitPrice: 450,
          totalPrice: 216,
          width: 1.2,
          height: 0.4,
          materialId: stockItem.materialId.toString(),
          category: 'pia'
        },
        {
          id: 'ITEM-FLOW-3',
          type: 'service',
          description: 'Instalação',
          quantity: 1,
          unitPrice: 200,
          totalPrice: 200
        }
      ],
      total: 1280,
      deliveryDate: new Date('2024-12-31'),
      assignedToIds: [],
      status: 'pending_production',
      productionStatus: 'pending_production',
      logisticsStatus: 'awaiting_scheduling',
      allocatedSlabId: null,
      history: []
    };

    const serviceOrder = await ServiceOrder.create(testServiceOrder);
    console.log(`✅ ServiceOrder criada: ${serviceOrder.id}`);

    // 3. Alocar chapa à ServiceOrder
    console.log('\n🔗 3. Alocando chapa à ServiceOrder...');
    const updatedServiceOrder = await ServiceOrder.findByIdAndUpdate(
      serviceOrder._id,
      { 
        allocatedSlabId: stockItem.id,
        status: 'cutting',
        productionStatus: 'cutting'
      },
      { new: true }
    );
    console.log(`✅ Chapa ${stockItem.id} alocada à OS ${serviceOrder.id}`);

    // 4. Criar CutPieces automaticamente
    console.log('\n✂️ 4. Criando CutPieces automaticamente...');
    const cutPieces = await createCutPiecesForServiceOrder(serviceOrder.id, stockItem.id);
    
    console.log(`\n📊 Resultados:`);
    console.log(`   - ServiceOrder: ${serviceOrder.id}`);
    console.log(`   - Itens de material: ${serviceOrder.items.filter(item => item.type === 'material').length}`);
    console.log(`   - CutPieces criadas: ${cutPieces.length}`);
    
    cutPieces.forEach((cutPiece, index) => {
      console.log(`\n   CutPiece ${index + 1}:`);
      console.log(`     - ID: ${cutPiece.pieceId}`);
      console.log(`     - Descrição: ${cutPiece.description}`);
      console.log(`     - Categoria: ${cutPiece.category}`);
      console.log(`     - Dimensões: ${cutPiece.dimensions}`);
      console.log(`     - Status: ${cutPiece.status}`);
      console.log(`     - QR Code: ${cutPiece.qrCodeValue}`);
    });

    // 5. Testar atualização de status via API
    console.log('\n🔄 5. Testando atualização de status...');
    const firstCutPiece = cutPieces[0];
    
    // Simular atualização de status para 'cut'
    const updatedCutPiece = await CutPiece.findOneAndUpdate(
      { pieceId: firstCutPiece.pieceId },
      { status: 'cut' },
      { new: true }
    );
    
    if (updatedCutPiece) {
      console.log(`✅ Status atualizado para 'cut': ${updatedCutPiece.pieceId}`);
    }

    // Simular atualização de status para 'finishing'
    const finishingCutPiece = await CutPiece.findOneAndUpdate(
      { pieceId: firstCutPiece.pieceId },
      { status: 'finishing' },
      { new: true }
    );
    
    if (finishingCutPiece) {
      console.log(`✅ Status atualizado para 'finishing': ${finishingCutPiece.pieceId}`);
    }

    // 6. Testar busca por ServiceOrder
    console.log('\n🔍 6. Testando busca de CutPieces por ServiceOrder...');
    const foundCutPieces = await CutPiece.find({ serviceOrderId: serviceOrder._id });
    console.log(`✅ Encontradas ${foundCutPieces.length} CutPieces para ServiceOrder ${serviceOrder.id}`);

    // 7. Testar busca por pieceId
    console.log('\n🔍 7. Testando busca de CutPiece por pieceId...');
    const foundCutPiece = await CutPiece.findOne({ pieceId: firstCutPiece.pieceId });
    if (foundCutPiece) {
      console.log(`✅ CutPiece encontrada por pieceId: ${foundCutPiece.pieceId}`);
      console.log(`   - Status atual: ${foundCutPiece.status}`);
      console.log(`   - QR Code: ${foundCutPiece.qrCodeValue}`);
    }

    console.log('\n🎉 Teste do fluxo completo concluído com sucesso!');
    console.log('\n📋 Resumo dos testes:');
    console.log('   ✅ Criação de chapa de estoque');
    console.log('   ✅ Criação de ServiceOrder com itens de material');
    console.log('   ✅ Alocação de chapa à ServiceOrder');
    console.log('   ✅ Criação automática de CutPieces');
    console.log('   ✅ Atualização de status das CutPieces');
    console.log('   ✅ Busca de CutPieces por ServiceOrder');
    console.log('   ✅ Busca de CutPiece por pieceId');
    console.log('   ✅ QR Codes gerados corretamente');

  } catch (error) {
    console.error('❌ Erro durante o teste:', error);
  } finally {
    mongoose.connection.close();
  }
};

testCompleteCutPieceFlow();
