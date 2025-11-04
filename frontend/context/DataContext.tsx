import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import type {
    Client, Opportunity, AgendaEvent, Note, Supplier, Material, StockItem,
    Service, Product, Quote, Order, ServiceOrder, Invoice, FinancialTransaction, Receipt, Address, Priority, ProductionStatus, FinalizationType, User, Equipment, MaintenanceLog, ProductionEmployee, ActivityLog, ActivityType, Vehicle, DeliveryRoute, ChecklistTemplate, OrderAddendum, CutPiece
} from '../types';
import {
    mockClients, mockOpportunities, mockAgendaEvents, mockNotes, mockSuppliers,
    mockMaterials, mockStockItems, mockServices, mockProducts, mockQuotes,
    mockOrders, mockServiceOrders, mockInvoices, mockFinancialTransactions,
    mockEquipment, mockMaintenanceLogs, mockProductionEmployees, mockActivityLogs, mockVehicles, mockDeliveryRoutes, mockChecklistTemplates
} from '../data/mockData';

type DeliveryScheduleInput = {
    vehicleId: string;
    start: string;
    end: string;
    teamIds: string[];
};

type DeliveryScheduleResult = {
    success: boolean;
    message?: string;
    route?: DeliveryRoute;
};
import { api } from '../utils/api';
import toast from 'react-hot-toast';

// Define the shape of the context data
interface DataContextType {
    clients: Client[];
    setClients: React.Dispatch<React.SetStateAction<Client[]>>;
    opportunities: Opportunity[];
    setOpportunities: React.Dispatch<React.SetStateAction<Opportunity[]>>;
    agendaEvents: AgendaEvent[];
    setAgendaEvents: React.Dispatch<React.SetStateAction<AgendaEvent[]>>;
    notes: Note[];
    setNotes: React.Dispatch<React.SetStateAction<Note[]>>;
    suppliers: Supplier[];
    setSuppliers: React.Dispatch<React.SetStateAction<Supplier[]>>;
    materials: Material[];
    services: Service[];
    products: Product[];
    stockItems: StockItem[];
    setStockItems: React.Dispatch<React.SetStateAction<StockItem[]>>;
    quotes: Quote[];
    setQuotes: React.Dispatch<React.SetStateAction<Quote[]>>;
    orders: Order[];
    setOrders: React.Dispatch<React.SetStateAction<Order[]>>;
    serviceOrders: ServiceOrder[];
    setServiceOrders: React.Dispatch<React.SetStateAction<ServiceOrder[]>>;
    invoices: Invoice[];
    setInvoices: React.Dispatch<React.SetStateAction<Invoice[]>>;
    financialTransactions: FinancialTransaction[];
    setFinancialTransactions: React.Dispatch<React.SetStateAction<FinancialTransaction[]>>;
    receipts: Receipt[];
    setReceipts: React.Dispatch<React.SetStateAction<Receipt[]>>;
    users: User[];
    setUsers: React.Dispatch<React.SetStateAction<User[]>>;
    freightCostPerKm: number;
    setFreightCostPerKm: React.Dispatch<React.SetStateAction<number>>;
    equipment: Equipment[];
    setEquipment: React.Dispatch<React.SetStateAction<Equipment[]>>;
    maintenanceLogs: MaintenanceLog[];
    setMaintenanceLogs: React.Dispatch<React.SetStateAction<MaintenanceLog[]>>;
    productionEmployees: ProductionEmployee[];
    setProductionEmployees: React.Dispatch<React.SetStateAction<ProductionEmployee[]>>;
    activityLogs: ActivityLog[];
    setActivityLogs: React.Dispatch<React.SetStateAction<ActivityLog[]>>;
    vehicles: Vehicle[];
    setVehicles: React.Dispatch<React.SetStateAction<Vehicle[]>>;
    deliveryRoutes: DeliveryRoute[];
    setDeliveryRoutes: React.Dispatch<React.SetStateAction<DeliveryRoute[]>>;
    checklistTemplates: ChecklistTemplate[];
    orderAddendums: OrderAddendum[];
    setOrderAddendums: React.Dispatch<React.SetStateAction<OrderAddendum[]>>;
    cutPieces: CutPiece[];
    setCutPieces: React.Dispatch<React.SetStateAction<CutPiece[]>>;

    // Add specific data manipulation functions here
    addClient: (client: Client) => void;
    updateClient: (client: Client) => void;
    addNote: (clientId: string, content: string) => void;
    saveQuote: (quote: Quote) => void;
    createServiceOrder: (newOsData: Omit<ServiceOrder, 'id'>) => Promise<{ success: boolean; message?: string }>;
    updateServiceOrderPriority: (serviceOrderId: string, priority: Priority) => void;
    updateServiceOrderObservations: (serviceOrderId: string, observations: string) => void;
    saveInvoice: (invoice: Invoice) => void;
    issueInvoice: (invoiceId: string) => void;
    saveSupplier: (supplier: Supplier) => void;
    addEvent: (event: Omit<AgendaEvent, 'id'>) => void;
    markTransactionAsPaid: (transactionId: string) => void;
    updateFinancialTransaction: (transaction: FinancialTransaction) => void;
    addFinancialTransaction: (transactionData: Omit<FinancialTransaction, 'id'>) => void;
    addReceipt: (receiptData: Omit<Receipt, 'id' | 'createdAt'>) => void;
    saveMaterial: (material: Material) => void;
    deleteMaterial: (materialId: string) => void;
    saveService: (service: Service) => void;
    deleteService: (serviceId: string) => void;
    saveProduct: (product: Product) => void;
    deleteProduct: (productId: string) => void;
    allocateSlabToOrder: (serviceOrderId: string, slabId: string) => void;
    addAttachmentToServiceOrder: (serviceOrderId: string, file: File) => void;
    removeAttachmentFromServiceOrder: (serviceOrderId: string) => void;
    scheduleDelivery: (serviceOrderId: string, schedule: DeliveryScheduleInput) => DeliveryScheduleResult;
    isVehicleAvailable: (vehicleId: string, start: string, end: string, excludeRouteId?: string) => boolean;
    updateDepartureChecklist: (serviceOrderId: string, checklist: { id: string; text: string; checked: boolean }[]) => Promise<{ success: boolean; message?: string }>;
    updateServiceOrderStatus: (serviceOrderId: string, status: ProductionStatus, allocatedSlabId?: string) => Promise<{ success: boolean; message?: string }>;
    completeProductionStep: (serviceOrderId: string, requiresInstallation: boolean) => void;
    setFinalizationType: (orderId: string, type: FinalizationType) => void;
    confirmDelivery: (orderId: string, deliveryData: {
        checklistCompleted: boolean;
        photos: Array<{ url: string; description?: string }>;
        customerSignature: { url: string; timestamp: string };
    }) => Promise<{ success: boolean; message?: string }>;
    confirmInstallation: (orderId: string) => void;
    
    // Equipment management functions
    addEquipment: (equipment: Equipment) => void;
    updateEquipment: (equipment: Equipment) => void;
    deleteEquipment: (equipmentId: string) => void;
    addVehicle: (vehicle: Vehicle) => void;
    updateVehicle: (vehicle: Vehicle) => void;
    deleteVehicle: (vehicleId: string) => void;
    addMaintenanceLog: (maintenanceLog: MaintenanceLog) => void;
    updateMaintenanceLog: (maintenanceLog: MaintenanceLog) => void;
    deleteMaintenanceLog: (maintenanceLogId: string) => void;

