import type { Material, Service, Product, Quote, User, Supplier, Invoice, Order, ServiceOrder, StockItem, Client, Opportunity, AgendaEvent, Note, FinancialTransaction, ProductionProfessional, PaymentMethod, Address, Equipment, MaintenanceLog, ProductionEmployee, ActivityLog, Vehicle, DeliveryRoute, ChecklistTemplate } from '../types';

export const mockUsers: User[] = [
    { id: 'user-1', name: 'Admin', role: 'admin' },
    { id: 'user-2', name: 'João (Vendedor)', role: 'vendedor' },
    { id: 'user-3', name: 'Maria (Produção)', role: 'producao' },
    { id: 'user-4', name: 'Carlos (Admin. Aux.)', role: 'aux_administrativo' },
    { id: 'user-5', name: 'Pedro (Produção)', role: 'producao' },
    { id: 'user-6', name: 'Ana (Produção)', role: 'producao' },
];

export const mockProductionEmployees: ProductionEmployee[] = [
    { 
        id: 'emp-1', 
        name: 'Marcos Silva', 
        role: 'cortador',
        phone: '(11) 99999-1111',
        email: 'marcos.silva@marmoraria.com',
        isActive: true,
        hireDate: '2023-01-15',
        createdAt: '2023-01-15T08:00:00Z'
    },
    { 
        id: 'emp-2', 
        name: 'Paulo Costa', 
        role: 'cortador',
        phone: '(11) 99999-2222',
        email: 'paulo.costa@marmoraria.com',
        isActive: true,
        hireDate: '2023-02-20',
        createdAt: '2023-02-20T08:00:00Z'
    },
    { 
        id: 'emp-3', 
        name: 'Ricardo Alves', 
        role: 'acabador',
        phone: '(11) 99999-3333',
        email: 'ricardo.alves@marmoraria.com',
        isActive: true,
        hireDate: '2023-03-10',
        createdAt: '2023-03-10T08:00:00Z'
    },
    { 
        id: 'emp-4', 
        name: 'Sérgio Lima', 
        role: 'acabador',
        phone: '(11) 99999-4444',
        email: 'sergio.lima@marmoraria.com',
        isActive: true,
        hireDate: '2023-04-05',
        createdAt: '2023-04-05T08:00:00Z'
    },
    { 
        id: 'emp-5', 
        name: 'Luiz Pereira', 
        role: 'montador',
        phone: '(11) 99999-5555',
        email: 'luiz.pereira@marmoraria.com',
        isActive: true,
        hireDate: '2023-05-12',
        createdAt: '2023-05-12T08:00:00Z'
    },
    { 
        id: 'emp-6', 
        name: 'Fernando Souza', 
        role: 'entregador',
        phone: '(11) 99999-6666',
        email: 'fernando.souza@marmoraria.com',
        isActive: true,
        hireDate: '2023-06-18',
        createdAt: '2023-06-18T08:00:00Z'
    },
    { 
        id: 'emp-7', 
        name: 'Roberto Carlos', 
        role: 'entregador',
        phone: '(11) 99999-7777',
        email: 'roberto.carlos@marmoraria.com',
        isActive: true,
        hireDate: '2023-07-25',
        createdAt: '2023-07-25T08:00:00Z'
    },
    { 
        id: 'emp-8', 
        name: 'Carlos Eduardo', 
        role: 'supervisor',
        phone: '(11) 99999-8888',
        email: 'carlos.eduardo@marmoraria.com',
        isActive: true,
        hireDate: '2022-12-01',
        createdAt: '2022-12-01T08:00:00Z'
    },
    { 
        id: 'emp-9', 
        name: 'Ana Paula', 
        role: 'auxiliar',
        phone: '(11) 99999-9999',
        email: 'ana.paula@marmoraria.com',
        isActive: true,
        hireDate: '2023-08-10',
        createdAt: '2023-08-10T08:00:00Z'
    }
];

// Manter compatibilidade com o sistema antigo
export const mockProductionProfessionals: ProductionProfessional[] = mockProductionEmployees;

export const mockClients: Client[] = [
    { id: 'cli-1', name: 'João da Silva', type: 'pessoa_fisica', email: 'joao.silva@example.com', phone: '(11) 98765-4321', address: { address: 'Rua das Flores', number: '123', complement: 'Apto 10', neighborhood: 'Jardins', city: 'São Paulo', uf: 'SP', cep: '01234-567' }, cpfCnpj: '111.222.333-44', createdAt: '2023-11-10T10:00:00Z' },
    { id: 'cli-2', name: 'Maria Oliveira', type: 'pessoa_fisica', email: 'maria.oliveira@example.com', phone: '(21) 91234-5678', address: { address: 'Avenida Copacabana', number: '456', complement: '', neighborhood: 'Copacabana', city: 'Rio de Janeiro', uf: 'RJ', cep: '22020-001' }, cpfCnpj: '222.333.444-55', createdAt: '2024-01-15T14:30:00Z' },
    { id: 'cli-3', name: 'Carlos Souza', type: 'pessoa_fisica', email: 'carlos.souza@example.com', phone: '(31) 99999-8888', address: { address: 'Praça da Liberdade', number: '789', complement: '', neighborhood: 'Savassi', city: 'Belo Horizonte', uf: 'MG', cep: '30140-010' }, cpfCnpj: '333.444.555-66', createdAt: '2024-03-20T11:00:00Z' },
    { id: 'cli-4', name: 'Construtora Alfa', type: 'empresa', email: 'contato@alfa.com', phone: '(11) 3333-4444', address: { address: 'Avenida Paulista', number: '1000', complement: '15º Andar', neighborhood: 'Bela Vista', city: 'São Paulo', uf: 'SP', cep: '01310-100' }, cpfCnpj: '12.345.678/0001-99', createdAt: '2023-09-01T09:00:00Z' },
];

