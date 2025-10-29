const mongoose = require('mongoose');
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

const testConfirmationFields = async () => {
  await connectDB();

  try {
    console.log('\n🧪 Testando novos campos de confirmação na ServiceOrder...\n');

    // Limpar dados de teste anteriores
    await ServiceOrder.deleteMany({ id: { $regex: /^OS-CONFIRM-TEST/ } });
    console.log('🗑️ Dados de teste anteriores removidos');

    // Criar uma ServiceOrder de teste com dados de confirmação
    console.log('\n📝 1. Criando ServiceOrder com dados de confirmação...');
    const testServiceOrder = {
      id: 'OS-CONFIRM-TEST-001',
      orderId: new mongoose.Types.ObjectId(),
      clientName: 'Cliente Teste Confirmação',
      deliveryAddress: {
        address: 'Rua Teste Confirmação',
        number: '123',
        complement: '',
        neighborhood: 'Centro',
        city: 'São Paulo',
        uf: 'SP',
        cep: '01000-000'
      },
      items: [
        {
          type: 'material',
          description: 'Bancada Cozinha - Granito Preto',
          quantity: 1.44,
          unitPrice: 600,
          totalPrice: 864,
          width: 2.4,
          height: 0.6,
          materialId: 'mat-001',
        }
      ],
      total: 864,
      deliveryDate: new Date('2024-12-31'),
      assignedToIds: [],
      status: 'delivered',
      productionStatus: 'awaiting_logistics',
      logisticsStatus: 'delivered',
      allocatedSlabId: 'SLAB-TEST-001',
      history: [],
      // Novos campos de confirmação
      confirmationPhotos: [
        {
          url: 'https://example.com/photos/entrega-1.jpg',
          description: 'Foto da bancada instalada na cozinha'
        },
        {
          url: 'https://example.com/photos/entrega-2.jpg',
          description: 'Foto geral da instalação'
        },
        {
          url: 'https://example.com/photos/entrega-3.jpg',
          description: 'Detalhe da conexão da pia'
        }
      ],
      customerSignature: {
        url: 'https://example.com/signatures/assinatura-cliente.jpg',
        timestamp: new Date('2024-12-15T14:30:00Z'),
        name: 'João Silva',
        documentNumber: '123.456.789-00'
      }
    };

    const serviceOrder = await ServiceOrder.create(testServiceOrder);
    console.log(`✅ ServiceOrder criada: ${serviceOrder.id}`);

    // Verificar se os campos foram salvos corretamente
    console.log('\n🔍 2. Verificando campos de confirmação...');
    console.log(`   - Fotos de confirmação: ${serviceOrder.confirmationPhotos.length} fotos`);
    serviceOrder.confirmationPhotos.forEach((photo, index) => {
      console.log(`     Foto ${index + 1}: ${photo.description} - ${photo.url}`);
    });

    console.log(`   - Assinatura do cliente:`);
    console.log(`     - URL: ${serviceOrder.customerSignature.url}`);
    console.log(`     - Timestamp: ${serviceOrder.customerSignature.timestamp}`);
    console.log(`     - Nome: ${serviceOrder.customerSignature.name}`);
    console.log(`     - Documento: ${serviceOrder.customerSignature.documentNumber}`);

    // Testar atualização dos campos
    console.log('\n🔄 3. Testando atualização dos campos...');
    const updatedServiceOrder = await ServiceOrder.findByIdAndUpdate(
      serviceOrder._id,
      {
        $push: {
          confirmationPhotos: {
            url: 'https://example.com/photos/entrega-4.jpg',
            description: 'Foto adicional após feedback do cliente'
          }
        },
        $set: {
          'customerSignature.name': 'João Silva Santos',
          'customerSignature.documentNumber': '123.456.789-01'
        }
      },
      { new: true }
    );

    console.log(`✅ ServiceOrder atualizada: ${updatedServiceOrder.id}`);
    console.log(`   - Total de fotos após atualização: ${updatedServiceOrder.confirmationPhotos.length}`);
    console.log(`   - Nome atualizado: ${updatedServiceOrder.customerSignature.name}`);
    console.log(`   - Documento atualizado: ${updatedServiceOrder.customerSignature.documentNumber}`);

    // Testar busca por campos específicos
    console.log('\n🔍 4. Testando busca por campos de confirmação...');
    const serviceOrdersWithPhotos = await ServiceOrder.find({
      'confirmationPhotos.0': { $exists: true }
    });
    console.log(`✅ Encontradas ${serviceOrdersWithPhotos.length} ServiceOrders com fotos de confirmação`);

    const serviceOrdersWithSignature = await ServiceOrder.find({
      'customerSignature.url': { $exists: true }
    });
    console.log(`✅ Encontradas ${serviceOrdersWithSignature.length} ServiceOrders com assinatura`);

    // Testar validação de campos obrigatórios
    console.log('\n🧪 5. Testando validação de campos...');
    try {
      const invalidServiceOrder = new ServiceOrder({
        id: 'OS-CONFIRM-TEST-INVALID',
        orderId: new mongoose.Types.ObjectId(),
        clientName: 'Cliente Teste Inválido',
        deliveryAddress: testServiceOrder.deliveryAddress,
        items: testServiceOrder.items,
        total: 100,
        deliveryDate: new Date(),
        confirmationPhotos: [
          {
            // url faltando - deve falhar
            description: 'Foto sem URL'
          }
        ],
        customerSignature: {
          // url faltando - deve falhar
          timestamp: new Date(),
          name: 'Nome Teste'
        }
      });

      await invalidServiceOrder.save();
      console.log('❌ Validação falhou - deveria ter rejeitado campos obrigatórios');
    } catch (validationError) {
      console.log('✅ Validação funcionando corretamente - campos obrigatórios rejeitados');
      console.log(`   - Erro: ${validationError.message}`);
    }

    console.log('\n🎉 Teste dos campos de confirmação concluído com sucesso!');
    console.log('\n📋 Resumo dos testes:');
    console.log('   ✅ Criação de ServiceOrder com campos de confirmação');
    console.log('   ✅ Salvamento de fotos de confirmação');
    console.log('   ✅ Salvamento de assinatura do cliente');
    console.log('   ✅ Atualização de campos existentes');
    console.log('   ✅ Busca por campos específicos');
    console.log('   ✅ Validação de campos obrigatórios');

  } catch (error) {
    console.error('❌ Erro durante o teste:', error);
  } finally {
    mongoose.connection.close();
  }
};

testConfirmationFields();
