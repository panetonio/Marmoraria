const mongoose = require('mongoose');
const ServiceOrder = require('../models/ServiceOrder');
const CutPiece = require('../models/CutPiece');
const { createCutPiecesForServiceOrder, shouldCreateCutPieces } = require('../utils/cutPieceHelper');

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

const testCutPieceCreation = async () => {
  await connectDB();

  try {
    console.log('\n🧪 Testando criação de CutPieces...\n');

    // Limpar dados de teste anteriores
    await CutPiece.deleteMany({ pieceId: { $regex: /^OS-TEST/ } });
    await ServiceOrder.deleteMany({ id: { $regex: /^OS-TEST/ } });
    console.log('🗑️ Dados de teste anteriores removidos');

    // Criar uma ServiceOrder de teste
    const testServiceOrder = {
      id: 'OS-TEST-001',
      orderId: new mongoose.Types.ObjectId(),
      clientName: 'Cliente Teste',
      deliveryAddress: {
        address: 'Rua Teste',
        number: '123',
        complement: '',
        neighborhood: 'Centro',
        city: 'São Paulo',
        uf: 'SP',
        cep: '01000-000'
      },
      items: [
        {
          id: 'ITEM-1',
          type: 'material',
          description: 'Bancada Cozinha - Granito Preto',
          quantity: 1.44,
          unitPrice: 600,
          totalPrice: 864,
          width: 2.4,
          height: 0.6,
          materialId: 'mat-001',
          category: 'bancada'
        },
        {
          id: 'ITEM-2',
          type: 'material',
          description: 'Pia Banheiro - Mármore Branco',
          quantity: 0.48,
          unitPrice: 450,
          totalPrice: 216,
          width: 1.2,
          height: 0.4,
          materialId: 'mat-002',
          category: 'pia'
        },
        {
          id: 'ITEM-3',
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
      status: 'cutting',
      productionStatus: 'cutting',
      logisticsStatus: 'awaiting_scheduling',
      allocatedSlabId: 'SLAB-TEST-001',
      history: []
    };

    const serviceOrder = await ServiceOrder.create(testServiceOrder);
    console.log(`✅ ServiceOrder criada: ${serviceOrder.id}`);

    // Testar criação de CutPieces
    console.log('\n🔧 Testando criação de CutPieces...');
    const cutPieces = await createCutPiecesForServiceOrder(serviceOrder.id, serviceOrder.allocatedSlabId);
    
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

    // Verificar se ServiceOrder foi atualizada com cutPieceIds
    const updatedServiceOrder = await ServiceOrder.findById(serviceOrder._id).populate('cutPieceIds');
    console.log(`\n🔗 ServiceOrder atualizada com ${updatedServiceOrder.cutPieceIds.length} CutPiece IDs`);

    // Testar função shouldCreateCutPieces
    console.log('\n🧪 Testando função shouldCreateCutPieces...');
    const shouldCreate1 = shouldCreateCutPieces(serviceOrder, 'cutting');
    const shouldCreate2 = shouldCreateCutPieces(serviceOrder, 'pending_production');
    const shouldCreate3 = shouldCreateCutPieces({ ...serviceOrder, allocatedSlabId: null }, 'cutting');
    
    console.log(`   - Status 'cutting' com allocatedSlabId: ${shouldCreate1}`);
    console.log(`   - Status 'pending_production' com allocatedSlabId: ${shouldCreate2}`);
    console.log(`   - Status 'cutting' sem allocatedSlabId: ${shouldCreate3}`);

    console.log('\n🎉 Teste concluído com sucesso!');

  } catch (error) {
    console.error('❌ Erro durante o teste:', error);
  } finally {
    mongoose.connection.close();
  }
};

testCutPieceCreation();