export const mockOpportunities: Opportunity[] = [
    { id: 'opp-1', clientName: 'Fernanda Lima (Arquiteta)', estimatedValue: 15000, status: 'negociacao', salespersonId: 'user-2', createdAt: '2024-07-20T10:00:00Z' },
    { id: 'opp-2', clientName: 'Condomínio Central Park', estimatedValue: 45000, status: 'orcamento_enviado', salespersonId: 'user-2', createdAt: '2024-07-22T15:00:00Z' },
    { id: 'opp-3', clientName: 'Ricardo Mendes', estimatedValue: 5000, status: 'contatado', salespersonId: 'user-2', createdAt: '2024-07-28T09:30:00Z' },
    { id: 'opp-4', clientName: 'Escritório de Advocacia Borges', estimatedValue: 8500, status: 'novo', salespersonId: 'user-2', createdAt: '2024-07-30T11:00:00Z' },
    { id: 'opp-5', clientName: 'Construtora Alfa', estimatedValue: 120000, status: 'ganho', salespersonId: 'user-2', createdAt: '2024-06-15T14:00:00Z' },
];

export const mockAgendaEvents: AgendaEvent[] = [
    { id: 'evt-1', title: 'Medição Apto 101', date: '2024-08-05T10:00:00Z', clientId: 'cli-1', description: 'Confirmar medidas da cozinha e banheiro.', userId: 'user-3' },
    { id: 'evt-2', title: 'Instalação Bancada', date: '2024-08-10T14:00:00Z', clientId: 'cli-3', description: 'Levar equipe completa e material de limpeza.', userId: 'user-5' },
    { id: 'evt-3', title: 'Follow-up com Arquiteta Fernanda', date: '2024-08-06T11:00:00Z', clientId: 'cli-2', description: 'Ligar para discutir ajustes no orçamento do lavabo.', userId: 'user-2' },
];

export const mockNotes: Note[] = [
    { id: 'note-1', clientId: 'cli-1', userId: 'user-2', content: 'Cliente solicitou alteração no acabamento da bancada para meia esquadria.', createdAt: '2024-07-25T15:00:00Z' },
    { id: 'note-2', clientId: 'cli-1', userId: 'user-2', content: 'Orçamento atualizado e reenviado. Cliente ciente do novo valor.', createdAt: '2024-07-26T10:30:00Z' },
    { id: 'note-3', clientId: 'cli-4', userId: 'user-1', content: 'Reunião com o engenheiro da obra para definir cronograma de entrega das pias dos 20 apartamentos.', createdAt: '2024-07-29T16:00:00Z' },
];

export const mockSuppliers: Supplier[] = [
    { id: 'sup-1', name: 'Fornecedor A', contactPerson: 'Carlos Pereira', phone: '(11) 2222-3333', email: 'contato@fornecedora.com', address: { address: 'Rua das Pedras', number: '123', neighborhood: 'Centro', city: 'São Paulo', uf: 'SP', cep: '01234-000' }, cpfCnpj: '11.222.333/0001-44' },
    { id: 'sup-2', name: 'Fornecedor B', contactPerson: 'Ana Souza', phone: '(21) 4444-5555', email: 'vendas@fornecedorb.com.br', address: { address: 'Avenida do Granito', number: '456', neighborhood: 'Lapa', city: 'Rio de Janeiro', uf: 'RJ', cep: '22071-000' }, cpfCnpj: '22.333.444/0001-55' },
    { id: 'sup-3', name: 'Fornecedor C', contactPerson: 'Mariana Lima', phone: '(31) 7777-8888', email: 'comercial@fornecedorc.com', address: { address: 'Praça do Quartzo', number: '789', neighborhood: 'Centro', city: 'Belo Horizonte', uf: 'MG', cep: '30130-141' }, cpfCnpj: '33.444.555/0001-66' },
];

export const mockMaterials: Material[] = [
  { id: 'mat-001', name: 'Mármore Carrara', photoUrl: 'https://images.unsplash.com/photo-1593332934275-a501b4c3565e?q=80&w=400', supplier: 'Fornecedor A', costPerSqM: 450, slabWidth: 3.2, slabHeight: 1.8, sku: 'MC-01', minStockSqM: 10 },
  { id: 'mat-002', name: 'Granito Preto Absoluto', photoUrl: 'https://images.unsplash.com/photo-1629732034447-b2767d7c18b6?q=80&w=400', supplier: 'Fornecedor B', costPerSqM: 600, slabWidth: 3.0, slabHeight: 1.9, sku: 'GPA-02', minStockSqM: 15 },
  { id: 'mat-003', name: 'Quartzo Branco Estelar', photoUrl: 'https://images.unsplash.com/photo-1592393976695-46722d7a26a3?q=80&w=400', supplier: 'Fornecedor C', costPerSqM: 850, slabWidth: 3.1, slabHeight: 1.6, sku: 'QBE-03', minStockSqM: 5 },
];