    // Checklist templates
    createChecklistTemplate: (template: { name: string; type: 'entrega' | 'montagem'; items: { text: string }[] }) => Promise<{ success: boolean; message?: string }>;
    updateChecklistTemplate: (templateId: string, template: { name: string; type: 'entrega' | 'montagem'; items: { text: string }[] }) => Promise<{ success: boolean; message?: string }>;
    deleteChecklistTemplate: (templateId: string) => Promise<{ success: boolean; message?: string }>;
    
    // Production employee management functions
    addProductionEmployee: (employee: ProductionEmployee) => void;
    updateProductionEmployee: (employee: ProductionEmployee) => void;
    deleteProductionEmployee: (employeeId: string) => void;
    
    // Activity log management functions
    addActivityLog: (activity: Omit<ActivityLog, 'id' | 'timestamp' | 'createdAt'>) => void;
    getActivityLogsByEntity: (entityType: string, entityId: string) => ActivityLog[];
    getActivityLogsByUser: (userId: string) => ActivityLog[];
    getActivityLogsByType: (activityType: ActivityType) => ActivityLog[];
    
    // Order addendum management functions
    loadOrderAddendums: (orderId: string) => Promise<void>;
    createOrderAddendum: (orderId: string, addendumData: any) => Promise<{ success: boolean; message?: string; data?: OrderAddendum }>;
    updateOrderAddendumStatus: (addendumId: string, status: 'approved' | 'rejected') => Promise<{ success: boolean; message?: string; data?: OrderAddendum }>;
    
    // ServiceOrder refresh functions
    refreshServiceOrder: (serviceOrderId: string) => Promise<void>;
    
    // Service Order Exception Management functions
    markOrderForRework: (id: string, reason?: string) => Promise<{ success: boolean; message?: string }>;
    reportDeliveryIssue: (id: string, details: string) => Promise<{ success: boolean; message?: string }>;
    requestInstallationReview: (id: string, reason?: string) => Promise<{ success: boolean; message?: string }>;
    resolveOrderIssue: (id: string, resolutionDetails?: string, nextStatus?: string) => Promise<{ success: boolean; message?: string }>;
    resolveRework: (id: string, resolutionDetails?: string, nextStatus?: string) => Promise<{ success: boolean; message?: string }>;
    resolveDeliveryIssue: (id: string, resolutionDetails?: string, nextStatus?: string) => Promise<{ success: boolean; message?: string }>;
    completeReview: (id: string, resolutionDetails?: string, nextStatus?: string) => Promise<{ success: boolean; message?: string }>;
    
    // CutPiece management functions
    loadCutPiecesForOS: (serviceOrderId: string) => Promise<void>;
    updateCutPieceStatus: (pieceId: string, status: string, reason?: string) => Promise<{ success: boolean; message?: string }>;
}

// Create the context
const DataContext = createContext<DataContextType | undefined>(undefined);

