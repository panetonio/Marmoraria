import type { Material, Service, Product, Quote, User, Supplier, Invoice, Order, ServiceOrder, StockItem, Client, Opportunity, AgendaEvent, Note, FinancialTransaction, ProductionProfessional, PaymentMethod } from '../types';

export const mockUsers: User[] = [
    { id: 'user-1', name: 'Admin', role: 'admin' },
    { id: 'user-2', name: 'João (Vendedor)', role: 'vendedor' },
    { id: 'user-3', name: 'Maria (Produção)', role: 'producao' },
    { id: 'user-4', name: 'Carlos (Admin. Aux.)', role: 'aux_administrativo' },
    { id: 'user-5', name: 'Pedro (Produção)', role: 'producao' },
    { id: 'user-6', name: 'Ana (Produção)', role: 'producao' },
];

export const mockProductionProfessionals: ProductionProfessional[] = [
    { id: 'prof-1', name: 'Marcos Silva', role: 'cortador' },
    { id: 'prof-2', name: 'Paulo Costa', role: 'cortador' },
    { id: 'prof-3', name: 'Ricardo Alves', role: 'acabador' },
    { id: 'prof-4', name: 'Sérgio Lima', role: 'acabador' },
    { id: 'prof-5', name: 'Luiz Pereira', role: 'montador' },
    { id: 'prof-6', name: 'Fernando Souza', role: 'entregador' },
];

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
        status: 'em_uso',
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
        status: 'reservada',
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
        status: 'disponivel',
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
        status: 'disponivel',
        createdAt: '2024-07-29T16:00:00Z',
        parentSlabId: 'SLAB-GPA-02'
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
        items: mockOrders[0].items,
        total: 2250,
        deliveryDate: '2024-08-15T17:00:00Z',
        assignedToIds: ['prof-1'],
        status: 'cutting'
    },
    {
        id: 'OS-2024-002',
        orderId: 'PED-2024-002',
        clientName: 'Carlos Souza',
        items: mockOrders[1].items,
        total: 920,
        deliveryDate: '2024-08-20T17:00:00Z',
        assignedToIds: [],
        status: 'assembly'
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