export const mockStockItems: StockItem[] = [
    { 
        id: 'SLAB-GPA-01', 
        materialId: 'mat-002', 
        photoUrl: 'https://images.unsplash.com/photo-1617092569651-32357211a7a6?q=80&w=400',
        width: 3.0,
        height: 1.9,
        thickness: 2,
        location: 'Pátio A, Rack 2',
        status: 'disponivel',
        createdAt: '2024-07-25T09:00:00Z',
    },
    { 
        id: 'SLAB-GPA-02', 
        materialId: 'mat-002', 
        photoUrl: 'https://images.unsplash.com/photo-1617092569651-32357211a7a6?q=80&w=400',
        width: 3.0,
        height: 1.9,
        thickness: 2,
        location: 'Pátio A, Rack 2',
        status: 'em_corte',
        createdAt: '2024-07-26T10:00:00Z',
    },
    {
        id: 'SLAB-MC-01',
        materialId: 'mat-001',
        photoUrl: 'https://images.unsplash.com/photo-1618244978876-88a44c803867?q=80&w=400',
        width: 3.2,
        height: 1.8,
        thickness: 2,
        location: 'Pátio B, Rack 1',
        status: 'em_acabamento',
        createdAt: '2024-07-27T11:00:00Z',
    },
    {
        id: 'SLAB-QBE-01',
        materialId: 'mat-003',
        photoUrl: 'https://images.unsplash.com/photo-1592393976695-46722d7a26a3?q=80&w=400',
        width: 3.1,
        height: 1.6,
        thickness: 3,
        location: 'Pátio C, Rack 5',
        status: 'reservada',
        createdAt: '2024-07-28T14:00:00Z',
    },
    {
        id: 'REM-GPA-02A',
        materialId: 'mat-002',
        photoUrl: 'https://images.unsplash.com/photo-1617092569651-32357211a7a6?q=80&w=400',
        width: 1.0,
        height: 0.8,
        thickness: 2,
        location: 'Retalhos, Rack 1',
        status: 'em_uso',
        createdAt: '2024-07-29T16:00:00Z',
        parentSlabId: 'SLAB-GPA-02'
    },
    {
        id: 'SLAB-GPA-03',
        materialId: 'mat-002',
        photoUrl: 'https://images.unsplash.com/photo-1617092569651-32357211a7a6?q=80&w=400',
        width: 2.4,
        height: 1.6,
        thickness: 2,
        location: 'Área de Expedição',
        status: 'pronto_para_expedicao',
        createdAt: '2024-07-30T09:30:00Z',
    },
    {
        id: 'REM-MC-01',
        materialId: 'mat-001',
        photoUrl: 'https://images.unsplash.com/photo-1618244978876-88a44c803867?q=80&w=400',
        width: 0.8,
        height: 0.5,
        thickness: 2,
        location: 'Área de Descarte',
        status: 'consumida',
        createdAt: '2024-07-20T08:45:00Z',
        parentSlabId: 'SLAB-MC-01'
    },
];

export const mockServices: Service[] = [
  { id: 'srv-001', name: 'Corte Reto', unit: 'm', price: 50 },
  { id: 'srv-002', name: 'Acabamento Meia Esquadria', unit: 'm', price: 150 },
  { id: 'srv-003', name: 'Furo para Torneira/Válvula', unit: 'un', price: 80 },
  { id: 'srv-004', name: 'Instalação', unit: '%', price: 15 },
];

export const mockProducts: Product[] = [
  { id: 'prd-001', name: 'Cuba Inox Tramontina', cost: 250, price: 400, stock: 20 },
  { id: 'prd-002', name: 'Torneira Monocomando Deca', cost: 400, price: 650, stock: 15 },
];

export const mockQuotes: Quote[] = [
  {
    id: 'ORC-2024-001',
    clientName: 'João da Silva',
    clientEmail: 'joao.silva@example.com',
    clientPhone: '(11) 98765-4321',
    deliveryAddress: { address: 'Rua das Flores', number: '123', complement: 'Apto 10', neighborhood: 'Jardins', city: 'São Paulo', uf: 'SP', cep: '01234-567' },
    status: 'approved',
    items: [
      { id: 'item-1', type: 'material', description: 'Bancada Cozinha - Granito Preto Absoluto', quantity: 1.44, unitPrice: 600, totalPrice: 800, discount: 64, width: 2.4, height: 0.6, materialId: 'mat-002', perimeter: 6 },
      { id: 'item-2', type: 'service', description: 'Acabamento Meia Esquadria', quantity: 6, unitPrice: 150, totalPrice: 900 },
      { id: 'item-3', type: 'product', description: 'Cuba Inox Tramontina', quantity: 1, unitPrice: 400, totalPrice: 400 },
    ],
    paymentMethod: 'cartao_credito',
    installments: 3,
    subtotal: 2100,
    freight: 150,
    total: 2250,
    createdAt: '2024-07-28T10:00:00Z',
    salespersonId: 'user-2',
  },
   {
    id: 'ORC-2024-002',
    clientName: 'Maria Oliveira',
    clientEmail: 'maria.oliveira@example.com',
    clientPhone: '(21) 91234-5678',
    deliveryAddress: { address: 'Avenida Copacabana', number: '456', complement: '', neighborhood: 'Copacabana', city: 'Rio de Janeiro', uf: 'RJ', cep: '22020-001' },
    status: 'sent',
    items: [
      { id: 'item-4', type: 'material', description: 'Lavatório Banheiro - Mármore Carrara', quantity: 0.48, unitPrice: 450, totalPrice: 216, width: 1.2, height: 0.4, materialId: 'mat-001', perimeter: 3.2 },
      { id: 'item-5', type: 'service', description: 'Furo para Torneira/Válvula', quantity: 2, unitPrice: 80, totalPrice: 160 },
    ],
    paymentMethod: 'pix',
    subtotal: 376,
    total: 376,
    createdAt: '2024-02-29T14:30:00Z',
    salespersonId: 'user-2',
  },
  {
    id: 'ORC-2024-003',
    clientName: 'Carlos Souza',
    clientEmail: 'carlos.souza@example.com',
    clientPhone: '(31) 99999-8888',
    deliveryAddress: { address: 'Praça da Liberdade', number: '789', complement: '', neighborhood: 'Savassi', city: 'Belo Horizonte', uf: 'MG', cep: '30140-010' },
    status: 'approved',
    items: [
      { id: 'item-6', type: 'material', description: 'Soleira Quartzo Branco', quantity: 1.2, unitPrice: 850, totalPrice: 1020, width: 2.0, height: 0.6, materialId: 'mat-003', perimeter: 5.2 },
    ],
    paymentMethod: 'boleto',
    subtotal: 1020,
    discount: 100,
    total: 920,
    createdAt: '2024-07-30T11:00:00Z',
    salespersonId: 'user-2',
  },
];

export const mockOrders: Order[] = [
    {
        id: 'PED-2024-001',
        originalQuoteId: 'ORC-2024-001',
        clientName: 'João da Silva',
        deliveryAddress: { address: 'Rua das Flores', number: '123', complement: 'Apto 10', neighborhood: 'Jardins', city: 'São Paulo', uf: 'SP', cep: '01234-567' },
        items: mockQuotes[0].items,
        paymentMethod: 'cartao_credito',
        installments: 3,
        subtotal: 2100,
        freight: 150,
        total: 2250,
        approvalDate: '2024-07-28T10:00:00Z',
        salespersonId: 'user-2',
        serviceOrderIds: ['OS-2024-001'],
    },
    {
        id: 'PED-2024-002',
        originalQuoteId: 'ORC-2024-003',
        clientName: 'Carlos Souza',
        deliveryAddress: { address: 'Praça da Liberdade', number: '789', complement: '', neighborhood: 'Savassi', city: 'Belo Horizonte', uf: 'MG', cep: '30140-010' },
        items: mockQuotes[2].items,
        paymentMethod: 'boleto',
        subtotal: 1020,
        discount: 100,
        total: 920,
        approvalDate: '2024-07-30T11:00:00Z',
        salespersonId: 'user-2',
        serviceOrderIds: ['OS-2024-002'],
    }
];

