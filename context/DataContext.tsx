import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import type {
    Client, Opportunity, AgendaEvent, Note, Supplier, Material, StockItem,
    Service, Product, Quote, Order, ServiceOrder, Invoice, FinancialTransaction, Receipt, Address, Priority, ProductionStatus, FinalizationType, User, Equipment, MaintenanceLog, ProductionEmployee, ActivityLog, ActivityType, Vehicle, DeliveryRoute, ChecklistTemplate
} from '../types';
import {
    mockClients, mockOpportunities, mockAgendaEvents, mockNotes, mockSuppliers,
    mockMaterials, mockStockItems, mockServices, mockProducts, mockQuotes,
    mockOrders, mockServiceOrders, mockInvoices, mockFinancialTransactions,
    mockEquipment, mockMaintenanceLogs, mockProductionEmployees, mockActivityLogs, mockVehicles, mockDeliveryRoutes
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


    // Add specific data manipulation functions here
    addClient: (client: Client) => void;
    updateClient: (client: Client) => void;
    addNote: (clientId: string, content: string) => void;
    saveQuote: (quote: Quote) => void;
    createServiceOrder: (newOsData: Omit<ServiceOrder, 'id'>) => void;
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
    updateServiceOrderStatus: (serviceOrderId: string, status: ProductionStatus) => void;
    completeProductionStep: (serviceOrderId: string, requiresInstallation: boolean) => void;
    setFinalizationType: (orderId: string, type: FinalizationType) => void;
    confirmDelivery: (orderId: string) => void;
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
    const [materials, setMaterials] = useState<Material[]>(mockMaterials);
    const [services, setServices] = useState<Service[]>(mockServices);
    const [products, setProducts] = useState<Product[]>(mockProducts);
    const [stockItems, setStockItems] = useState<StockItem[]>(mockStockItems);
    const [quotes, setQuotes] = useState<Quote[]>([]);
    const [orders, setOrders] = useState<Order[]>(mockOrders);
    const [serviceOrders, setServiceOrders] = useState<ServiceOrder[]>(mockServiceOrders);
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
    const [checklistTemplates, setChecklistTemplates] = useState<ChecklistTemplate[]>([]);

    // Carregar dados do backend
    useEffect(() => {
        loadClients();
        loadSuppliers();
        loadQuotes();
        loadOrders();
        loadUsers();
        loadChecklistTemplates();
    }, []);

    const generateChecklistItemId = () => {
        if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
            return crypto.randomUUID();
        }
        return `chk-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
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
            const result = await api.createClient(clientToSave);
            if (result.success) {
                await loadClients();
            }
        } catch (error) {
            console.error('Erro ao adicionar cliente:', error);
        }
    };

    const updateClient = async (clientToUpdate: Client) => {
        try {
            const result = await api.updateClient(clientToUpdate.id, clientToUpdate);
            if (result.success) {
                await loadClients();
            }
        } catch (error) {
            console.error('Erro ao atualizar cliente:', error);
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
                const result = await api.createQuote(quoteToSave);
                if (result.success) {
                    console.log('✅ Orçamento criado com sucesso:', result.message);
                    await loadQuotes();
                    // Se o novo orçamento já foi criado como aprovado, recarregar pedidos
                    if (quoteToSave.status === 'approved') {
                        console.log('📦 Carregando pedidos após aprovação...');
                        await loadOrders();
                        if (result.order) {
                            console.log('✨ Pedido criado automaticamente:', result.order.id || result.order._id);
                        }
                    }
                    return;
                }
            } else {
                const result = await api.updateQuote(quoteToSave.id, quoteToSave);
                if (result.success) {
                    console.log('✅ Orçamento atualizado com sucesso:', result.message);
                    await loadQuotes();
                    // Se o orçamento foi aprovado, recarregar pedidos pois um novo foi criado
                    if (quoteToSave.status === 'approved') {
                        console.log('📦 Carregando pedidos após aprovação...');
                        await loadOrders();
                        if (result.order) {
                            console.log('✨ Pedido criado automaticamente:', result.order.id || result.order._id);
                        }
                    }
                    return;
                }
            }
        } catch (error) {
            console.error('❌ Erro ao salvar orçamento:', error);
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
    
    const createServiceOrder = (newOsData: Omit<ServiceOrder, 'id'>) => {
        const newOsId = `OS-2024-${(serviceOrders.length + mockServiceOrders.length + 1).toString().padStart(3, '0')}`;
        const newOs: ServiceOrder = { 
            ...newOsData, 
            id: newOsId, 
            priority: 'normal',
            deliveryAddress: orders.find(o => o.id === newOsData.orderId)?.deliveryAddress as Address
        };
        
        setServiceOrders(prev => [...prev, newOs]);
        setOrders(prev => prev.map(o => 
            o.id === newOs.orderId 
                ? { ...o, serviceOrderIds: [...o.serviceOrderIds, newOs.id] } 
                : o
        ));
    };

    const updateServiceOrderPriority = (serviceOrderId: string, priority: Priority) => {
        setServiceOrders(prev => prev.map(so => 
            so.id === serviceOrderId ? { ...so, priority } : so
        ));
    };

    const updateServiceOrderObservations = (serviceOrderId: string, observations: string) => {
        setServiceOrders(prev => prev.map(so => 
            so.id === serviceOrderId ? { ...so, observations } : so
        ));
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
            if (supplierToSave.id.startsWith('new-')) {
                const result = await api.createSupplier(supplierToSave);
                if (result.success) {
                    await loadSuppliers();
                }
            } else {
                const result = await api.updateSupplier(supplierToSave.id, supplierToSave);
                if (result.success) {
                    await loadSuppliers();
                }
            }
        } catch (error) {
            console.error('Erro ao salvar fornecedor:', error);
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

    const saveMaterial = (material: Material) => {
        if (material.id.startsWith('new-')) {
            const newId = `mat-${(mockMaterials.length + materials.length + 1).toString().padStart(3, '0')}`;
            setMaterials(prev => [...prev, { ...material, id: newId }]);
        } else {
            setMaterials(prev => prev.map(m => m.id === material.id ? material : m));
        }
    };
    const deleteMaterial = (materialId: string) => setMaterials(prev => prev.filter(m => m.id !== materialId));

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

        setServiceOrders(prev => prev.map(so =>
            so.id === serviceOrderId
                ? {
                    ...so,
                    status: 'scheduled',
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
            const result = await api.updateServiceOrderChecklist(serviceOrderId, normalized);
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
    
    const updateServiceOrderStatus = (serviceOrderId: string, status: ProductionStatus) => {
        setServiceOrders(prev => prev.map(so =>
            so.id === serviceOrderId ? { ...so, status } : so
        ));
    };

    const completeProductionStep = (serviceOrderId: string, requiresInstallation: boolean) => {
        setServiceOrders(prev => prev.map(so => 
            so.id === serviceOrderId ? { ...so, status: 'ready_for_logistics', requiresInstallation } : so
        ));
    };
    
    const setFinalizationType = (orderId: string, type: FinalizationType) => {
        setServiceOrders(prev => prev.map(so => {
            if (so.id === orderId) {
                const newStatus = type === 'pickup' ? 'awaiting_pickup' : 'ready_for_logistics';
                return { ...so, finalizationType: type, status: newStatus };
            }
            return so;
        }));
    };

    const confirmDelivery = (orderId: string) => {
        setServiceOrders(prev => prev.map(so => {
            if (so.id === orderId) {
                const isComplete = so.finalizationType === 'delivery_only';
                return { ...so, delivery_confirmed: true, status: isComplete ? 'completed' : so.status };
            }
            return so;
        }));
    };
    
    const confirmInstallation = (orderId: string) => {
        setServiceOrders(prev => prev.map(so => {
            if (so.id === orderId) {
                // An installation can only be completed if the delivery was also confirmed.
                const isComplete = so.delivery_confirmed;
                return { ...so, installation_confirmed: true, status: isComplete ? 'completed' : so.status };
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