import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import type { 
    Client, Opportunity, AgendaEvent, Note, Supplier, Material, StockItem, 
    Service, Product, Quote, Order, ServiceOrder, Invoice, FinancialTransaction, Receipt, Address, Priority, ProductionStatus, FinalizationType, User, Equipment, MaintenanceLog, ProductionEmployee 
} from '../types';
import { 
    mockClients, mockOpportunities, mockAgendaEvents, mockNotes, mockSuppliers, 
    mockMaterials, mockStockItems, mockServices, mockProducts, mockQuotes, 
    mockOrders, mockServiceOrders, mockInvoices, mockFinancialTransactions,
    mockEquipment, mockMaintenanceLogs, mockProductionEmployees 
} from '../data/mockData';
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
    scheduleDelivery: (serviceOrderId: string, deliveryDate: string, teamIds: string[]) => void;
    updateDepartureChecklist: (serviceOrderId: string, checklist: { id: string; text: string; checked: boolean }[]) => void;
    updateServiceOrderStatus: (serviceOrderId: string, status: ProductionStatus) => void;
    completeProductionStep: (serviceOrderId: string, requiresInstallation: boolean) => void;
    setFinalizationType: (orderId: string, type: FinalizationType) => void;
    confirmDelivery: (orderId: string) => void;
    confirmInstallation: (orderId: string) => void;
    
    // Equipment management functions
    addEquipment: (equipment: Equipment) => void;
    updateEquipment: (equipment: Equipment) => void;
    deleteEquipment: (equipmentId: string) => void;
    addMaintenanceLog: (maintenanceLog: MaintenanceLog) => void;
    updateMaintenanceLog: (maintenanceLog: MaintenanceLog) => void;
    deleteMaintenanceLog: (maintenanceLogId: string) => void;
    
    // Production employee management functions
    addProductionEmployee: (employee: ProductionEmployee) => void;
    updateProductionEmployee: (employee: ProductionEmployee) => void;
    deleteProductionEmployee: (employeeId: string) => void;
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
    const [equipment, setEquipment] = useState<Equipment[]>(mockEquipment);
    const [maintenanceLogs, setMaintenanceLogs] = useState<MaintenanceLog[]>(mockMaintenanceLogs);
    const [productionEmployees, setProductionEmployees] = useState<ProductionEmployee[]>(mockProductionEmployees);

    // Carregar dados do backend
    useEffect(() => {
        loadClients();
        loadSuppliers();
        loadQuotes();
        loadOrders();
        loadUsers();
    }, []);

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
    
    const scheduleDelivery = (serviceOrderId: string, deliveryDate: string, teamIds: string[]) => {
        setServiceOrders(prev => prev.map(so => 
            so.id === serviceOrderId 
            ? { ...so, status: 'scheduled', deliveryScheduledDate: deliveryDate, deliveryTeamIds: teamIds } 
            : so
        ));
    };

    const updateDepartureChecklist = (serviceOrderId: string, checklist: { id: string; text: string; checked: boolean }[]) => {
        setServiceOrders(prev => prev.map(so => 
            so.id === serviceOrderId ? { ...so, departureChecklist: checklist } : so
        ));
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
        productionEmployees, setProductionEmployees,
        
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
        addMaintenanceLog,
        updateMaintenanceLog,
        deleteMaintenanceLog,
        
        // Production employee management functions
        addProductionEmployee,
        updateProductionEmployee,
        deleteProductionEmployee,
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