export const mockServiceOrders: ServiceOrder[] = [
    {
        id: 'OS-2024-001',
        orderId: 'PED-2024-001',
        clientName: 'João da Silva',
        deliveryAddress: mockOrders[0].deliveryAddress,
        items: mockOrders[0].items,
        total: 2250,
        deliveryDate: '2024-08-15T17:00:00Z',
        assignedToIds: ['prof-1', 'prof-3'],
        status: 'scheduled',
        requiresInstallation: true, // Bancada de cozinha precisa de instalação
        observations: 'Cliente pediu para ter cuidado extra com o acabamento da pia da cozinha. Verificar medidas no local antes do corte final.',
        deliveryStart: '2024-08-03T12:00:00Z',
        deliveryEnd: '2024-08-03T18:00:00Z',
        vehicleId: 'veh-3',
        deliveryTeamIds: ['emp-6', 'emp-7'],
        departureChecklist: [
            { id: 'chk-001', text: 'Conferir itens carregados', checked: true },
            { id: 'chk-002', text: 'Validar documentação de entrega', checked: true },
            { id: 'chk-003', text: 'Registrar fotos antes da saída', checked: false },
        ],
    },
    {
        id: 'OS-2024-002',
        orderId: 'PED-2024-002',
        clientName: 'Carlos Souza',
        deliveryAddress: mockOrders[1].deliveryAddress,
        items: mockOrders[1].items,
        total: 920,
        deliveryDate: '2024-08-20T17:00:00Z',
        assignedToIds: ['prof-2'],
        status: 'completed',
        requiresInstallation: false, // Soleira é apenas entrega
        observations: '',
        deliveryStart: '2024-07-28T12:00:00Z',
        deliveryEnd: '2024-07-28T15:00:00Z',
        vehicleId: 'veh-1',
        deliveryTeamIds: ['emp-6'],
        departureChecklist: [
            { id: 'chk-004', text: 'Verificar embalagem', checked: true },
            { id: 'chk-005', text: 'Coletar assinatura do responsável', checked: true },
        ],
    },
    {
        id: 'OS-2024-003',
        orderId: 'PED-2024-002', // Another OS for the same order, maybe?
        clientName: 'Maria Oliveira',
        deliveryAddress: mockClients[1].address,
        items: [mockQuotes[1].items[0]], // just one item
        total: 216,
        deliveryDate: '2024-08-22T17:00:00Z',
        assignedToIds: [],
        status: 'scheduled',
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
    },
    // OSs adicionais para testes de exceção
    {
        id: 'OS-2024-004',
        orderId: 'PED-2024-003',
        clientName: 'Ana Santos',
        deliveryAddress: { address: 'Rua das Palmeiras', number: '456', complement: '', neighborhood: 'Centro', city: 'São Paulo', uf: 'SP', cep: '01000-000' },
        items: [
            { id: 'item-7', type: 'material', description: 'Pia de Cozinha - Granito Branco', quantity: 1.2, unitPrice: 800, totalPrice: 960, width: 1.2, height: 0.6, materialId: 'mat-001', perimeter: 3.6 }
        ],
        total: 960,
        deliveryDate: '2024-08-25T17:00:00Z',
        assignedToIds: ['prof-1'],
        status: 'finishing',
        requiresInstallation: true,
        observations: 'Teste para marcar como rework_needed',
        allocatedSlabId: 'SLAB-GPA-01',
    },
    {
        id: 'OS-2024-005',
        orderId: 'PED-2024-004',
        clientName: 'Pedro Costa',
        deliveryAddress: { address: 'Avenida Paulista', number: '1000', complement: 'Sala 501', neighborhood: 'Bela Vista', city: 'São Paulo', uf: 'SP', cep: '01310-100' },
        items: [
            { id: 'item-8', type: 'material', description: 'Bancada Escritório - Quartzo Cinza', quantity: 2.0, unitPrice: 700, totalPrice: 1400, width: 2.0, height: 0.8, materialId: 'mat-002', perimeter: 5.6 }
        ],
        total: 1400,
        deliveryDate: '2024-08-28T17:00:00Z',
        assignedToIds: ['prof-2'],
        status: 'in_transit',
        requiresInstallation: false,
        observations: 'Teste para marcar como delivery_issue',
        deliveryStart: '2024-08-28T10:00:00Z',
        deliveryEnd: '2024-08-28T16:00:00Z',
        vehicleId: 'veh-1',
        deliveryTeamIds: ['emp-6'],
    },
    {
        id: 'OS-2024-006',
        orderId: 'PED-2024-005',
        clientName: 'Lucia Ferreira',
        deliveryAddress: { address: 'Rua Augusta', number: '200', complement: 'Apto 15', neighborhood: 'Consolação', city: 'São Paulo', uf: 'SP', cep: '01305-000' },
        items: [
            { id: 'item-9', type: 'material', description: 'Mesa de Jantar - Mármore Travertino', quantity: 3.0, unitPrice: 900, totalPrice: 2700, width: 2.0, height: 1.0, materialId: 'mat-003', perimeter: 6.0 }
        ],
        total: 2700,
        deliveryDate: '2024-08-30T17:00:00Z',
        assignedToIds: ['prof-3'],
        status: 'awaiting_installation',
        requiresInstallation: true,
        observations: 'Teste para marcar como installation_pending_review',
        deliveryStart: '2024-08-30T09:00:00Z',
        deliveryEnd: '2024-08-30T15:00:00Z',
        vehicleId: 'veh-3',
        deliveryTeamIds: ['emp-7'],
        delivery_confirmed: true,
    }
];

