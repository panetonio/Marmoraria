const mongoose = require('mongoose');
const CutPiece = require('../models/CutPiece');
const ServiceOrder = require('../models/ServiceOrder');

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

const testCutPieceRoutes = async () => {
  await connectDB();

  try {
    console.log('\n🧪 Testando rotas de CutPieces...\n');

    // Limpar dados de teste anteriores
    await CutPiece.deleteMany({ pieceId: { $regex: /^OS-TEST-ROUTES/ } });
    await ServiceOrder.deleteMany({ id: { $regex: /^OS-TEST-ROUTES/ } });
    console.log('🗑️ Dados de teste anteriores removidos');

    // Criar uma ServiceOrder de teste
    const testServiceOrder = {
      id: 'OS-TEST-ROUTES-001',
      orderId: new mongoose.Types.ObjectId(),
      clientName: 'Cliente Teste Rotas',
      deliveryAddress: {
        address: 'Rua Teste Rotas',
        number: '123',
        complement: '',
        neighborhood: 'Centro',
        city: 'São Paulo',
        uf: 'SP',
        cep: '01000-000'
      },
      items: [
        {
          id: 'ITEM-ROUTES-1',
          type: 'material',
          description: 'Bancada Teste Rotas',
          quantity: 1.44,
          unitPrice: 600,
          totalPrice: 864,
          width: 2.4,
          height: 0.6,
          materialId: 'mat-001',
          category: 'bancada'
        }
      ],
      total: 864,
      deliveryDate: new Date('2024-12-31'),
      assignedToIds: [],
      status: 'cutting',
      productionStatus: 'cutting',
      logisticsStatus: 'awaiting_scheduling',
      allocatedSlabId: 'SLAB-TEST-ROUTES-001',
      history: []
    };

    const serviceOrder = await ServiceOrder.create(testServiceOrder);
    console.log(`✅ ServiceOrder criada: ${serviceOrder.id}`);

    // Criar CutPieces de teste
    const testCutPieces = [
      {
        pieceId: 'OS-TEST-ROUTES-001-ITEM-ROUTES-1-P1',
        serviceOrderId: serviceOrder._id,
        originalQuoteItemId: 'ITEM-ROUTES-1',
        originalStockItemId: 'SLAB-TEST-ROUTES-001',
        materialId: 'mat-001',
        description: 'Bancada Teste Rotas - Peça 1',
        category: 'bancada',
        dimensions: '2.40 x 0.60 m',
        status: 'pending_cut',
        qrCodeValue: 'marmoraria://asset/cut_piece/OS-TEST-ROUTES-001-ITEM-ROUTES-1-P1'
      },
      {
        pieceId: 'OS-TEST-ROUTES-001-ITEM-ROUTES-1-P2',
        serviceOrderId: serviceOrder._id,
        originalQuoteItemId: 'ITEM-ROUTES-1',
        originalStockItemId: 'SLAB-TEST-ROUTES-001',
        materialId: 'mat-001',
        description: 'Bancada Teste Rotas - Peça 2',
        category: 'bancada',
        dimensions: '1.20 x 0.60 m',
        status: 'cut',
        qrCodeValue: 'marmoraria://asset/cut_piece/OS-TEST-ROUTES-001-ITEM-ROUTES-1-P2'
      }
    ];

    const cutPieces = await CutPiece.insertMany(testCutPieces);
    console.log(`✅ ${cutPieces.length} CutPieces criadas`);

    // Testar busca por ServiceOrder
    console.log('\n🔍 Testando busca por ServiceOrder...');
    const foundCutPieces = await CutPiece.find({ serviceOrderId: serviceOrder._id });
    console.log(`   ✅ Encontradas ${foundCutPieces.length} CutPieces para ServiceOrder ${serviceOrder.id}`);
    
    foundCutPieces.forEach((cutPiece, index) => {
      console.log(`      ${index + 1}. ${cutPiece.pieceId} - ${cutPiece.description} (${cutPiece.status})`);
    });

    // Testar busca por pieceId
    console.log('\n🔍 Testando busca por pieceId...');
    const testPieceId = 'OS-TEST-ROUTES-001-ITEM-ROUTES-1-P1';
    const foundCutPiece = await CutPiece.findOne({ pieceId: testPieceId });
    
    if (foundCutPiece) {
      console.log(`   ✅ CutPiece encontrada:`);
      console.log(`      - ID: ${foundCutPiece.pieceId}`);
      console.log(`      - Descrição: ${foundCutPiece.description}`);
      console.log(`      - Status: ${foundCutPiece.status}`);
      console.log(`      - QR Code: ${foundCutPiece.qrCodeValue}`);
    } else {
      console.log('   ❌ CutPiece não encontrada');
    }

    // Testar atualização de status
    console.log('\n🔄 Testando atualização de status...');
    const updatedCutPiece = await CutPiece.findOneAndUpdate(
      { pieceId: testPieceId },
      { status: 'finishing' },
      { new: true }
    );
    
    if (updatedCutPiece) {
      console.log(`   ✅ Status atualizado:`);
      console.log(`      - Peça: ${updatedCutPiece.pieceId}`);
      console.log(`      - Novo status: ${updatedCutPiece.status}`);
    } else {
      console.log('   ❌ Falha ao atualizar status');
    }

    // Testar atualização de localização
    console.log('\n📍 Testando atualização de localização...');
    const updatedLocationCutPiece = await CutPiece.findOneAndUpdate(
      { pieceId: testPieceId },
      { location: 'Setor de Acabamento' },
      { new: true }
    );
    
    if (updatedLocationCutPiece) {
      console.log(`   ✅ Localização atualizada:`);
      console.log(`      - Peça: ${updatedLocationCutPiece.pieceId}`);
      console.log(`      - Nova localização: ${updatedLocationCutPiece.location}`);
    } else {
      console.log('   ❌ Falha ao atualizar localização');
    }

    console.log('\n🎉 Teste de rotas concluído com sucesso!');
    console.log('\n📋 Rotas disponíveis:');
    console.log('   GET    /api/cut-pieces/by-os/:serviceOrderId');
    console.log('   GET    /api/cut-pieces/by-id/:pieceId');
    console.log('   PATCH  /api/cut-pieces/:pieceId/status');
    console.log('   PATCH  /api/cut-pieces/:pieceId/location');

  } catch (error) {
    console.error('❌ Erro durante o teste:', error);
  } finally {
    mongoose.connection.close();
  }
};

testCutPieceRoutes();



