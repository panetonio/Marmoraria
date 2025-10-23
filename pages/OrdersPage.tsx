import React, { useState, useMemo, FC, useEffect } from 'react';
import { mockUsers } from '../data/mockData';
import type { Order, QuoteItem, ServiceOrder, Page, SortDirection, ProductionStatus } from '../types';
import Modal from '../components/ui/Modal';
import Button from '../components/ui/Button';
import Card, { CardContent, CardHeader } from '../components/ui/Card';
import DocumentPreview from '../components/QuotePreview';
import { useData } from '../context/DataContext';
import Select from '../components/ui/Select';
import Input from '../components/ui/Input';
import StatusBadge from '../components/ui/StatusBadge';
import type { StatusMap } from '../components/ui/StatusBadge';

type OrderStatus = 'approved' | 'in_production' | 'in_logistics' | 'completed';

const orderStatusMap: StatusMap<OrderStatus> = {
    approved: { label: 'Aguardando Produção', variant: 'default' },
    in_production: { label: 'Em Produção', variant: 'warning' },
    in_logistics: { label: 'Em Logística', variant: 'primary' },
    completed: { label: 'Concluído', variant: 'success' },
};

const getOrderStatus = (order: Order, allServiceOrders: ServiceOrder[]): OrderStatus => {
    const relatedSOs = allServiceOrders.filter(so => so.orderId === order.id);

    const assignedItemIds = new Set(relatedSOs.flatMap(os => os.items.map(item => item.id)));
    const hasUnassignedItems = order.items.some(item => !assignedItemIds.has(item.id));

    if (relatedSOs.length === 0 || hasUnassignedItems) {
        return 'approved';
    }

    if (relatedSOs.every(so => so.status === 'completed')) {
        return 'completed';
    }
    
    const productionStatuses: ProductionStatus[] = ['cutting', 'finishing'];
    if (relatedSOs.some(so => productionStatuses.includes(so.status))) {
        return 'in_production';
    }

    const logisticsStatuses: ProductionStatus[] = ['awaiting_pickup', 'ready_for_logistics', 'scheduled', 'in_transit', 'realizado'];
    if (relatedSOs.some(so => logisticsStatuses.includes(so.status))) {
        return 'in_logistics';
    }

    return 'approved'; // Fallback
};