export const mockDeliveryRoutes: DeliveryRoute[] = [
    {
        id: 'route-1',
        vehicleId: 'veh-3',
        serviceOrderId: 'OS-2024-001',
        start: '2024-08-03T12:00:00Z',
        end: '2024-08-03T18:00:00Z',
        status: 'scheduled',
        notes: 'Separar equipe para instalação completa na residência.',
        createdAt: '2024-07-30T09:00:00Z',
        updatedAt: '2024-07-30T09:00:00Z'
    },
    {
        id: 'route-2',
        vehicleId: 'veh-1',
        serviceOrderId: 'OS-2024-003',
        start: '2024-08-05T13:00:00Z',
        end: '2024-08-05T17:00:00Z',
        status: 'scheduled',
        notes: 'Entrega com instalação leve. Confirmar acesso ao elevador.',
        createdAt: '2024-08-01T08:00:00Z',
        updatedAt: '2024-08-01T08:00:00Z'
    },
    {
        id: 'route-3',
        vehicleId: 'veh-1',
        serviceOrderId: 'OS-2024-002',
        start: '2024-07-28T12:00:00Z',
        end: '2024-07-28T15:00:00Z',
        status: 'completed',
        createdAt: '2024-07-20T10:00:00Z',
        updatedAt: '2024-07-28T16:00:00Z'
    }
];


export const mockInvoices: Invoice[] = [
    {
        id: 'NF-001',
        orderId: 'PED-2024-001',
        clientName: 'João da Silva',
        total: 2250,
        status: 'issued',
        issueDate: '2024-07-29T10:00:00Z',
        createdAt: '2024-07-28T11:00:00Z'
    }
];

const today = new Date();
const getFutureDate = (days: number) => {
    const date = new Date();
    date.setDate(today.getDate() + days);
    return date.toISOString();
};
const getPastDate = (days: number) => {
    const date = new Date();
    date.setDate(today.getDate() - days);
    return date.toISOString();
}


export const mockFinancialTransactions: FinancialTransaction[] = [
    {
        id: 'fin-1-1',
        description: 'Parcela 1/3 - Pedido PED-2024-001',
        amount: 750,
        type: 'receita',
        status: 'pendente',
        dueDate: getFutureDate(30),
        relatedOrderId: 'PED-2024-001',
        relatedClientId: 'cli-1',
        paymentMethod: 'cartao_credito',
    },
    {
        id: 'fin-1-2',
        description: 'Parcela 2/3 - Pedido PED-2024-001',
        amount: 750,
        type: 'receita',
        status: 'pendente',
        dueDate: getFutureDate(60),
        relatedOrderId: 'PED-2024-001',
        relatedClientId: 'cli-1',
        paymentMethod: 'cartao_credito',
    },
    {
        id: 'fin-1-3',
        description: 'Parcela 3/3 - Pedido PED-2024-001',
        amount: 750,
        type: 'receita',
        status: 'pendente',
        dueDate: getFutureDate(90),
        relatedOrderId: 'PED-2024-001',
        relatedClientId: 'cli-1',
        paymentMethod: 'cartao_credito',
    },
    {
        id: 'fin-2',
        description: 'Recebimento Pedido PED-2024-002',
        amount: 920,
        type: 'receita',
        status: 'pago',
        dueDate: getPastDate(5),
        paymentDate: getPastDate(4),
        relatedOrderId: 'PED-2024-002',
        relatedClientId: 'cli-3',
        paymentMethod: 'boleto',
    },
    {
        id: 'fin-3',
        description: 'Pagamento Fornecedor B',
        amount: 3500,
        type: 'despesa',
        status: 'pago',
        dueDate: getPastDate(15),
        paymentDate: getPastDate(15),
    },
     {
        id: 'fin-4',
        description: 'Salários',
        amount: 12500,
        type: 'despesa',
        status: 'pendente',
        dueDate: getFutureDate(5),
    },
    {
        id: 'fin-5',
        description: 'Aluguel',
        amount: 4500,
        type: 'despesa',
        status: 'pendente',
        dueDate: getFutureDate(8),
    },
     {
        id: 'fin-6',
        description: 'Recebimento adiantado Construtora Alfa',
        amount: 15000,
        type: 'receita',
        status: 'pago',
        dueDate: getPastDate(2),
        paymentDate: getPastDate(2),
        relatedClientId: 'cli-4',
        paymentMethod: 'pix',
    },
];

