import React, { useState, useMemo, FC, useEffect } from 'react';
import { mockUsers } from '../data/mockData';
import type { Order, QuoteItem, ServiceOrder, Page } from '../types';
import Modal from '../components/ui/Modal';
import Button from '../components/ui/Button';
import Card, { CardContent, CardHeader } from '../components/ui/Card';


const CreateServiceOrderModal: FC<{
    isOpen: boolean;
    order: Order;
    serviceOrders: ServiceOrder[];
    onClose: () => void;
    onCreate: (newOs: Omit<ServiceOrder, 'id'>) => void;
}> = ({ isOpen, order, serviceOrders, onClose, onCreate }) => {
    const [selectedItemIds, setSelectedItemIds] = useState<string[]>([]);
    const [deliveryDate, setDeliveryDate] = useState('');
    const [error, setError] = useState<string>('');

    const availableItems = useMemo(() => {
        const assignedItemIds = new Set(
            serviceOrders
                .filter(os => os.orderId === order.id)
                .flatMap(os => os.items.map(item => item.id))
        );
        return order.items.filter(item => !assignedItemIds.has(item.id));
    }, [order, serviceOrders]);

    const handleToggleItem = (itemId: string) => {
        setSelectedItemIds(prev => 
            prev.includes(itemId) ? prev.filter(id => id !== itemId) : [...prev, itemId]
        );
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

        const itemsForNewOs = order.items.filter(item => selectedItemIds.includes(item.id));
        const newOsData: Omit<ServiceOrder, 'id'> = {
            orderId: order.id,
            clientName: order.clientName,
            items: itemsForNewOs,
            total: itemsForNewOs.reduce((sum, item) => sum + item.totalPrice, 0),
            deliveryDate: new Date(deliveryDate).toISOString(),
            assignedToIds: [],
            status: 'cutting'
        };
        onCreate(newOsData);
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Gerar OS para ${order.id}`}>
            <div className="mb-4">
                <label className="block text-sm font-medium text-text-secondary dark:text-slate-400 mb-1">Itens do Pedido Disponíveis</label>
                <div className="max-h-60 overflow-y-auto border border-border dark:border-slate-700 rounded-lg p-2 space-y-2">
                    {availableItems.length > 0 ? availableItems.map(item => (
                        <label key={item.id} className="flex items-center p-2 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer">
                            <input
                                type="checkbox"
                                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                                checked={selectedItemIds.includes(item.id)}
                                onChange={() => handleToggleItem(item.id)}
                            />
                            <span className="ml-3 text-sm text-text-primary dark:text-slate-200">{item.description} ({item.totalPrice.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })})</span>
                        </label>
                    )) : <p className="text-sm text-text-secondary dark:text-slate-400 p-4 text-center">Todos os itens deste pedido já foram alocados em Ordens de Serviço.</p>}
                </div>
            </div>
            <div className="mb-6">
                <label htmlFor="delivery-date" className="block text-sm font-medium text-text-secondary dark:text-slate-400 mb-1">Data de Entrega para esta OS</label>
                <input
                    id="delivery-date"
                    type="date"
                    value={deliveryDate}
                    onChange={e => setDeliveryDate(e.target.value)}
                    className={`p-2 border rounded w-full text-text-primary dark:bg-slate-700 dark:text-slate-200 ${error && !deliveryDate ? 'border-error' : 'border-border dark:border-slate-700'}`}
                />
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
    orders: Order[];
    serviceOrders: ServiceOrder[];
    setOrders: (update: (prev: Order[]) => Order[]) => void;
    setServiceOrders: (update: (prev: ServiceOrder[]) => ServiceOrder[]) => void;
    searchTarget: { page: Page; id: string } | null;
    clearSearchTarget: () => void;
}

const OrdersPage: FC<OrdersPageProps> = ({ orders, serviceOrders, setOrders, setServiceOrders, searchTarget, clearSearchTarget }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

    const salespeopleMap = useMemo(() => {
        return mockUsers.reduce((acc, user) => {
            acc[user.id] = user.name;
            return acc;
        }, {} as Record<string, string>);
    }, []);

    const handleOpenModal = (order: Order) => {
        setSelectedOrder(order);
        setIsModalOpen(true);
    };
    
    useEffect(() => {
        if (searchTarget && searchTarget.page === 'orders') {
            const order = orders.find(o => o.id === searchTarget.id);
            if (order) {
                handleOpenModal(order);
            }
            clearSearchTarget();
        }
    }, [searchTarget, orders, clearSearchTarget]);

    const handleCloseModal = () => {
        setSelectedOrder(null);
        setIsModalOpen(false);
    };

    const handleCreateOs = (newOsData: Omit<ServiceOrder, 'id'>) => {
        const newOsId = `OS-2024-${(serviceOrders.length + 1).toString().padStart(3, '0')}`;
        const newOs: ServiceOrder = { ...newOsData, id: newOsId };
        
        setServiceOrders(prev => [...prev, newOs]);
        setOrders(prev => prev.map(o => 
            o.id === newOs.orderId 
                ? { ...o, serviceOrderIds: [...o.serviceOrderIds, newOs.id] } 
                : o
        ));
        handleCloseModal();
    };

    return (
        <div>
             {isModalOpen && selectedOrder && (
                <CreateServiceOrderModal
                    isOpen={isModalOpen}
                    order={selectedOrder}
                    serviceOrders={serviceOrders}
                    onClose={handleCloseModal}
                    onCreate={handleCreateOs}
                />
            )}
            <h1 className="text-3xl font-bold text-text-primary dark:text-slate-100">Pedidos Aprovados</h1>
            <p className="mt-2 text-text-secondary dark:text-slate-400">Gerencie os pedidos e gere as Ordens de Serviço (OS) para a produção.</p>

            <Card className="mt-8 p-0">
                 <CardContent>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="border-b border-border dark:border-slate-700">
                                    <th className="p-3">ID do Pedido</th>
                                    <th className="p-3">Cliente</th>
                                    <th className="p-3">Data de Aprovação</th>
                                    <th className="p-3">Vendedor</th>
                                    <th className="p-3 text-right">Total</th>
                                    <th className="p-3">OS Geradas</th>
                                    <th className="p-3 text-center">Ações</th>
                                </tr>
                            </thead>
                            <tbody>
                                {orders.map(order => (
                                    <tr key={order.id} className="border-b border-border dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50">
                                        <td className="p-3 font-mono text-sm">{order.id}</td>
                                        <td className="p-3">{order.clientName}</td>
                                        <td className="p-3">{new Date(order.approvalDate).toLocaleDateString()}</td>
                                        <td className="p-3">{order.salespersonId ? salespeopleMap[order.salespersonId] : 'N/A'}</td>
                                        <td className="p-3 text-right font-semibold">{order.total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                                        <td className="p-3 text-xs font-mono">{order.serviceOrderIds.join(', ')}</td>
                                        <td className="p-3 text-center">
                                            <Button size="sm" variant="secondary" onClick={() => handleOpenModal(order)}>
                                                Gerar OS
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                                {orders.length === 0 && (
                                    <tr>
                                        <td colSpan={7} className="text-center p-4 text-text-secondary dark:text-slate-400">Nenhum pedido encontrado.</td>
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