require('dotenv').config();
const mongoose = require('mongoose');
const ServiceOrder = require('../models/ServiceOrder');

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB Connected');
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
};

const seedServiceOrders = async () => {
  try {
    // Limpar OSs existentes
    await ServiceOrder.deleteMany({});
    console.log('🗑️  ServiceOrders existentes removidas');

    // Criar OSs de teste
    const serviceOrders = [
      {
        id: 'OS-2024-001',
        orderId: new mongoose.Types.ObjectId(),
        clientName: 'João da Silva',
        deliveryAddress: {
          address: 'Rua das Flores',
          number: '123',
          complement: 'Apto 10',
          neighborhood: 'Jardins',
          city: 'São Paulo',
          uf: 'SP',
          cep: '01234-567'
        },
        items: [
          {
            id: 'item-1',
            type: 'material',
            description: 'Bancada Cozinha - Granito Preto Absoluto',
            quantity: 1.44,
            unitPrice: 600,
            totalPrice: 800,
            discount: 64,
            width: 2.4,
            height: 0.6,
            materialId: 'mat-002',
            perimeter: 6
          }
        ],
        total: 2250,
        deliveryDate: '2024-08-15T17:00:00Z',
        assignedToIds: ['prof-1', 'prof-3'],
        status: 'scheduled',
        productionStatus: 'pending_production',
        logisticsStatus: 'awaiting_scheduling',
        requiresInstallation: true,
        observations: 'Cliente pediu para ter cuidado extra com o acabamento da pia da cozinha.',
        deliveryStart: '2024-08-03T12:00:00Z',
        deliveryEnd: '2024-08-03T18:00:00Z',
        vehicleId: 'veh-3',
        deliveryTeamIds: ['emp-6', 'emp-7'],
        departureChecklist: [
          { id: 'chk-001', text: 'Conferir itens carregados', checked: true },
          { id: 'chk-002', text: 'Validar documentação de entrega', checked: true },
          { id: 'chk-003', text: 'Registrar fotos antes da saída', checked: false },
        ],
        history: []
      },
      {
        id: 'OS-2024-002',
        orderId: new mongoose.Types.ObjectId(),
        clientName: 'Carlos Souza',
        deliveryAddress: {
          address: 'Avenida Copacabana',
          number: '456',
          complement: '',
          neighborhood: 'Copacabana',
          city: 'Rio de Janeiro',
          uf: 'RJ',
          cep: '22020-001'
        },
        items: [
          {
            id: 'item-4',
            type: 'material',
            description: 'Lavatório Banheiro - Mármore Carrara',
            quantity: 0.48,
            unitPrice: 450,
            totalPrice: 216,
            width: 1.2,
            height: 0.4,
            materialId: 'mat-001',
            perimeter: 3.2
          }
        ],
        total: 920,
        deliveryDate: '2024-08-20T17:00:00Z',
        assignedToIds: ['prof-2'],
        status: 'completed',
        productionStatus: 'awaiting_logistics',
        logisticsStatus: 'completed',
        requiresInstallation: false,
        observations: '',
        deliveryStart: '2024-07-28T12:00:00Z',
        deliveryEnd: '2024-07-28T15:00:00Z',
        vehicleId: 'veh-1',
        deliveryTeamIds: ['emp-6'],
        departureChecklist: [
          { id: 'chk-004', text: 'Verificar embalagem', checked: true },
          { id: 'chk-005', text: 'Coletar assinatura do responsável', checked: true },
        ],
        history: []
      },
      {
        id: 'OS-2024-003',
        orderId: new mongoose.Types.ObjectId(),
        clientName: 'Maria Oliveira',
        deliveryAddress: {
          address: 'Praça da Liberdade',
          number: '789',
          complement: '',
          neighborhood: 'Savassi',
          city: 'Belo Horizonte',
          uf: 'MG',
          cep: '30140-010'
        },
        items: [
          {
            id: 'item-6',
            type: 'material',
            description: 'Soleira Quartzo Branco',
            quantity: 1.2,
            unitPrice: 850,
            totalPrice: 1020,
            width: 2.0,
            height: 0.6,
            materialId: 'mat-003',
            perimeter: 5.2
          }
        ],
        total: 216,
        deliveryDate: '2024-08-22T17:00:00Z',
        assignedToIds: [],
        status: 'scheduled',
        productionStatus: 'pending_production',
        logisticsStatus: 'awaiting_scheduling',
        requiresInstallation: true,
        observations: 'Atenção: Lavatório de Mármore Carrara. Frágil.',
        deliveryStart: '2024-08-05T13:00:00Z',
        deliveryEnd: '2024-08-05T17:00:00Z',
        vehicleId: 'veh-1',
        deliveryTeamIds: ['emp-7'],
        departureChecklist: [
          { id: 'chk-006', text: 'Separar kit de instalação', checked: false },
          { id: 'chk-007', text: 'Revisar medidas no pedido', checked: false },
        ],
        history: []
      },
      // OSs para testes de exceção
      {
        id: 'OS-2024-004',
        orderId: new mongoose.Types.ObjectId(),
        clientName: 'Ana Santos',
        deliveryAddress: {
          address: 'Rua das Palmeiras',
          number: '456',
          complement: '',
          neighborhood: 'Centro',
          city: 'São Paulo',
          uf: 'SP',
          cep: '01000-000'
        },
        items: [
          {
            id: 'item-7',
            type: 'material',
            description: 'Pia de Cozinha - Granito Branco',
            quantity: 1.2,
            unitPrice: 800,
            totalPrice: 960,
            width: 1.2,
            height: 0.6,
            materialId: 'mat-001',
            perimeter: 3.6
          }
        ],
        total: 960,
        deliveryDate: '2024-08-25T17:00:00Z',
        assignedToIds: ['prof-1'],
        status: 'finishing',
        productionStatus: 'finishing',
        logisticsStatus: 'awaiting_scheduling',
        requiresInstallation: true,
        observations: 'Teste para marcar como rework_needed',
        allocatedSlabId: 'SLAB-GPA-01',
        history: []
      },
      {
        id: 'OS-2024-005',
        orderId: new mongoose.Types.ObjectId(),
        clientName: 'Pedro Costa',
        deliveryAddress: {
          address: 'Avenida Paulista',
          number: '1000',
          complement: 'Sala 501',
          neighborhood: 'Bela Vista',
          city: 'São Paulo',
          uf: 'SP',
          cep: '01310-100'
        },
        items: [
          {
            id: 'item-8',
            type: 'material',
            description: 'Bancada Escritório - Quartzo Cinza',
            quantity: 2.0,
            unitPrice: 700,
            totalPrice: 1400,
            width: 2.0,
            height: 0.8,
            materialId: 'mat-002',
            perimeter: 5.6
          }
        ],
        total: 1400,
        deliveryDate: '2024-08-28T17:00:00Z',
        assignedToIds: ['prof-2'],
        status: 'in_transit',
        productionStatus: 'awaiting_logistics',
        logisticsStatus: 'in_transit',
        requiresInstallation: false,
        observations: 'Teste para marcar como delivery_issue',
        deliveryStart: '2024-08-28T10:00:00Z',
        deliveryEnd: '2024-08-28T16:00:00Z',
        vehicleId: 'veh-1',
        deliveryTeamIds: ['emp-6'],
        history: []
      },
      {
        id: 'OS-2024-006',
        orderId: new mongoose.Types.ObjectId(),
        clientName: 'Lucia Ferreira',
        deliveryAddress: {
          address: 'Rua Augusta',
          number: '200',
          complement: 'Apto 15',
          neighborhood: 'Consolação',
          city: 'São Paulo',
          uf: 'SP',
          cep: '01305-000'
        },
        items: [
          {
            id: 'item-9',
            type: 'material',
            description: 'Mesa de Jantar - Mármore Travertino',
            quantity: 3.0,
            unitPrice: 900,
            totalPrice: 2700,
            width: 2.0,
            height: 1.0,
            materialId: 'mat-003',
            perimeter: 6.0
          }
        ],
        total: 2700,
        deliveryDate: '2024-08-30T17:00:00Z',
        assignedToIds: ['prof-3'],
        status: 'awaiting_installation',
        productionStatus: 'awaiting_logistics',
        logisticsStatus: 'in_installation',
        requiresInstallation: true,
        observations: 'Teste para marcar como installation_pending_review',
        deliveryStart: '2024-08-30T09:00:00Z',
        deliveryEnd: '2024-08-30T15:00:00Z',
        vehicleId: 'veh-3',
        deliveryTeamIds: ['emp-7'],
        delivery_confirmed: true,
        history: []
      }
    ];

    await ServiceOrder.insertMany(serviceOrders);
    console.log(`✅ ${serviceOrders.length} ServiceOrders criadas com sucesso!`);
    
    console.log('\n📋 ServiceOrders criadas:');
    serviceOrders.forEach(os => {
      console.log(`   ${os.id} - ${os.clientName} (${os.status})`);
    });

  } catch (error) {
    console.error('❌ Erro ao criar ServiceOrders:', error.message);
  }
};

const runSeed = async () => {
  await connectDB();
  await seedServiceOrders();
  process.exit(0);
};

runSeed();