// Create the provider component
export const DataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    // Initialize all states here
    const [clients, setClients] = useState<Client[]>([]);
    const [opportunities, setOpportunities] = useState<Opportunity[]>(mockOpportunities);
    const [agendaEvents, setAgendaEvents] = useState<AgendaEvent[]>(mockAgendaEvents);
    const [notes, setNotes] = useState<Note[]>(mockNotes);
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [materials, setMaterials] = useState<Material[]>([]);
    const [services, setServices] = useState<Service[]>(mockServices);
    const [products, setProducts] = useState<Product[]>(mockProducts);
    const [stockItems, setStockItems] = useState<StockItem[]>(mockStockItems);
    const [quotes, setQuotes] = useState<Quote[]>([]);
    const [orders, setOrders] = useState<Order[]>(mockOrders);
    const [serviceOrders, setServiceOrders] = useState<ServiceOrder[]>([]);
    const [invoices, setInvoices] = useState<Invoice[]>(mockInvoices);
    const [financialTransactions, setFinancialTransactions] = useState<FinancialTransaction[]>(mockFinancialTransactions);
    const [receipts, setReceipts] = useState<Receipt[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [freightCostPerKm, setFreightCostPerKm] = useState<number>(8);
    const [vehicles, setVehicles] = useState<Vehicle[]>(mockVehicles);
    const [deliveryRoutes, setDeliveryRoutes] = useState<DeliveryRoute[]>(mockDeliveryRoutes);
    const [equipment, setEquipment] = useState<Equipment[]>(mockEquipment);
    const [maintenanceLogs, setMaintenanceLogs] = useState<MaintenanceLog[]>(mockMaintenanceLogs);
    const [productionEmployees, setProductionEmployees] = useState<ProductionEmployee[]>(mockProductionEmployees);
    const [activityLogs, setActivityLogs] = useState<ActivityLog[]>(mockActivityLogs);
    const [checklistTemplates, setChecklistTemplates] = useState<ChecklistTemplate[]>(mockChecklistTemplates);
    const [orderAddendums, setOrderAddendums] = useState<OrderAddendum[]>([]);
    const [cutPieces, setCutPieces] = useState<CutPiece[]>([]);

    // Carregar dados do backend
    useEffect(() => {
        // Verificar se há token antes de carregar dados autenticados
        const token = localStorage.getItem('token');
        
        if (token) {
            // Só carregar dados se houver token de autenticação
            loadClients();
            loadSuppliers();
            loadQuotes();
            loadOrders();
            loadServiceOrders();
            loadUsers();
            loadChecklistTemplates();
            loadMaterials();
        } else {
            // Sem token, usar dados mock
            console.log('ℹ️  Sem token de autenticação, usando dados mock');
            setClients(mockClients);
            setSuppliers(mockSuppliers);
            setQuotes(mockQuotes);
            setOrders(mockOrders);
            setServiceOrders(mockServiceOrders);
            setMaterials(mockMaterials);
        }
    }, []);

    const generateChecklistItemId = () => {
        if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
            return crypto.randomUUID();
        }
        return `chk-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    };

    const loadServiceOrders = async () => {
        try {
            const result = await api.getAllServiceOrders();
            if (result.success && Array.isArray(result.data)) {
                const mapped: ServiceOrder[] = result.data.map((so: any) => ({
                    ...so,
                    id: so.id || so._id,
                }));
                setServiceOrders(mapped);
            }
        } catch (error) {
            console.error('Erro ao carregar ServiceOrders:', error);
        }
    };

    const loadClients = async () => {
        try {
            const result = await api.getClients();
            if (result.success) {
                const mappedClients = result.data.map((c: any) => ({
                    ...c,
                    id: c._id || c.id,
                }));
                setClients(mappedClients);
            }
        } catch (error) {
            console.error('Erro ao carregar clientes:', error);
            // Em caso de erro, usar dados mock como fallback
            setClients(mockClients);
        }
    };

    const loadSuppliers = async () => {
        try {
            const result = await api.getSuppliers();
            if (result.success) {
                const mappedSuppliers = result.data.map((s: any) => ({
                    ...s,
                    id: s._id || s.id,
                }));
                setSuppliers(mappedSuppliers);
            }
        } catch (error) {
            console.error('Erro ao carregar fornecedores:', error);
            setSuppliers(mockSuppliers);
        }
    };

    const loadMaterials = async () => {
        try {
            const result = await api.getMaterials();
            if (result.success) {
                const mapped = result.data.map((m: any) => ({
                    ...m,
                    id: m._id || m.id,
                }));
                setMaterials(mapped);
            }
        } catch (error) {
            console.error('Erro ao carregar materiais:', error);
        }
    };

    const loadQuotes = async () => {
        try {
            const result = await api.getQuotes();
            if (result.success) {
                const mappedQuotes = result.data.map((q: any) => ({
                    ...q,
                    id: q._id || q.id,
                }));
                setQuotes(mappedQuotes);
            }
        } catch (error) {
            console.error('Erro ao carregar orçamentos:', error);
            setQuotes(mockQuotes);
        }
    };

    const loadOrders = async () => {
        try {
            console.log('🔄 Carregando pedidos do backend...');
            const result = await api.getOrders();
            if (result.success) {
                console.log(`📦 ${result.count || result.data.length} pedido(s) encontrado(s)`);
                const mappedOrders = result.data.map((o: any) => ({
                    ...o,
                    id: o._id || o.id,
                    originalQuoteId: o.originalQuoteId?._id || o.originalQuoteId,
                    serviceOrderIds: o.serviceOrderIds || [],
                }));
                setOrders(mappedOrders);
                console.log('✅ Pedidos carregados com sucesso');
            }
        } catch (error) {
            console.error('❌ Erro ao carregar pedidos:', error);
            console.log('⚠️ Usando dados mock como fallback');
            setOrders(mockOrders);
        }
    };

    const loadUsers = async () => {
        try {
            console.log('🔄 Carregando usuários do backend...');
            const result = await api.getUsers();
            if (result.success) {
                console.log(`👥 ${result.count || result.data.length} usuário(s) encontrado(s)`);
                const mappedUsers = result.data.map((u: any) => ({
                    ...u,
                    id: u._id || u.id,
                }));
                setUsers(mappedUsers);
                console.log('✅ Usuários carregados com sucesso');
            }
        } catch (error) {
            console.error('❌ Erro ao carregar usuários:', error);
            setUsers([]);
        }
    };

    const loadChecklistTemplates = async () => {
        try {
            const result = await api.getChecklistTemplates();
            if (result.success && Array.isArray(result.data)) {
                const mappedTemplates: ChecklistTemplate[] = result.data.map((template: any) => ({
                    ...template,
                    id: template._id || template.id,
                    items: Array.isArray(template.items)
                        ? template.items.map((item: any) => ({
                            id: item.id || item._id,
                            text: item.text,
                        }))
                        : [],
                }));
                setChecklistTemplates(mappedTemplates);
            }
        } catch (error) {
            console.error('Erro ao carregar modelos de checklist:', error);
        }
    };

    const generateFinancialTransactionsForOrder = (order: Order) => {
        const newTransactions: FinancialTransaction[] = [];
        const now = new Date();
        
        if (!order.paymentMethod) return [];

        const relatedClientId = clients.find(c => c.name === order.clientName)?.id;

        if (order.paymentMethod === 'cartao_credito' && order.installments && order.installments > 0) {
            const installmentAmount = order.total / order.installments;
            for (let i = 1; i <= order.installments; i++) {
                const dueDate = new Date(now);
                dueDate.setMonth(now.getMonth() + i);
                newTransactions.push({
                    id: `fin-${Date.now()}-${i}`,
                    description: `Parcela ${i}/${order.installments} - Pedido ${order.id}`,
                    amount: installmentAmount,
                    type: 'receita',
                    status: 'pendente',
                    dueDate: dueDate.toISOString(),
                    relatedOrderId: order.id,
                    relatedClientId: relatedClientId,
                    paymentMethod: order.paymentMethod,
                });
            }
        } else {
            const dueDate = new Date(now);
            dueDate.setDate(now.getDate() + 30); // Default due date for one-off payments
            newTransactions.push({
                id: `fin-${Date.now()}-1`,
                description: `Recebimento Pedido ${order.id}`,
                amount: order.total,
                type: 'receita',
                status: 'pendente',
                dueDate: dueDate.toISOString(),
                relatedOrderId: order.id,
                relatedClientId: relatedClientId,
                paymentMethod: order.paymentMethod,
            });
        }
        return newTransactions;
    };


    // Define modifier functions
    const addClient = async (clientToSave: Client) => {
        try {
            await toast.promise(
                api.createClient(clientToSave).then(async (result: any) => {
                    if (!result?.success) throw new Error(result?.message || 'Falha ao adicionar cliente');
                    await loadClients();
                    return result;
                }),
                {
                    loading: 'Adicionando cliente...',
                    success: (r: any) => r?.message || 'Cliente adicionado com sucesso!',
                    error: (e: Error) => e?.message || 'Erro ao adicionar cliente.',
                }
            );
        } catch (error) {
            console.error('Erro de conexão ao adicionar cliente:', error);
            toast.error('Erro de conexão. Tente novamente.');
        }
    };

    const updateClient = async (clientToUpdate: Client) => {
        try {
            await toast.promise(
                api.updateClient(clientToUpdate.id, clientToUpdate).then(async (result: any) => {
                    if (!result?.success) throw new Error(result?.message || 'Falha ao atualizar cliente');
                    await loadClients();
                    return result;
                }),
                {
                    loading: 'Atualizando cliente...',
                    success: (r: any) => r?.message || 'Cliente atualizado com sucesso!',
                    error: (e: Error) => e?.message || 'Erro ao atualizar cliente.',
                }
            );
        } catch (error) {
            console.error('Erro de conexão ao atualizar cliente:', error);
            toast.error('Erro de conexão. Tente novamente.');
        }
    };

    const addNote = (clientId: string, content: string) => {
        const newNote: Note = {
            id: `note-${Date.now()}`,
            clientId,
            content,
            userId: 'user-1', // Placeholder for current user
            createdAt: new Date().toISOString(),
        };
        setNotes(prev => [...prev, newNote]);
    };
    
    const saveQuote = async (quoteToSave: Quote) => {
        try {
            const isNewQuote = quoteToSave.id.startsWith('new-');

            if (isNewQuote) {
                await toast.promise(
                    api.createQuote(quoteToSave).then(async (result: any) => {
                        if (!result?.success) throw new Error(result?.message || 'Falha ao criar orçamento');
                        await loadQuotes();
                        if (quoteToSave.status === 'approved') {
                            await loadOrders();
                        }
                        return result;
                    }),
                    {
                        loading: 'Criando orçamento...',
                        success: (r: any) => r?.message || 'Orçamento criado com sucesso!',
                        error: (e: Error) => e?.message || 'Erro ao criar orçamento.',
                    }
                );
                return;
            } else {
                await toast.promise(
                    api.updateQuote(quoteToSave.id, quoteToSave).then(async (result: any) => {
                        if (!result?.success) throw new Error(result?.message || 'Falha ao atualizar orçamento');
                        await loadQuotes();
                        if (quoteToSave.status === 'approved') {
                            await loadOrders();
                        }
                        return result;
                    }),
                    {
                        loading: 'Atualizando orçamento...',
                        success: (r: any) => r?.message || 'Orçamento atualizado com sucesso!',
                        error: (e: Error) => e?.message || 'Erro ao atualizar orçamento.',
                    }
                );
                return;
            }
        } catch (error) {
            console.error('❌ Erro ao salvar orçamento:', error);
            toast.error('Erro de conexão. Tente novamente.');
        }

        let savedQuote = { ...quoteToSave };

        // Check if the quote was approved to convert to an order
        if (savedQuote.status === 'approved') {
            const existingOrder = orders.find(o => o.originalQuoteId === savedQuote.id);
            if (!existingOrder) {
                const newOrderId = `PED-2024-${(orders.length + mockOrders.length + 1).toString().padStart(3, '0')}`;
                // FIX: Removed incorrect, flattened address properties and used the `deliveryAddress` object,
                // aligning with the `Order` type definition.
                const newOrder: Order = {
                    id: newOrderId,
                    originalQuoteId: savedQuote.id,
                    clientName: savedQuote.clientName,
                    clientCpf: savedQuote.clientCpf,
                    deliveryAddress: savedQuote.deliveryAddress,
                    items: savedQuote.items,
                    subtotal: savedQuote.subtotal,
                    discount: savedQuote.discount,
                    freight: savedQuote.freight,
                    total: savedQuote.total,
                    paymentMethod: savedQuote.paymentMethod,
                    installments: savedQuote.installments,
                    approvalDate: new Date().toISOString(),
                    salespersonId: savedQuote.salespersonId,
                    serviceOrderIds: [],
                };
                setOrders(prev => [...prev, newOrder]);

                // Generate financial transactions
                const newTransactions = generateFinancialTransactionsForOrder(newOrder);
                setFinancialTransactions(prev => [...prev, ...newTransactions]);
            }
        }
    };
    
    const createServiceOrder = async (newOsData: Omit<ServiceOrder, 'id'>) => {
        try {
            const result = await toast.promise(
                api.createServiceOrder(newOsData),
                {
                    loading: 'Criando OS...',
                    success: (r: any) => r?.message || 'OS criada com sucesso!',
                    error: (e: Error) => e?.message || 'Erro ao criar OS.',
                }
            );
            if (result?.success && result?.data) {
                setServiceOrders(prev => [...prev, result.data]);
                setOrders(prev => prev.map(order => 
                    order.id === newOsData.orderId 
                        ? { ...order, serviceOrderIds: [...(order.serviceOrderIds || []), result.data.id] }
                        : order
                ));
                return { success: true, message: result.message };
            }
            return { success: false, message: result?.message || 'Erro ao criar ServiceOrder' };
        } catch (error: any) {
            console.error('Erro ao criar ServiceOrder:', error);
            return { success: false, message: error?.message || 'Erro inesperado ao criar ServiceOrder' };
        }
    };

    const updateServiceOrderPriority = async (serviceOrderId: string, priority: Priority) => {
        try {
            await toast.promise(
                api.updateServiceOrder(serviceOrderId, { priority }).then((result: any) => {
                    if (!result?.success || !result?.data) throw new Error(result?.message || 'Falha ao atualizar prioridade');
                    setServiceOrders(prev => prev.map(so => so.id === serviceOrderId ? result.data : so));
                    return result;
                }),
                {
                    loading: 'Atualizando prioridade...',
                    success: (r: any) => r?.message || 'Prioridade atualizada com sucesso!',
                    error: (e: Error) => e?.message || 'Erro ao atualizar prioridade.',
                }
            );
        } catch (error) {
            console.error('Erro ao atualizar prioridade da OS:', error);
        }
    };

    const updateServiceOrderObservations = async (serviceOrderId: string, observations: string) => {
        try {
            await toast.promise(
                api.updateServiceOrder(serviceOrderId, { observations }).then((result: any) => {
                    if (!result?.success || !result?.data) throw new Error(result?.message || 'Falha ao atualizar observações');
                    setServiceOrders(prev => prev.map(so => so.id === serviceOrderId ? result.data : so));
                    return result;
                }),
                {
                    loading: 'Salvando observações...',
                    success: (r: any) => r?.message || 'Observações salvas!',
                    error: (e: Error) => e?.message || 'Erro ao salvar observações.',
                }
            );
        } catch (error) {
            console.error('Erro ao atualizar observações da OS:', error);
        }
    };
    
    const saveInvoice = (invoiceToSave: Invoice) => {
        const newId = `NF-${(invoices.length + mockInvoices.length + 1).toString().padStart(3, '0')}`;
        setInvoices(prev => [...prev, { ...invoiceToSave, id: newId }]);
    };
    
    const issueInvoice = (invoiceId: string) => {
        setInvoices(prev => prev.map(inv => 
            inv.id === invoiceId 
            ? { ...inv, status: 'issued', issueDate: new Date().toISOString() } 
            : inv
        ));
    };
    
    const saveSupplier = async (supplierToSave: Supplier) => {
        try {
            const savePromise = supplierToSave.id.startsWith('new-')
                ? api.createSupplier(supplierToSave)
                : api.updateSupplier(supplierToSave.id, supplierToSave);

            await toast.promise(
                savePromise.then(async (result: any) => {
                    if (!result?.success) {
                        throw new Error(result?.message || 'Falha ao salvar');
                    }
                    await loadSuppliers();
                    return result;
                }),
                {
                    loading: 'Salvando fornecedor...',
                    success: (result: any) => result?.message || 'Fornecedor salvo com sucesso!',
                    error: (err: Error) => err?.message || 'Erro ao salvar fornecedor.',
                }
            );
        } catch (error) {
            console.error('Erro de conexão ao salvar fornecedor:', error);
            // Evitar toasts duplicados caso a promise acima já tenha mostrado um erro
            toast.error('Erro de conexão. Tente novamente.');
        }
    };
    
    const addEvent = (eventData: Omit<AgendaEvent, 'id'>) => {
        const newEvent: AgendaEvent = {
            id: `evt-${Date.now()}`,
            ...eventData,
        };
        setAgendaEvents(prev => [...prev, newEvent]);
    };
    
    const markTransactionAsPaid = (transactionId: string) => {
        setFinancialTransactions(prev =>
            prev.map(t =>
                t.id === transactionId
                    ? { ...t, status: 'pago', paymentDate: new Date().toISOString() }
                    : t
            )
        );
    };

    const updateFinancialTransaction = (transactionToUpdate: FinancialTransaction) => {
        setFinancialTransactions(prev =>
            prev.map(t =>
                t.id === transactionToUpdate.id ? transactionToUpdate : t
            )
        );
    };

    const addFinancialTransaction = (transactionData: Omit<FinancialTransaction, 'id'>) => {
        const newId = `fin-${Date.now()}`;
        const newTransaction: FinancialTransaction = {
            ...transactionData,
            id: newId,
        };
        setFinancialTransactions(prev => [...prev, newTransaction]);
    };

    const addReceipt = (receiptData: Omit<Receipt, 'id' | 'createdAt'>) => {
        const now = new Date();
        const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
        const timeStr = now.toTimeString().slice(0, 8).replace(/:/g, '');
        const newReceipt: Receipt = {
            ...receiptData,
            id: `REC-${dateStr}-${timeStr}-${receiptData.supplierId.replace('sup-', '')}`,
            createdAt: now.toISOString(),
        };
        setReceipts(prev => [...prev, newReceipt]);
    };

    const saveMaterial = async (material: Material) => {
        try {
            const savePromise = !material.id || material.id.startsWith('new-')
                ? api.createMaterial(material)
                : api.updateMaterial(material.id, material);
            await toast.promise(
                savePromise.then(async (result: any) => {
                    if (!result?.success) throw new Error(result?.message || 'Falha ao salvar material');
                    await loadMaterials();
                    return result;
                }),
                {
                    loading: 'Salvando material...',
                    success: (r: any) => r?.message || 'Material salvo com sucesso!',
                    error: (e: Error) => e?.message || 'Erro ao salvar material.',
                }
            );
        } catch (error) {
            console.error('Erro ao salvar material:', error);
            toast.error('Erro de conexão. Tente novamente.');
        }
    };
    const deleteMaterial = async (materialId: string) => {
        try {
            await toast.promise(
                api.deleteMaterial(materialId).then((result: any) => {
                    if (!result?.success) throw new Error(result?.message || 'Falha ao remover material');
                    setMaterials(prev => prev.filter(m => m.id !== materialId));
                    return result;
                }),
                {
                    loading: 'Removendo material...',
                    success: (r: any) => r?.message || 'Material removido!',
                    error: (e: Error) => e?.message || 'Erro ao remover material.',
                }
            );
        } catch (error) {
            console.error('Erro ao remover material:', error);
        }
    };

    const saveService = (service: Service) => {
        if (service.id.startsWith('new-')) {
            const newId = `srv-${(mockServices.length + services.length + 1).toString().padStart(3, '0')}`;
            setServices(prev => [...prev, { ...service, id: newId }]);
        } else {
            setServices(prev => prev.map(s => s.id === service.id ? service : s));
        }
    };
    const deleteService = (serviceId: string) => setServices(prev => prev.filter(s => s.id !== serviceId));

    const saveProduct = (product: Product) => {
        if (product.id.startsWith('new-')) {
            const newId = `prd-${(mockProducts.length + products.length + 1).toString().padStart(3, '0')}`;
            setProducts(prev => [...prev, { ...product, id: newId }]);
        } else {
            setProducts(prev => prev.map(p => p.id === product.id ? product : p));
        }
    };
    const deleteProduct = (productId: string) => setProducts(prev => prev.filter(p => p.id !== productId));

    const allocateSlabToOrder = (serviceOrderId: string, slabId: string) => {
        // Update the Service Order with the allocated slab ID
        setServiceOrders(prev => prev.map(so => 
            so.id === serviceOrderId ? { ...so, allocatedSlabId: slabId } : so
        ));

        // Update the Stock Item status to 'em_uso'
        setStockItems(prev => prev.map(item => 
            item.id === slabId ? { ...item, status: 'em_uso' } : item
        ));
    };

    const addAttachmentToServiceOrder = (serviceOrderId: string, file: File) => {
        const reader = new FileReader();
        reader.onload = (event) => {
            const url = event.target?.result as string;
            setServiceOrders(prev => prev.map(so => 
                so.id === serviceOrderId 
                ? { ...so, attachment: { name: file.name, url } } 
                : so
            ));
        };
        reader.readAsDataURL(file);
    };

    const removeAttachmentFromServiceOrder = (serviceOrderId: string) => {
        setServiceOrders(prev => prev.map(so => {
            if (so.id === serviceOrderId) {
                const { attachment, ...rest } = so; // a safe way to remove the property
                return rest;
            }
            return so;
        }));
    };

    const isVehicleAvailable = (vehicleId: string, start: string, end: string, excludeRouteId?: string): boolean => {
        const startDate = new Date(start);
        const endDate = new Date(end);

        if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime()) || startDate >= endDate) {
            return false;
        }

        return !deliveryRoutes.some(route => {
            if (route.vehicleId !== vehicleId) {
                return false;
            }
            if (excludeRouteId && route.id === excludeRouteId) {
                return false;
            }

            const routeStart = new Date(route.start);
            const routeEnd = new Date(route.end);
            return routeStart < endDate && routeEnd > startDate;
        });
    };

    const scheduleDelivery = (serviceOrderId: string, schedule: DeliveryScheduleInput): DeliveryScheduleResult => {
        const { vehicleId, start, end, teamIds } = schedule;

        const startDate = new Date(start);
        const endDate = new Date(end);

        if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
            return { success: false, message: 'Data ou horário inválido.' };
        }

        if (startDate >= endDate) {
            return { success: false, message: 'O horário final deve ser posterior ao horário inicial.' };
        }

        const existingRoute = deliveryRoutes.find(route => route.serviceOrderId === serviceOrderId);
        if (!isVehicleAvailable(vehicleId, start, end, existingRoute?.id)) {
            return { success: false, message: 'Veículo indisponível para o período selecionado.' };
        }

        const nowIso = new Date().toISOString();
        let scheduledRoute: DeliveryRoute | undefined = existingRoute;

        setDeliveryRoutes(prev => {
            const currentRoute = prev.find(route => route.serviceOrderId === serviceOrderId);
            if (currentRoute) {
                const updatedRoute: DeliveryRoute = {
                    ...currentRoute,
                    vehicleId,
                    start,
                    end,
                    status: 'scheduled',
                    updatedAt: nowIso,
                };
                scheduledRoute = updatedRoute;
                return prev.map(route => route.id === currentRoute.id ? updatedRoute : route);
            }

            const newRoute: DeliveryRoute = {
                id: `route-${Date.now()}`,
                vehicleId,
                serviceOrderId,
                start,
                end,
                status: 'scheduled',
                createdAt: nowIso,
                updatedAt: nowIso,
            };
            scheduledRoute = newRoute;
            return [...prev, newRoute];
        });

        // Update ServiceOrder with delivery details (status will be updated by backend hooks)
        setServiceOrders(prev => prev.map(so =>
            so.id === serviceOrderId
                ? {
                    ...so,
                    deliveryScheduledDate: start,
                    deliveryStart: start,
                    deliveryEnd: end,
                    vehicleId,
                    deliveryTeamIds: teamIds,
                }
                : so
        ));

        return { success: true, message: 'Entrega agendada com sucesso.', route: scheduledRoute };
    };

    const updateDepartureChecklist = async (
        serviceOrderId: string,
        checklist: { id: string; text: string; checked: boolean }[]
    ): Promise<{ success: boolean; message?: string }> => {
        const normalized = checklist.map(item => ({
            id: item.id && item.id.trim().length > 0 ? item.id : generateChecklistItemId(),
            text: item.text,
            checked: item.checked,
        }));

        const applyLocalUpdate = (updatedChecklist: typeof normalized) => {
            setServiceOrders(prev => prev.map(so =>
                so.id === serviceOrderId ? { ...so, departureChecklist: updatedChecklist } : so
            ));
        };

        const isMongoId = /^[a-fA-F0-9]{24}$/.test(serviceOrderId);

        if (!isMongoId) {
            applyLocalUpdate(normalized);
            return { success: true, message: 'Checklist atualizado localmente.' };
        }

        try {
            const result = await toast.promise(
                api.updateServiceOrderChecklist(serviceOrderId, normalized),
                {
                    loading: 'Atualizando checklist...',
                    success: 'Checklist atualizado!',
                    error: 'Erro ao atualizar checklist.',
                }
            );
            if (result?.success) {
                const updatedChecklist = Array.isArray(result.data?.departureChecklist)
                    ? result.data.departureChecklist.map((item: any) => ({
                        id: item.id || item._id || generateChecklistItemId(),
                        text: item.text,
                        checked: Boolean(item.checked),
                    }))
                    : normalized;

                applyLocalUpdate(updatedChecklist);
                return { success: true, message: result.message };
            }

            applyLocalUpdate(normalized);
            return { success: false, message: result?.message || 'Não foi possível atualizar o checklist.' };
        } catch (error) {
            console.error('Erro ao atualizar checklist da OS:', error);
            return { success: false, message: 'Erro inesperado ao atualizar o checklist.' };
        }
    };
    
    const updateServiceOrderStatus = async (serviceOrderId: string, status: ProductionStatus, allocatedSlabId?: string) => {
        try {
            const result = await api.updateServiceOrderStatus(serviceOrderId, status, allocatedSlabId);
            if (result.success && result.data) {
                // Atualizar a ServiceOrder no estado local
                setServiceOrders(prev => prev.map(so => 
                    so.id === serviceOrderId ? result.data : so
                ));
                
                return { success: true, message: result.message };
            }
            return { success: false, message: result.message || 'Erro ao atualizar status da ServiceOrder' };
        } catch (error) {
            console.error('Erro ao atualizar status da ServiceOrder:', error);
            return { success: false, message: 'Erro inesperado ao atualizar status da ServiceOrder' };
        }
    };

    const completeProductionStep = (serviceOrderId: string, requiresInstallation: boolean) => {
        setServiceOrders(prev => prev.map(so => 
            so.id === serviceOrderId ? { ...so, productionStatus: 'awaiting_logistics', requiresInstallation } : so
        ));
    };
    
    const setFinalizationType = (orderId: string, type: FinalizationType) => {
        setServiceOrders(prev => prev.map(so => {
            if (so.id === orderId) {
                const newProductionStatus = type === 'pickup' ? 'awaiting_logistics' : 'awaiting_logistics';
                return { ...so, finalizationType: type, productionStatus: newProductionStatus };
            }
            return so;
        }));
    };

    const confirmDelivery = async (orderId: string, deliveryData: {
        checklistCompleted: boolean;
        photos: Array<{ url: string; description?: string }>;
        customerSignature: { url: string; timestamp: string };
    }) => {
        try {
            const confirmationData = {
                checklistItems: [],
                photoUrls: deliveryData.photos,
                signatureUrl: deliveryData.customerSignature.url,
                signatoryName: '',
                signatoryDocument: ''
            };

            const result = await toast.promise(
                api.confirmDeliveryData(orderId, confirmationData),
                {
                    loading: 'Confirmando entrega...',
                    success: 'Entrega confirmada com sucesso!',
                    error: 'Erro ao confirmar entrega.',
                }
            );

            if (result.success && result.data) {
                setServiceOrders(prev => prev.map(so => 
                    so.id === orderId ? result.data : so
                ));
                return { success: true, message: result.message };
            }
            return { success: false, message: result.message || 'Erro ao confirmar entrega' };
        } catch (error) {
            console.error('❌ Erro ao confirmar entrega:', error);
            return { success: false, message: 'Erro inesperado ao confirmar entrega' };
        }
    };
    
    const confirmInstallation = (orderId: string) => {
        // Only update installation confirmation - logistics status is managed by hooks
        setServiceOrders(prev => prev.map(so => {
            if (so.id === orderId) {
                return { ...so, installation_confirmed: true };
            }
            return so;
        }));
    };

    const addVehicle = (vehicle: Vehicle) => {
        setVehicles(prev => [...prev, vehicle]);
    };

    const updateVehicle = (vehicle: Vehicle) => {
        setVehicles(prev => prev.map(v => v.id === vehicle.id ? vehicle : v));
    };

    const deleteVehicle = (vehicleId: string) => {
        setVehicles(prev => prev.filter(v => v.id !== vehicleId));
        setDeliveryRoutes(prev => prev.filter(route => route.vehicleId !== vehicleId));
        setServiceOrders(prev => prev.map(so => {
            if (so.vehicleId === vehicleId) {
                const updated: ServiceOrder = {
                    ...so,
                    status: 'ready_for_logistics',
                    vehicleId: undefined,
                    deliveryStart: undefined,
                    deliveryEnd: undefined,
                    deliveryScheduledDate: undefined,
                    deliveryTeamIds: undefined,
                };
                return updated;
            }
            return so;
        }));
    };

    // Equipment management functions
    const addEquipment = (equipment: Equipment) => {
        setEquipment(prev => [...prev, equipment]);
    };

    const updateEquipment = (equipment: Equipment) => {
        setEquipment(prev => prev.map(eq => eq.id === equipment.id ? equipment : eq));
    };

    const deleteEquipment = (equipmentId: string) => {
        setEquipment(prev => prev.filter(eq => eq.id !== equipmentId));
        // Also delete related maintenance logs
        setMaintenanceLogs(prev => prev.filter(log => log.equipmentId !== equipmentId));
    };

    const addMaintenanceLog = (maintenanceLog: MaintenanceLog) => {
        setMaintenanceLogs(prev => [...prev, maintenanceLog]);
    };

    const updateMaintenanceLog = (maintenanceLog: MaintenanceLog) => {
        setMaintenanceLogs(prev => prev.map(log => log.id === maintenanceLog.id ? maintenanceLog : log));
    };

    const deleteMaintenanceLog = (maintenanceLogId: string) => {
        setMaintenanceLogs(prev => prev.filter(log => log.id !== maintenanceLogId));
    };

    const createChecklistTemplate = async (template: { name: string; type: 'entrega' | 'montagem'; items: { text: string }[] }) => {
        try {
            const result = await api.createChecklistTemplate(template);
            if (result.success && result.data) {
                const mapped: ChecklistTemplate = {
                    ...result.data,
                    id: result.data._id || result.data.id,
                    items: Array.isArray(result.data.items)
                        ? result.data.items.map((item: any) => ({ id: item.id || item._id, text: item.text }))
                        : [],
                };
                setChecklistTemplates(prev => [mapped, ...prev]);
                return { success: true, message: result.message };
            }
            return { success: false, message: result.message || 'Não foi possível criar o modelo de checklist.' };
        } catch (error) {
            console.error('Erro ao criar modelo de checklist:', error);
            return { success: false, message: 'Erro inesperado ao criar modelo de checklist.' };
        }
    };

    const updateChecklistTemplate = async (
        templateId: string,
        template: { name: string; type: 'entrega' | 'montagem'; items: { text: string }[] }
    ) => {
        try {
            const result = await api.updateChecklistTemplate(templateId, template);
            if (result.success && result.data) {
                const mapped: ChecklistTemplate = {
                    ...result.data,
                    id: result.data._id || result.data.id,
                    items: Array.isArray(result.data.items)
                        ? result.data.items.map((item: any) => ({ id: item.id || item._id, text: item.text }))
                        : [],
                };
                setChecklistTemplates(prev => prev.map(t => (t.id === mapped.id ? mapped : t)));
                return { success: true, message: result.message };
            }
            return { success: false, message: result.message || 'Não foi possível atualizar o modelo de checklist.' };
        } catch (error) {
            console.error('Erro ao atualizar modelo de checklist:', error);
            return { success: false, message: 'Erro inesperado ao atualizar modelo de checklist.' };
        }
    };

    const deleteChecklistTemplate = async (templateId: string) => {
        try {
            const result = await api.deleteChecklistTemplate(templateId);
            if (result.success) {
                setChecklistTemplates(prev => prev.filter(template => template.id !== templateId));
                return { success: true, message: result.message };
            }
            return { success: false, message: result.message || 'Não foi possível remover o modelo de checklist.' };
        } catch (error) {
            console.error('Erro ao remover modelo de checklist:', error);
            return { success: false, message: 'Erro inesperado ao remover modelo de checklist.' };
        }
    };

    // Production employee management functions
    const addProductionEmployee = (employee: ProductionEmployee) => {
        setProductionEmployees(prev => [...prev, employee]);
    };

    const updateProductionEmployee = (employee: ProductionEmployee) => {
        setProductionEmployees(prev => prev.map(emp => emp.id === employee.id ? employee : emp));
    };

    const deleteProductionEmployee = (employeeId: string) => {
        setProductionEmployees(prev => prev.filter(emp => emp.id !== employeeId));
        // Remove assignment from equipment if this employee was assigned
        setEquipment(prev => prev.map(eq => 
            eq.assignedTo === employeeId ? { ...eq, assignedTo: '' } : eq
        ));
    };

    // Activity log management functions
    const addActivityLog = (activity: Omit<ActivityLog, 'id' | 'timestamp' | 'createdAt'>) => {
        const now = new Date().toISOString();
        const newActivity: ActivityLog = {
            ...activity,
            id: `act-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            timestamp: now,
            createdAt: now
        };
        setActivityLogs(prev => [newActivity, ...prev]);
        
        // Persist to localStorage for demo purposes
        try {
            const stored = localStorage.getItem('activityLogs');
            const existing = stored ? JSON.parse(stored) : [];
            localStorage.setItem('activityLogs', JSON.stringify([newActivity, ...existing]));
        } catch (error) {
            console.warn('Failed to persist activity log to localStorage:', error);
        }
    };

    const getActivityLogsByEntity = (entityType: string, entityId: string): ActivityLog[] => {
        return activityLogs.filter(log => 
            log.relatedEntityType === entityType && log.relatedEntityId === entityId
        );
    };

    const getActivityLogsByUser = (userId: string): ActivityLog[] => {
        return activityLogs.filter(log => log.userId === userId);
    };

    const getActivityLogsByType = (activityType: ActivityType): ActivityLog[] => {
        return activityLogs.filter(log => log.activityType === activityType);
    };

    // Order addendum management functions
    const loadOrderAddendums = async (orderId: string) => {
        try {
            const result = await api.getOrderAddendums(orderId);
            if (result.success) {
                // Mapear dados do backend para o formato do frontend
                const mappedAddendums: OrderAddendum[] = result.data.map((addendum: any) => ({
                    id: addendum._id || addendum.id,
                    orderId: addendum.orderId,
                    addendumNumber: addendum.addendumNumber,
                    reason: addendum.reason,
                    status: addendum.status,
                    addedItems: addendum.addedItems || [],
                    removedItemIds: addendum.removedItemIds || [],
                    changedItems: addendum.changedItems || [],
                    priceAdjustment: addendum.priceAdjustment || 0,
                    approvedBy: addendum.approvedBy?._id || addendum.approvedBy,
                    approvedAt: addendum.approvedAt,
                    createdBy: addendum.createdBy?._id || addendum.createdBy,
                    createdAt: addendum.createdAt,
                    updatedAt: addendum.updatedAt
                }));
                setOrderAddendums(mappedAddendums);
            }
        } catch (error) {
            console.error('Erro ao carregar adendos do pedido:', error);
        }
    };

    const createOrderAddendum = async (orderId: string, addendumData: any) => {
        try {
            const result = await api.createOrderAddendum(orderId, addendumData);
            if (result.success && result.data) {
                // Mapear dados do backend para o formato do frontend
                const mappedAddendum: OrderAddendum = {
                    id: result.data._id || result.data.id,
                    orderId: result.data.orderId,
                    addendumNumber: result.data.addendumNumber,
                    reason: result.data.reason,
                    status: result.data.status,
                    addedItems: result.data.addedItems || [],
                    removedItemIds: result.data.removedItemIds || [],
                    changedItems: result.data.changedItems || [],
                    priceAdjustment: result.data.priceAdjustment || 0,
                    approvedBy: result.data.approvedBy?._id || result.data.approvedBy,
                    approvedAt: result.data.approvedAt,
                    createdBy: result.data.createdBy?._id || result.data.createdBy,
                    createdAt: result.data.createdAt,
                    updatedAt: result.data.updatedAt
                };
                
                // Adicionar o novo adendo ao estado local
                setOrderAddendums(prev => [...prev, mappedAddendum]);
                
                return { success: true, message: result.message, data: mappedAddendum };
            }
            return { success: false, message: result.message || 'Erro ao criar adendo' };
        } catch (error) {
            console.error('Erro ao criar adendo:', error);
            return { success: false, message: 'Erro inesperado ao criar adendo' };
        }
    };

    const updateOrderAddendumStatus = async (addendumId: string, status: 'approved' | 'rejected') => {
        try {
            const result = await api.updateOrderAddendumStatus(addendumId, status);
            if (result.success && result.data) {
                // Mapear dados do backend para o formato do frontend
                const mappedAddendum: OrderAddendum = {
                    id: result.data._id || result.data.id,
                    orderId: result.data.orderId,
                    addendumNumber: result.data.addendumNumber,
                    reason: result.data.reason,
                    status: result.data.status,
                    addedItems: result.data.addedItems || [],
                    removedItemIds: result.data.removedItemIds || [],
                    changedItems: result.data.changedItems || [],
                    priceAdjustment: result.data.priceAdjustment || 0,
                    approvedBy: result.data.approvedBy?._id || result.data.approvedBy,
                    approvedAt: result.data.approvedAt,
                    createdBy: result.data.createdBy?._id || result.data.createdBy,
                    createdAt: result.data.createdAt,
                    updatedAt: result.data.updatedAt
                };
                
                // Atualizar o adendo no estado local
                setOrderAddendums(prev => prev.map(addendum => 
                    addendum.id === addendumId ? mappedAddendum : addendum
                ));
                
                return { success: true, message: result.message, data: mappedAddendum };
            }
            return { success: false, message: result.message || 'Erro ao atualizar status do adendo' };
        } catch (error) {
            console.error('Erro ao atualizar status do adendo:', error);
            return { success: false, message: 'Erro inesperado ao atualizar status do adendo' };
        }
    };

    const refreshServiceOrder = async (serviceOrderId: string) => {
        try {
            // Fetch updated ServiceOrder from backend
            const response = await fetch(`/api/service-orders/${serviceOrderId}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'Content-Type': 'application/json'
                }
            });
            
            if (response.ok) {
                const updatedServiceOrder = await response.json();
                setServiceOrders(prev => prev.map(so => 
                    so.id === serviceOrderId ? updatedServiceOrder : so
                ));
                console.log(`✅ ServiceOrder ${serviceOrderId} refreshed with updated logistics status`);
            } else {
                console.warn(`⚠️ Failed to refresh ServiceOrder ${serviceOrderId}`);
            }
        } catch (error) {
            console.error('Erro ao atualizar ServiceOrder:', error);
        }
    };

    // Service Order Exception Management functions
    const markOrderForRework = async (id: string, reason?: string) => {
        try {
            const result = await api.markOrderForRework(id, reason);
            if (result.success && result.data) {
                // Atualizar o estado local com a OS retornada pela API
                setServiceOrders(prev => prev.map(so => 
                    so.id === id ? result.data : so
                ));
                return { success: true, message: result.message };
            }
            return { success: false, message: result.message || 'Erro ao marcar OS para rework' };
        } catch (error) {
            console.error('Erro ao marcar OS para rework:', error);
            return { success: false, message: 'Erro inesperado ao marcar OS para rework' };
        }
    };

    const reportDeliveryIssue = async (id: string, details: string) => {
        try {
            const result = await api.reportDeliveryIssue(id, details);
            if (result.success && result.data) {
                // Atualizar o estado local com a OS retornada pela API
                setServiceOrders(prev => prev.map(so => 
                    so.id === id ? result.data : so
                ));
                return { success: true, message: result.message };
            }
            return { success: false, message: result.message || 'Erro ao reportar problema de entrega' };
        } catch (error) {
            console.error('Erro ao reportar problema de entrega:', error);
            return { success: false, message: 'Erro inesperado ao reportar problema de entrega' };
        }
    };

    const requestInstallationReview = async (id: string, reason?: string) => {
        try {
            const result = await api.requestInstallationReview(id, reason);
            if (result.success && result.data) {
                // Atualizar o estado local com a OS retornada pela API
                setServiceOrders(prev => prev.map(so => 
                    so.id === id ? result.data : so
                ));
                return { success: true, message: result.message };
            }
            return { success: false, message: result.message || 'Erro ao solicitar revisão de instalação' };
        } catch (error) {
            console.error('Erro ao solicitar revisão de instalação:', error);
            return { success: false, message: 'Erro inesperado ao solicitar revisão de instalação' };
        }
    };

    const resolveOrderIssue = async (id: string, resolutionDetails?: string, nextStatus?: string) => {
        try {
            const result = await api.resolveOrderIssue(id, resolutionDetails, nextStatus);
            if (result.success && result.data) {
                // Atualizar o estado local com a OS retornada pela API
                setServiceOrders(prev => prev.map(so => 
                    so.id === id ? result.data : so
                ));
                return { success: true, message: result.message };
            }
            return { success: false, message: result.message || 'Erro ao resolver issue da OS' };
        } catch (error) {
            console.error('Erro ao resolver issue da OS:', error);
            return { success: false, message: 'Erro inesperado ao resolver issue da OS' };
        }
    };

    const resolveRework = async (id: string, resolutionDetails?: string, nextStatus?: string) => {
        try {
            const result = await api.resolveRework(id, resolutionDetails, nextStatus);
            if (result.success && result.data) {
                // Atualizar o estado local com a OS retornada pela API
                setServiceOrders(prev => prev.map(so => 
                    so.id === id ? result.data : so
                ));
                return { success: true, message: result.message };
            }
            return { success: false, message: result.message || 'Erro ao resolver rework' };
        } catch (error) {
            console.error('Erro ao resolver rework:', error);
            return { success: false, message: 'Erro inesperado ao resolver rework' };
        }
    };

    const resolveDeliveryIssue = async (id: string, resolutionDetails?: string, nextStatus?: string) => {
        try {
            const result = await api.resolveDeliveryIssue(id, resolutionDetails, nextStatus);
            if (result.success && result.data) {
                // Atualizar o estado local com a OS retornada pela API
                setServiceOrders(prev => prev.map(so => 
                    so.id === id ? result.data : so
                ));
                return { success: true, message: result.message };
            }
            return { success: false, message: result.message || 'Erro ao resolver problema de entrega' };
        } catch (error) {
            console.error('Erro ao resolver problema de entrega:', error);
            return { success: false, message: 'Erro inesperado ao resolver problema de entrega' };
        }
    };

    const completeReview = async (id: string, resolutionDetails?: string, nextStatus?: string) => {
        try {
            const result = await api.completeReview(id, resolutionDetails, nextStatus);
            if (result.success && result.data) {
                // Atualizar o estado local com a OS retornada pela API
                setServiceOrders(prev => prev.map(so => 
                    so.id === id ? result.data : so
                ));
                return { success: true, message: result.message };
            }
            return { success: false, message: result.message || 'Erro ao completar revisão' };
        } catch (error) {
            console.error('Erro ao completar revisão:', error);
            return { success: false, message: 'Erro inesperado ao completar revisão' };
        }
    };

    // CutPiece management functions
    const loadCutPiecesForOS = async (serviceOrderId: string) => {
        try {
            const result = await api.getCutPiecesForOS(serviceOrderId);
            if (result.success && result.data) {
                // Mapear dados do backend para o formato do frontend
                const mappedCutPieces: CutPiece[] = result.data.map((piece: any) => ({
                    id: piece._id || piece.id,
                    pieceId: piece.pieceId,
                    serviceOrderId: piece.serviceOrderId,
                    originalQuoteItemId: piece.originalQuoteItemId,
                    originalStockItemId: piece.originalStockItemId,
                    materialId: piece.materialId,
                    description: piece.description,
                    category: piece.category,
                    dimensions: piece.dimensions,
                    status: piece.status,
                    location: piece.location,
                    qrCodeValue: piece.qrCodeValue,
                    createdAt: piece.createdAt,
                    updatedAt: piece.updatedAt
                }));
                
                // Atualizar o estado local com as peças cortadas da OS específica
                setCutPieces(prev => {
                    // Remover peças antigas da mesma OS e adicionar as novas
                    const filtered = prev.filter(piece => piece.serviceOrderId !== serviceOrderId);
                    return [...filtered, ...mappedCutPieces];
                });
            }
        } catch (error) {
            console.error('Erro ao carregar peças cortadas:', error);
        }
    };

    const updateCutPieceStatus = async (pieceId: string, status: string, reason?: string) => {
        try {
            const result = await api.updateAssetStatus('cut_piece', pieceId, status, reason);
            if (result.success && result.data) {
                // Atualizar o estado local com a peça cortada atualizada
                setCutPieces(prev => prev.map(piece => 
                    piece.id === pieceId ? { ...piece, status, updatedAt: new Date().toISOString() } : piece
                ));
                return { success: true, message: result.message };
            }
            return { success: false, message: result.message || 'Erro ao atualizar status da peça cortada' };
        } catch (error) {
            console.error('Erro ao atualizar status da peça cortada:', error);
            return { success: false, message: 'Erro inesperado ao atualizar status da peça cortada' };
        }
    };

    const value = {
        clients, setClients,
        opportunities, setOpportunities,
        agendaEvents, setAgendaEvents,
        notes, setNotes,
        suppliers, setSuppliers,
        materials,
        services,
        products,
        stockItems, setStockItems,
        quotes, setQuotes,
        orders, setOrders,
        serviceOrders, setServiceOrders,
        invoices, setInvoices,
        financialTransactions, setFinancialTransactions,
        receipts, setReceipts,
        users, setUsers,
        freightCostPerKm, setFreightCostPerKm,
        equipment, setEquipment,
        maintenanceLogs, setMaintenanceLogs,
        vehicles, setVehicles,
        deliveryRoutes, setDeliveryRoutes,
        checklistTemplates,
        orderAddendums, setOrderAddendums,
        cutPieces, setCutPieces,
        productionEmployees, setProductionEmployees,
        activityLogs, setActivityLogs,
        
        addClient,
        updateClient,
        addNote,
        saveQuote,
        createServiceOrder,
        updateServiceOrderPriority,
        updateServiceOrderObservations,
        saveInvoice,
        issueInvoice,
        saveSupplier,
        addEvent,
        markTransactionAsPaid,
        updateFinancialTransaction,
        addFinancialTransaction,
        addReceipt,
        saveMaterial,
        deleteMaterial,
        saveService,
        deleteService,
        saveProduct,
        deleteProduct,
        allocateSlabToOrder,
        addAttachmentToServiceOrder,
        removeAttachmentFromServiceOrder,
        scheduleDelivery,
        isVehicleAvailable,
        updateDepartureChecklist,
        updateServiceOrderStatus,
        completeProductionStep,
        setFinalizationType,
        confirmDelivery,
        confirmInstallation,
        
        // Equipment management functions
        addEquipment,
        updateEquipment,
        deleteEquipment,
        addVehicle,
        updateVehicle,
        deleteVehicle,
        addMaintenanceLog,
        updateMaintenanceLog,
        deleteMaintenanceLog,
        createChecklistTemplate,
        updateChecklistTemplate,
        deleteChecklistTemplate,

        // Production employee management functions
        addProductionEmployee,
        updateProductionEmployee,
        deleteProductionEmployee,
        
        // Activity log management functions
        addActivityLog,
        getActivityLogsByEntity,
        getActivityLogsByUser,
        getActivityLogsByType,
        
        // Order addendum management functions
        loadOrderAddendums,
        createOrderAddendum,
        updateOrderAddendumStatus,
        
        // ServiceOrder refresh functions
        refreshServiceOrder,
        
        // Service Order Exception Management functions
        markOrderForRework,
        reportDeliveryIssue,
        requestInstallationReview,
        resolveOrderIssue,
        resolveRework,
        resolveDeliveryIssue,
        completeReview,
        
        // CutPiece management functions
        loadCutPiecesForOS,
        updateCutPieceStatus,
    };

    return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
};

// Create a custom hook for easy consumption
export const useData = () => {
    const context = useContext(DataContext);
    if (context === undefined) {
        throw new Error('useData must be used within a DataProvider');
    }
    return context;
};