const CreateServiceOrderModal: FC<{
    isOpen: boolean;
    order: Order;
    onClose: () => void;
    onCreate: (newOs: Omit<ServiceOrder, 'id'>) => void;
}> = ({ isOpen, order, onClose, onCreate }) => {
    const { serviceOrders, checklistTemplates } = useData();
    const [selectedItemIds, setSelectedItemIds] = useState<string[]>([]);
    const [deliveryDate, setDeliveryDate] = useState('');
    const [error, setError] = useState<string>('');
    const [selectedTemplateId, setSelectedTemplateId] = useState('');

    // Resetar estado quando o modal abrir ou o pedido mudar
    useEffect(() => {
        if (isOpen) {
            setSelectedItemIds([]);
            setDeliveryDate('');
            setError('');
            setSelectedTemplateId('');
        }
    }, [isOpen, order.id]);

    const availableItems = useMemo(() => {
        const assignedItemIds = new Set(
            serviceOrders
                .filter(os => os.orderId === order.id)
                .flatMap(os => os.items.map(item => item.id))
        );
        const available = order.items.filter(item => !assignedItemIds.has(item.id));
        
        // Debug: Verificar se há IDs duplicados
        const itemIds = available.map(item => item.id);
        const uniqueIds = new Set(itemIds);
        if (itemIds.length !== uniqueIds.size) {
            console.warn('⚠️ Aviso: IDs duplicados encontrados nos itens disponíveis!', itemIds);
        }
        
        return available;
    }, [order, serviceOrders]);

    const selectedItems = useMemo(() => {
        return order.items.filter(item => selectedItemIds.includes(item.id));
    }, [selectedItemIds, order.items]);

    const selectedItemsTotal = useMemo(() => {
        return selectedItems.reduce((sum, item) => sum + item.totalPrice, 0);
    }, [selectedItems]);

    const handleToggleItem = (itemId: string) => {
        setSelectedItemIds(prev => {
            const isCurrentlySelected = prev.includes(itemId);
            const newSelection = isCurrentlySelected 
                ? prev.filter(id => id !== itemId) 
                : [...prev, itemId];
            
            // Debug: Log para verificar seleção
            console.log('Toggle item:', itemId, 'Currently selected:', isCurrentlySelected, 'New selection:', newSelection);
            
            return newSelection;
        });
    };

    const selectedTemplate = useMemo(() => {
        return checklistTemplates.find(template => template.id === selectedTemplateId) || null;
    }, [checklistTemplates, selectedTemplateId]);

    const generateChecklistItemId = () => {
        if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
            return crypto.randomUUID();
        }
        return `chk-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    };

    const handleCreate = () => {
        setError('');
        if (selectedItemIds.length === 0) {
            setError("Selecione pelo menos um item para a Ordem de Serviço.");
            return;
        }
        if (!deliveryDate) {
            setError("A data de entrega é obrigatória.");
            return;
        }
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Compare dates only
        if (new Date(deliveryDate) < today) {
            setError("A data de entrega não pode ser no passado.");
            return;
        }

        // FIX: Add missing 'deliveryAddress' property to satisfy the 'Omit<ServiceOrder, "id">' type.
        const newOsData: Omit<ServiceOrder, 'id'> = {
            orderId: order.id,
            clientName: order.clientName,
            deliveryAddress: order.deliveryAddress,
            items: selectedItems,
            total: selectedItemsTotal,
            deliveryDate: new Date(deliveryDate).toISOString(),
            assignedToIds: [],
            productionStatus: 'pending_production',
            logisticsStatus: 'awaiting_scheduling',
            isFinalized: false,
            departureChecklist: selectedTemplate
                ? selectedTemplate.items.map(item => ({
                    id: item.id || generateChecklistItemId(),
                    text: item.text,
                    checked: false,
                }))
                : undefined,
        };
        onCreate(newOsData);
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Gerar OS para ${order.id}`}>
            <div className="mb-4">
                <label className="block text-sm font-medium text-text-secondary dark:text-slate-400 mb-1">Itens do Pedido Disponíveis</label>
                <div className="max-h-60 overflow-y-auto border border-border dark:border-slate-700 rounded-lg p-2 space-y-2">
                    {availableItems.length > 0 ? availableItems.map(item => (
                        <div key={item.id} className="flex items-center p-2 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700">
                            <input
                                type="checkbox"
                                id={`os-item-${item.id}`}
                                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
                                checked={selectedItemIds.includes(item.id)}
                                onChange={() => handleToggleItem(item.id)}
                            />
                            <label 
                                htmlFor={`os-item-${item.id}`}
                                className="ml-3 text-sm text-text-primary dark:text-slate-200 cursor-pointer flex-1"
                            >
                                {item.description} ({item.totalPrice.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })})
                            </label>
                        </div>
                    )) : <p className="text-sm text-text-secondary dark:text-slate-400 p-4 text-center">Todos os itens deste pedido já foram alocados em Ordens de Serviço.</p>}
                </div>
            </div>
             {selectedItems.length > 0 && (
                <div className="my-4 p-4 bg-slate-100 dark:bg-slate-700/50 rounded-lg border border-border dark:border-slate-700">
                    <h4 className="font-semibold mb-2 text-text-primary dark:text-slate-100">Resumo da Nova OS</h4>
                    <ul className="list-disc list-inside text-sm text-text-secondary dark:text-slate-300 space-y-1 mb-3">
                        {selectedItems.map(item => (
                            <li key={item.id}>{item.description}</li>
                        ))}
                    </ul>
                    <div className="flex justify-between items-center text-lg font-bold border-t border-border dark:border-slate-600 pt-2">
                        <span className="text-text-primary dark:text-slate-100">Total da OS:</span>
                        <span className="text-primary">{selectedItemsTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                    </div>
                </div>
            )}
            <div className="mb-6">
                <label htmlFor="delivery-date" className="block text-sm font-medium text-text-secondary dark:text-slate-400 mb-1">Data de Entrega para esta OS</label>
                <input
                    id="delivery-date"
                    type="date"
                    value={deliveryDate}
                    onChange={e => setDeliveryDate(e.target.value)}
                    className={`p-2 border rounded w-full text-text-primary bg-slate-50 dark:bg-slate-700 dark:text-slate-200 ${error && !deliveryDate ? 'border-error' : 'border-border dark:border-slate-700'} h-[42px]`}
                />
            </div>
            <div className="mb-6">
                <Select
                    id="checklist-template-select"
                    label="Modelo de Checklist Inicial (opcional)"
                    value={selectedTemplateId}
                    onChange={(event) => setSelectedTemplateId(event.target.value)}
                >
                    <option value="">Sem checklist padrão</option>
                    {checklistTemplates.map(template => (
                        <option key={template.id} value={template.id}>
                            {template.name} • {template.items.length} item{template.items.length === 1 ? '' : 's'}
                        </option>
                    ))}
                </Select>
                {selectedTemplate ? (
                    <div className="mt-3 p-3 bg-slate-100 dark:bg-slate-700/40 border border-border dark:border-slate-600 rounded-lg">
                        <h4 className="text-sm font-semibold text-text-primary dark:text-slate-100 mb-2">Itens do Checklist Selecionado</h4>
                        <ul className="space-y-1 text-sm text-text-secondary dark:text-slate-300">
                            {selectedTemplate.items.map((item, index) => (
                                <li key={item.id || `${selectedTemplate.id}-preview-${index}`} className="flex items-center gap-2">
                                    <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold text-xs">{index + 1}</span>
                                    <span>{item.text}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                ) : (
                    <p className="mt-2 text-xs text-text-secondary dark:text-slate-400">
                        Escolha um modelo para preencher automaticamente o checklist de saída da equipe.
                    </p>
                )}
            </div>
            {error && <p className="text-error text-center text-sm mb-4">{error}</p>}
            <div className="flex justify-end space-x-3">
                <Button variant="ghost" onClick={onClose}>Cancelar</Button>
                <Button onClick={handleCreate} disabled={availableItems.length === 0}>Gerar OS</Button>
            </div>
        </Modal>
    );
};

interface OrdersPageProps {
    searchTarget: { page: Page; id: string } | null;
    clearSearchTarget: () => void;
}

const OrdersPage: FC<OrdersPageProps> = ({ searchTarget, clearSearchTarget }) => {
    const { orders, serviceOrders, createServiceOrder, quotes } = useData();
    const [isOsModalOpen, setIsOsModalOpen] = useState(false);
    const [selectedOrderForOs, setSelectedOrderForOs] = useState<Order | null>(null);
    const [viewingOrder, setViewingOrder] = useState<Order | null>(null);
    const [orderIdFilter, setOrderIdFilter] = useState('');
    const [clientFilter, setClientFilter] = useState('');
    const [startDateFilter, setStartDateFilter] = useState('');
    const [endDateFilter, setEndDateFilter] = useState('');
    const [salespersonFilter, setSalespersonFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState<OrderStatus | ''>('');
    const [sortConfig, setSortConfig] = useState<{ key: keyof Order | null; direction: SortDirection }>({ key: 'approvalDate', direction: 'descending' });

    const salespeople = useMemo(() => mockUsers.filter(u => u.role === 'vendedor'), []);

    const salespeopleMap = useMemo(() => {
        return salespeople.reduce((acc, user) => {
            acc[user.id] = user.name;
            return acc;
        }, {} as Record<string, string>);
    }, [salespeople]);

    const handleSort = (key: keyof Order) => {
        let direction: SortDirection = 'ascending';
        if (sortConfig.key === key && sortConfig.direction === 'ascending') {
            direction = 'descending';
        }
        setSortConfig({ key, direction });
    };

    const filteredOrders = useMemo(() => {
        const ordersWithStatus = orders.map(order => ({
            ...order,
            status: getOrderStatus(order, serviceOrders)
        }));

        let filtered = ordersWithStatus.filter(order => {
            const orderIdMatch = orderIdFilter ? order.id.toLowerCase().includes(orderIdFilter.toLowerCase()) : true;
            const clientMatch = clientFilter ? order.clientName.toLowerCase().includes(clientFilter.toLowerCase()) : true;
            
            const date = new Date(order.approvalDate);
            const startMatch = startDateFilter ? new Date(startDateFilter) <= date : true;
            
            const end = endDateFilter ? new Date(endDateFilter) : null;
            if (end) {
                // Set to the beginning of the next day in UTC to include the entire selected end day
                end.setUTCDate(end.getUTCDate() + 1);
            }
            const endMatch = end ? date < end : true;
            
            const salespersonMatch = salespersonFilter ? order.salespersonId === salespersonFilter : true;
            const statusMatch = statusFilter ? order.status === statusFilter : true;
            return orderIdMatch && clientMatch && startMatch && endMatch && salespersonMatch && statusMatch;
        });

        if (sortConfig.key) {
            filtered.sort((a, b) => {
                const aValue = a[sortConfig.key!];
                const bValue = b[sortConfig.key!];

                if (aValue === null || aValue === undefined) return 1;
                if (bValue === null || bValue === undefined) return -1;
    
                if (aValue < bValue) {
                    return sortConfig.direction === 'ascending' ? -1 : 1;
                }
                if (aValue > bValue) {
                    return sortConfig.direction === 'ascending' ? 1 : -1;
                }
                return 0;
            });
        }

        return filtered;
    }, [orders, serviceOrders, orderIdFilter, clientFilter, startDateFilter, endDateFilter, salespersonFilter, statusFilter, sortConfig]);

    const handleOpenOsModal = (order: Order) => {
        setSelectedOrderForOs(order);
        setIsOsModalOpen(true);
    };
    
    useEffect(() => {
        if (searchTarget && searchTarget.page === 'orders') {
            const order = orders.find(o => o.id === searchTarget.id);
            if (order) {
                setViewingOrder(order);
            }
            clearSearchTarget();
        }
    }, [searchTarget, orders, clearSearchTarget]);

    const handleCloseOsModal = () => {
        setSelectedOrderForOs(null);
        setIsOsModalOpen(false);
    };

    const handleCreateOs = (newOsData: Omit<ServiceOrder, 'id'>) => {
        createServiceOrder(newOsData);
        handleCloseOsModal();
    };

     const SortableTh: React.FC<{ children: React.ReactNode, columnKey: keyof Order }> = ({ children, columnKey }) => {
        const isSorted = sortConfig.key === columnKey;
        const directionIcon = sortConfig.direction === 'ascending' ? '▲' : '▼';
        return (
            <th className="p-3 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800" onClick={() => handleSort(columnKey)}>
                <div className="flex items-center space-x-1">
                    <span>{children}</span>
                    {isSorted && <span className="text-primary text-xs">{directionIcon}</span>}
                </div>
            </th>
        );
    };

    return (
        <div>
             {isOsModalOpen && selectedOrderForOs && (
                <CreateServiceOrderModal
                    isOpen={isOsModalOpen}
                    order={selectedOrderForOs}
                    onClose={handleCloseOsModal}
                    onCreate={handleCreateOs}
                />
            )}
            {viewingOrder && (
                <DocumentPreview document={viewingOrder} onClose={() => setViewingOrder(null)} />
            )}
            <h1 className="text-3xl font-bold text-text-primary dark:text-slate-100">Pedidos Aprovados</h1>
            <p className="mt-2 text-text-secondary dark:text-slate-400">
                Gerencie os pedidos aprovados vindos dos orçamentos e gere as Ordens de Serviço (OS) para a produção. 
                <span className="inline-block ml-2 text-primary font-medium">Clique em qualquer pedido para ver os detalhes.</span>
            </p>

            <Card className="mt-8 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-border dark:border-slate-700">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
                    <div>
                        <Input
                            id="order-id-filter-orders"
                            label="ID do Pedido"
                            type="text"
                            placeholder="PED-..."
                            value={orderIdFilter}
                            onChange={(e) => setOrderIdFilter(e.target.value)}
                        />
                    </div>
                    <div>
                        <Input
                            id="client-filter-orders"
                            label="Cliente"
                            type="text"
                            placeholder="Nome do cliente..."
                            value={clientFilter}
                            onChange={(e) => setClientFilter(e.target.value)}
                        />
                    </div>
                    <div>
                        <Input
                            id="start-date-filter-orders"
                            label="Data Início"
                            type="date"
                            value={startDateFilter}
                            onChange={(e) => setStartDateFilter(e.target.value)}
                            className="text-text-secondary dark:text-slate-300"
                        />
                    </div>
                    <div>
                        <Input
                            id="end-date-filter-orders"
                            label="Data Final"
                            type="date"
                            value={endDateFilter}
                            onChange={(e) => setEndDateFilter(e.target.value)}
                            className="text-text-secondary dark:text-slate-300"
                        />
                    </div>
                    <div>
                        <Select
                            id="salesperson-filter-orders"
                            label="Vendedor"
                            value={salespersonFilter}
                            onChange={(e) => setSalespersonFilter(e.target.value)}
                        >
                            <option value="">Todos os Vendedores</option>
                            {salespeople.map(user => (
                                <option key={user.id} value={user.id}>{user.name}</option>
                            ))}
                        </Select>
                    </div>
                     <div>
                        <Select
                            id="status-filter-orders"
                            label="Status do Pedido"
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value as OrderStatus | '')}
                        >
                            <option value="">Todos os Status</option>
                            {Object.entries(orderStatusMap).map(([value, { label }]) => (
                                <option key={value} value={value}>{label}</option>
                            ))}
                        </Select>
                    </div>
                </div>
            </Card>

            <Card className="mt-8 p-0">
                 <CardContent>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="border-b border-border dark:border-slate-700">
                                    <SortableTh columnKey="id">ID do Pedido</SortableTh>
                                    <SortableTh columnKey="clientName">Cliente</SortableTh>
                                    <SortableTh columnKey="approvalDate">Data de Aprovação</SortableTh>
                                    <SortableTh columnKey="salespersonId">Vendedor</SortableTh>
                                    <th className="p-3">Status</th>
                                    <SortableTh columnKey="total">Total</SortableTh>
                                    <th className="p-3">OS Geradas</th>
                                    <th className="p-3 text-center">Ações</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredOrders.map(order => {
                                    const assignedItemIds = new Set(
                                        serviceOrders
                                            .filter(os => os.orderId === order.id)
                                            .flatMap(os => os.items.map(item => item.id))
                                    );
                                    const hasUnassignedItems = order.items.some(item => !assignedItemIds.has(item.id));

                                    return (
                                        <tr 
                                            key={order.id} 
                                            className="border-b border-border dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50 cursor-pointer"
                                            onClick={() => setViewingOrder(order)}
                                        >
                                            <td className="p-3 font-mono text-sm">{order.id}</td>
                                            <td className="p-3">{order.clientName}</td>
                                            <td className="p-3">{new Date(order.approvalDate).toLocaleDateString()}</td>
                                            <td className="p-3">{order.salespersonId ? salespeopleMap[order.salespersonId] : 'N/A'}</td>
                                            <td className="p-3"><StatusBadge status={order.status} statusMap={orderStatusMap} /></td>
                                            <td className="p-3 text-right font-semibold">{order.total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                                            <td className="p-3 text-xs font-mono">{order.serviceOrderIds.join(', ') || '-'}</td>
                                            <td className="p-3 text-center space-x-2" onClick={(e) => e.stopPropagation()}>
                                                 <Button size="sm" variant="ghost" onClick={() => setViewingOrder(order)}>
                                                    Ver Detalhes
                                                </Button>
                                                {hasUnassignedItems ? (
                                                    <Button size="sm" variant="secondary" onClick={() => handleOpenOsModal(order)}>
                                                        Gerar OS
                                                    </Button>
                                                ) : (
                                                    <span className="text-xs text-green-600 dark:text-green-400 font-semibold inline-flex items-center px-2">
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                                                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                                        </svg>
                                                        Completo
                                                    </span>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                                {filteredOrders.length === 0 && (
                                    <tr>
                                        <td colSpan={8} className="text-center p-4 text-text-secondary dark:text-slate-400">Nenhum pedido encontrado com os filtros aplicados.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                 </CardContent>
            </Card>
        </div>
    );
};

export default OrdersPage;