export const mockEquipment: Equipment[] = [
    {
        id: 'eq-1',
        name: 'Máquina de Corte CNC',
        serialNumber: 'CNC-2023-001',
        category: 'maquina',
        purchaseDate: '2023-01-15',
        warrantyEndDate: '2025-01-15',
        purchaseInvoiceNumber: 'NF-2023-001',
        supplierCnpj: '12.345.678/0001-90',
        assignedTo: 'emp-1', // Marcos Silva - Cortador
        status: 'operacional',
        currentLocation: 'Galpão A - Setor de Corte',
        notes: 'Necessita calibração mensal.',
        createdAt: '2023-01-15T10:00:00Z',
        updatedAt: '2023-01-15T10:00:00Z'
    },
    {
        id: 'eq-2',
        name: 'Polimento Automático',
        serialNumber: 'POL-2023-002',
        category: 'maquina',
        purchaseDate: '2023-03-20',
        warrantyEndDate: '2025-03-20',
        purchaseInvoiceNumber: 'NF-2023-015',
        supplierCnpj: '98.765.432/0001-11',
        assignedTo: 'emp-3', // Ricardo Alves - Acabador
        status: 'operacional',
        currentLocation: 'Galpão B - Acabamento',
        createdAt: '2023-03-20T14:30:00Z',
        updatedAt: '2023-03-20T14:30:00Z'
    },
    {
        id: 'eq-3',
        name: 'Furadeira Industrial',
        serialNumber: 'FUR-2022-008',
        category: 'maquina',
        purchaseDate: '2022-08-10',
        warrantyEndDate: '2024-08-10',
        purchaseInvoiceNumber: 'NF-2022-045',
        supplierCnpj: '54.321.987/0001-22',
        assignedTo: 'emp-5', // Luiz Pereira - Montador
        status: 'em_manutencao',
        currentLocation: 'Oficina de Manutenção',
        notes: 'Em manutenção preventiva.',
        createdAt: '2022-08-10T09:15:00Z',
        updatedAt: '2024-07-25T16:20:00Z'
    },
    {
        id: 'eq-4',
        name: 'Serra Circular',
        serialNumber: 'SER-2021-003',
        category: 'maquina',
        purchaseDate: '2021-12-05',
        warrantyEndDate: '2023-12-05',
        purchaseInvoiceNumber: 'NF-2021-089',
        supplierCnpj: '45.678.123/0001-55',
        assignedTo: 'emp-2', // Paulo Costa - Cortador
        status: 'operacional',
        currentLocation: 'Galpão A - Área de Corte',
        createdAt: '2021-12-05T11:45:00Z',
        updatedAt: '2021-12-05T11:45:00Z'
    },
    {
        id: 'eq-5',
        name: 'Compressor de Ar',
        serialNumber: 'COM-2023-005',
        category: 'maquina',
        purchaseDate: '2023-06-12',
        warrantyEndDate: '2025-06-12',
        purchaseInvoiceNumber: 'NF-2023-032',
        supplierCnpj: '23.456.789/0001-33',
        assignedTo: 'emp-8', // Carlos Eduardo - Supervisor
        status: 'operacional',
        currentLocation: 'Sala de Compressores',
        createdAt: '2023-06-12T13:20:00Z',
        updatedAt: '2023-06-12T13:20:00Z'
    },
    {
        id: 'eq-6',
        name: 'Van de Entrega',
        serialNumber: 'VAN-2023-001',
        category: 'veiculo',
        purchaseDate: '2023-02-10',
        warrantyEndDate: '2025-02-10',
        purchaseInvoiceNumber: 'NF-2023-008',
        supplierCnpj: '34.567.891/0001-77',
        assignedTo: 'emp-6', // Fernando Souza - Entregador
        status: 'operacional',
        currentLocation: 'Pátio Externo',
        notes: 'Verificar pneus mensalmente.',
        createdAt: '2023-02-10T08:00:00Z',
        updatedAt: '2023-02-10T08:00:00Z'
    },
    {
        id: 'eq-7',
        name: 'Caminhão Pequeno',
        serialNumber: 'CAM-2022-003',
        category: 'veiculo',
        purchaseDate: '2022-11-15',
        warrantyEndDate: '2024-11-15',
        purchaseInvoiceNumber: 'NF-2022-078',
        supplierCnpj: '67.890.123/0001-44',
        assignedTo: 'emp-7', // Roberto Carlos - Entregador
        status: 'operacional',
        currentLocation: 'Garagem Coberta',
        createdAt: '2022-11-15T10:30:00Z',
        updatedAt: '2022-11-15T10:30:00Z'
    },
    {
        id: 'eq-8',
        name: 'Moto de Entrega',
        serialNumber: 'MOT-2023-002',
        category: 'veiculo',
        purchaseDate: '2023-04-20',
        warrantyEndDate: '2025-04-20',
        purchaseInvoiceNumber: 'NF-2023-025',
        supplierCnpj: '11.222.333/0001-66',
        assignedTo: 'emp-6', // Fernando Souza - Entregador
        status: 'em_manutencao',
        currentLocation: 'Oficina de Terceiros',
        createdAt: '2023-04-20T14:15:00Z',
        updatedAt: '2024-08-01T09:00:00Z'
    }
];

export const mockVehicles: Vehicle[] = [
    {
        id: 'veh-1',
        name: 'Van 01',
        licensePlate: 'ABC1D23',
        capacity: 1200,
        type: 'van',
        status: 'disponivel',
        notes: 'Ideal para entregas urbanas e clientes com acesso limitado.',
        createdAt: '2024-01-10T12:00:00Z',
        updatedAt: '2024-07-01T10:00:00Z'
    },
    {
        id: 'veh-2',
        name: 'Caminhão Grande',
        licensePlate: 'XYZ4E56',
        capacity: 3600,
        type: 'caminhao',
        status: 'em_manutencao',
        notes: 'Revisão completa agendada para a próxima semana.',
        createdAt: '2023-11-04T08:30:00Z',
        updatedAt: '2024-07-25T09:00:00Z'
    },
    {
        id: 'veh-3',
        name: 'Van 02',
        licensePlate: 'JKL7M89',
        capacity: 1400,
        type: 'van',
        status: 'em_uso',
        notes: 'Reservada para rotas na região metropolitana.',
        createdAt: '2024-03-18T14:10:00Z',
        updatedAt: '2024-07-29T16:45:00Z'
    }
];

