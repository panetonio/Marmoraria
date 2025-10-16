import React, { createContext, useState, useContext, ReactNode } from 'react';
import type { 
    Client, Opportunity, AgendaEvent, Note, Supplier, Material, StockItem, 
    Service, Product, Quote, Order, ServiceOrder, Invoice, FinancialTransaction, Receipt, Address 
} from '../types';
import { 
    mockClients, mockOpportunities, mockAgendaEvents, mockNotes, mockSuppliers, 
    mockMaterials, mockStockItems, mockServices, mockProducts, mockQuotes, 
    mockOrders, mockServiceOrders, mockInvoices, mockFinancialTransactions 
} from '../data/mockData';

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
    freightCostPerKm: number;
    setFreightCostPerKm: React.Dispatch<React.SetStateAction<number>>;


    // Add specific data manipulation functions here
    addClient: (client: Client) => void;
    updateClient: (client: Client) => void;
    addNote: (clientId: string, content: string) => void;
    saveQuote: (quote: Quote) => void;
    createServiceOrder: (newOsData: Omit<ServiceOrder, 'id'>) => void;
    saveInvoice: (invoice: Invoice) => void;
    issueInvoice: (invoiceId: string) => void;
    saveSupplier: (supplier: Supplier) => void;
    addEvent: (event: Omit<AgendaEvent, 'id'>) => void;
    markTransactionAsPaid: (transactionId: string) => void;
    addReceipt: (receiptData: Omit<Receipt, 'id' | 'createdAt'>) => void;
    saveMaterial: (material: Material) => void;
    deleteMaterial: (materialId: string) => void;
    saveService: (service: Service) => void;
    deleteService: (serviceId: string) => void;
    saveProduct: (product: Product) => void;
    deleteProduct: (productId: string) => void;
    allocateSlabToOrder: (serviceOrderId: string, slabId: string) => void;
}

// Create the context
const DataContext = createContext<DataContextType | undefined>(undefined);

// Create the provider component
export const DataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    // Initialize all states here
    const [clients, setClients] = useState<Client[]>(mockClients);
    const [opportunities, setOpportunities] = useState<Opportunity[]>(mockOpportunities);
    const [agendaEvents, setAgendaEvents] = useState<AgendaEvent[]>(mockAgendaEvents);
    const [notes, setNotes] = useState<Note[]>(mockNotes);
    const [suppliers, setSuppliers] = useState<Supplier[]>(mockSuppliers);
    const [materials, setMaterials] = useState<Material[]>(mockMaterials);
    const [services, setServices] = useState<Service[]>(mockServices);
    const [products, setProducts] = useState<Product[]>(mockProducts);
    const [stockItems, setStockItems] = useState<StockItem[]>(mockStockItems);
    const [quotes, setQuotes] = useState<Quote[]>(mockQuotes);
    const [orders, setOrders] = useState<Order[]>(mockOrders);
    const [serviceOrders, setServiceOrders] = useState<ServiceOrder[]>(mockServiceOrders);
    const [invoices, setInvoices] = useState<Invoice[]>(mockInvoices);
    const [financialTransactions, setFinancialTransactions] = useState<FinancialTransaction[]>(mockFinancialTransactions);
    const [receipts, setReceipts] = useState<Receipt[]>([]);
    const [freightCostPerKm, setFreightCostPerKm] = useState<number>(8);

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
    const addClient = (clientToSave: Client) => {
        const newClient: Client = {
            ...clientToSave,
            id: `cli-${clients.length + 1}`,
            createdAt: new Date().toISOString(),
        };
        setClients(prev => [...prev, newClient]);
    };

    const updateClient = (clientToUpdate: Client) => {
        setClients(prev => prev.map(c => c.id === clientToUpdate.id ? clientToUpdate : c));
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
    
    const saveQuote = (quoteToSave: Quote) => {
        const isNewQuote = quoteToSave.id.startsWith('new-');
        
        let savedQuote = { ...quoteToSave };

        if (isNewQuote) {
            const newId = `ORC-2024-${(mockQuotes.length + quotes.length + 1).toString().padStart(3, '0')}`;
            savedQuote.id = newId;
            setQuotes(prev => [...prev, savedQuote]);
        } else {
            setQuotes(prev => prev.map(q => q.id === savedQuote.id ? savedQuote : q));
        }

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
        const newOs: ServiceOrder = { ...newOsData, id: newOsId };
        
        setServiceOrders(prev => [...prev, newOs]);
        setOrders(prev => prev.map(o => 
            o.id === newOs.orderId 
                ? { ...o, serviceOrderIds: [...o.serviceOrderIds, newOs.id] } 
                : o
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
    
    const saveSupplier = (supplierToSave: Supplier) => {
        if (supplierToSave.id.startsWith('new-')) {
            const newId = `sup-${suppliers.length + 1}`;
            setSuppliers(prev => [...prev, { ...supplierToSave, id: newId }]);
        } else {
            setSuppliers(prev => prev.map(s => s.id === supplierToSave.id ? supplierToSave : s));
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
        freightCostPerKm, setFreightCostPerKm,
        
        addClient,
        updateClient,
        addNote,
        saveQuote,
        createServiceOrder,
        saveInvoice,
        issueInvoice,
        saveSupplier,
        addEvent,
        markTransactionAsPaid,
        addReceipt,
        saveMaterial,
        deleteMaterial,
        saveService,
        deleteService,
        saveProduct,
        deleteProduct,
        allocateSlabToOrder,
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