export const mockMaintenanceLogs: MaintenanceLog[] = [
    {
        id: 'maint-1',
        equipmentId: 'eq-1',
        maintenanceDate: '2024-06-15',
        description: 'Manutenção preventiva - limpeza e lubrificação dos eixos',
        cost: 250.00,
        performedBy: 'Técnica Industrial Ltda',
        companyCnpj: '12.345.678/0001-90',
        invoiceNumber: 'NF-MAN-2024-001',
        nextMaintenanceDate: '2024-12-15',
        maintenanceWarrantyDate: '2025-06-15',
        warrantyClaim: false,
        createdAt: '2024-06-15T10:00:00Z'
    },
    {
        id: 'maint-2',
        equipmentId: 'eq-2',
        maintenanceDate: '2024-05-20',
        description: 'Troca de discos de polimento e ajuste da pressão',
        cost: 180.00,
        performedBy: 'Equipamentos Industriais S.A.',
        companyCnpj: '98.765.432/0001-10',
        invoiceNumber: 'NF-MAN-2024-002',
        nextMaintenanceDate: '2024-11-20',
        maintenanceWarrantyDate: '2025-05-20',
        warrantyClaim: false,
        createdAt: '2024-05-20T14:30:00Z'
    },
    {
        id: 'maint-3',
        equipmentId: 'eq-3',
        maintenanceDate: '2024-07-25',
        description: 'Reparo no motor - substituição de rolamentos',
        cost: 450.00,
        performedBy: 'Manutenção Express Ltda',
        companyCnpj: '11.222.333/0001-44',
        invoiceNumber: 'NF-MAN-2024-003',
        warrantyClaim: true,
        createdAt: '2024-07-25T16:20:00Z'
    },
    {
        id: 'maint-4',
        equipmentId: 'eq-1',
        maintenanceDate: '2024-01-10',
        description: 'Calibração da precisão de corte',
        cost: 320.00,
        performedBy: 'Técnica Industrial Ltda',
        companyCnpj: '12.345.678/0001-90',
        invoiceNumber: 'NF-MAN-2024-004',
        nextMaintenanceDate: '2024-07-10',
        maintenanceWarrantyDate: '2025-01-10',
        warrantyClaim: false,
        createdAt: '2024-01-10T09:00:00Z'
    },
    {
        id: 'maint-5',
        equipmentId: 'eq-4',
        maintenanceDate: '2024-03-15',
        description: 'Troca de lâmina e verificação do sistema de segurança',
        cost: 95.00,
        performedBy: 'Ferramentas & Manutenção Ltda',
        companyCnpj: '55.666.777/0001-88',
        invoiceNumber: 'NF-MAN-2024-005',
        nextMaintenanceDate: '2024-09-15',
        maintenanceWarrantyDate: '2025-03-15',
        warrantyClaim: false,
        createdAt: '2024-03-15T11:30:00Z'
    }
];

export const mockActivityLogs: ActivityLog[] = [
    {
        id: 'act-1',
        timestamp: '2024-08-01T10:30:00Z',
        userId: 'user-2',
        userName: 'João (Vendedor)',
        activityType: 'quote_created',
        activityTypeLabel: 'Orçamento Criado',
        relatedEntityType: 'quote',
        relatedEntityId: 'ORC-2024-001',
        relatedEntityName: 'Orçamento para João da Silva',
        details: {
            clientName: 'João da Silva',
            totalValue: 2250,
            itemsCount: 2
        },
        createdAt: '2024-08-01T10:30:00Z'
    },
    {
        id: 'act-2',
        timestamp: '2024-08-01T11:15:00Z',
        userId: 'user-2',
        userName: 'João (Vendedor)',
        activityType: 'quote_sent',
        activityTypeLabel: 'Orçamento Enviado',
        relatedEntityType: 'quote',
        relatedEntityId: 'ORC-2024-001',
        relatedEntityName: 'Orçamento para João da Silva',
        details: {
            sentTo: 'joao.silva@example.com',
            method: 'email'
        },
        createdAt: '2024-08-01T11:15:00Z'
    },
    {
        id: 'act-3',
        timestamp: '2024-08-01T14:20:00Z',
        userId: 'user-1',
        userName: 'Admin',
        activityType: 'quote_approved',
        activityTypeLabel: 'Orçamento Aprovado',
        relatedEntityType: 'quote',
        relatedEntityId: 'ORC-2024-001',
        relatedEntityName: 'Orçamento para João da Silva',
        details: {
            approvedBy: 'Admin',
            approvedAt: '2024-08-01T14:20:00Z'
        },
        createdAt: '2024-08-01T14:20:00Z'
    },
    {
        id: 'act-4',
        timestamp: '2024-08-01T14:25:00Z',
        userId: 'user-1',
        userName: 'Admin',
        activityType: 'order_created',
        activityTypeLabel: 'Pedido Criado',
        relatedEntityType: 'order',
        relatedEntityId: 'PED-2024-001',
        relatedEntityName: 'Pedido PED-2024-001',
        details: {
            originalQuoteId: 'ORC-2024-001',
            clientName: 'João da Silva',
            totalValue: 2250
        },
        createdAt: '2024-08-01T14:25:00Z'
    },
    {
        id: 'act-5',
        timestamp: '2024-08-02T09:00:00Z',
        userId: 'user-3',
        userName: 'Maria (Produção)',
        activityType: 'equipment_created',
        activityTypeLabel: 'Equipamento Adicionado',
        relatedEntityType: 'equipment',
        relatedEntityId: 'eq-1',
        relatedEntityName: 'Máquina de Corte CNC',
        details: {
            serialNumber: 'CNC-2023-001',
            category: 'maquina',
            assignedTo: 'Marcos Silva'
        },
        createdAt: '2024-08-02T09:00:00Z'
    },
    {
        id: 'act-6',
        timestamp: '2024-08-02T10:30:00Z',
        userId: 'user-3',
        userName: 'Maria (Produção)',
        activityType: 'maintenance_created',
        activityTypeLabel: 'Manutenção Registrada',
        relatedEntityType: 'maintenance',
        relatedEntityId: 'maint-1',
        relatedEntityName: 'Manutenção CNC-2023-001',
        details: {
            equipmentName: 'Máquina de Corte CNC',
            cost: 850,
            performedBy: 'Técnica Industrial Ltda',
            warrantyClaim: false
        },
        createdAt: '2024-08-02T10:30:00Z'
    },
    {
        id: 'act-7',
        timestamp: '2024-08-02T11:45:00Z',
        userId: 'user-1',
        userName: 'Admin',
        activityType: 'employee_created',
        activityTypeLabel: 'Funcionário Adicionado',
        relatedEntityType: 'employee',
        relatedEntityId: 'emp-1',
        relatedEntityName: 'Marcos Silva',
        details: {
            role: 'cortador',
            phone: '(11) 99999-1111',
            hireDate: '2023-01-15'
        },
        createdAt: '2024-08-02T11:45:00Z'
    },
    {
        id: 'act-8',
        timestamp: '2024-08-02T14:00:00Z',
        userId: 'user-3',
        userName: 'Maria (Produção)',
        activityType: 'delivery_scheduled',
        activityTypeLabel: 'Entrega Agendada',
        relatedEntityType: 'service_order',
        relatedEntityId: 'OS-2024-001',
        relatedEntityName: 'OS-2024-001',
        details: {
            clientName: 'João da Silva',
            scheduledDate: '2024-08-15',
            teamMembers: ['Fernando Souza', 'Roberto Carlos']
        },
        createdAt: '2024-08-02T14:00:00Z'
    },
    {
        id: 'act-9',
        timestamp: '2024-08-03T08:30:00Z',
        userId: 'user-2',
        userName: 'João (Vendedor)',
        activityType: 'client_created',
        activityTypeLabel: 'Cliente Criado',
        relatedEntityType: 'client',
        relatedEntityId: 'cli-5',
        relatedEntityName: 'Ana Costa',
        details: {
            type: 'pessoa_fisica',
            email: 'ana.costa@example.com',
            phone: '(11) 99999-5555'
        },
        createdAt: '2024-08-03T08:30:00Z'
    },
    {
        id: 'act-10',
        timestamp: '2024-08-03T16:20:00Z',
        userId: 'user-1',
        userName: 'Admin',
        activityType: 'user_login',
        activityTypeLabel: 'Login Realizado',
        relatedEntityType: 'user',
        relatedEntityId: 'user-1',
        relatedEntityName: 'Admin',
        details: {
            loginTime: '2024-08-03T16:20:00Z',
            ipAddress: '192.168.1.100'
        },
        createdAt: '2024-08-03T16:20:00Z'
    }
];

// Checklists de Entrega e Instalação
export const mockChecklistTemplates: ChecklistTemplate[] = [
    {
        id: 'checklist-1',
        name: 'Checklist Padrão de Entrega',
        type: 'entrega',
        items: [
            { id: '1', text: 'Verificar se o material está limpo e sem danos' },
            { id: '2', text: 'Conferir quantidade de peças com a nota fiscal' },
            { id: '3', text: 'Validar dimensões das peças' },
            { id: '4', text: 'Verificar embalagem e proteção adequada' },
            { id: '5', text: 'Conferir localização de entrega e acesso' },
            { id: '6', text: 'Garantir que o cliente está presente para receber' },
            { id: '7', text: 'Obter assinatura do cliente no termo de recebimento' },
            { id: '8', text: 'Fotografar o material entregue' },
            { id: '9', text: 'Registrar horário de chegada e saída' },
            { id: '10', text: 'Anotar observações relevantes' }
        ],
        createdAt: '2024-01-01T08:00:00Z',
        updatedAt: '2024-01-01T08:00:00Z'
    },
    {
        id: 'checklist-2',
        name: 'Checklist Completo de Instalação',
        type: 'montagem',
        items: [
            { id: '1', text: 'Conferir todas as peças antes de iniciar' },
            { id: '2', text: 'Verificar ferramentas e equipamentos necessários' },
            { id: '3', text: 'Avaliar local de instalação (nivelamento, umidade)' },
            { id: '4', text: 'Proteger móveis e áreas adjacentes' },
            { id: '5', text: 'Realizar medições finais e confirmar projeto' },
            { id: '6', text: 'Executar furação e fixação conforme projeto' },
            { id: '7', text: 'Aplicar selantes e rejuntes adequados' },
            { id: '8', text: 'Realizar acabamento e polimento' },
            { id: '9', text: 'Limpar local e remover detritos' },
            { id: '10', text: 'Apresentar resultado final ao cliente' },
            { id: '11', text: 'Obter assinatura no termo de instalação' },
            { id: '12', text: 'Fotografar instalação finalizada' },
            { id: '13', text: 'Fornecer instruções de manutenção ao cliente' }
        ],
        createdAt: '2024-01-01T08:00:00Z',
        updatedAt: '2024-01-01T08:00:00Z'
    },
    {
        id: 'checklist-3',
        name: 'Checklist Rápido de Entrega',
        type: 'entrega',
        items: [
            { id: '1', text: 'Conferir nota fiscal' },
            { id: '2', text: 'Verificar integridade do material' },
            { id: '3', text: 'Confirmar endereço de entrega' },
            { id: '4', text: 'Obter assinatura do recebedor' },
            { id: '5', text: 'Tirar foto do material entregue' }
        ],
        createdAt: '2024-01-15T08:00:00Z',
        updatedAt: '2024-01-15T08:00:00Z'
    },
    {
        id: 'checklist-4',
        name: 'Checklist Instalação de Bancada',
        type: 'montagem',
        items: [
            { id: '1', text: 'Conferir medidas da bancada' },
            { id: '2', text: 'Verificar nivelamento da base' },
            { id: '3', text: 'Preparar cola e fixadores' },
            { id: '4', text: 'Posicionar bancada cuidadosamente' },
            { id: '5', text: 'Fixar com segurança' },
            { id: '6', text: 'Aplicar silicone nas juntas' },
            { id: '7', text: 'Instalar cuba e torneira (se aplicável)' },
            { id: '8', text: 'Limpar e polir superfície' },
            { id: '9', text: 'Testar torneiras e louças' },
            { id: '10', text: 'Registrar conclusão com foto' }
        ],
        createdAt: '2024-02-01T08:00:00Z',
        updatedAt: '2024-02-01T08:00:00Z'
    },
    {
        id: 'checklist-5',
        name: 'Checklist Instalação de Revestimento',
        type: 'montagem',
        items: [
            { id: '1', text: 'Verificar planicidade da parede' },
            { id: '2', text: 'Conferir esquadro e prumo' },
            { id: '3', text: 'Preparar argamassa ou cola' },
            { id: '4', text: 'Iniciar aplicação pelas peças mais visíveis' },
            { id: '5', text: 'Manter espaçamento uniforme' },
            { id: '6', text: 'Verificar alinhamento constantemente' },
            { id: '7', text: 'Realizar recortes com precisão' },
            { id: '8', text: 'Aplicar rejunte após cura' },
            { id: '9', text: 'Limpar excesso de rejunte' },
            { id: '10', text: 'Fazer inspeção final' },
            { id: '11', text: 'Apresentar trabalho concluído ao cliente' }
        ],
        createdAt: '2024-02-15T08:00:00Z',
        updatedAt: '2024-02-15T08:00:00Z'
    }
];