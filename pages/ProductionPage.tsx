import React, { useState, useMemo, FC, DragEvent } from 'react';
import { mockUsers } from '../data/mockData';
import type { ServiceOrder, ProductionStatus, User } from '../types';
import Card, { CardContent } from '../components/ui/Card';
import Modal from '../components/ui/Modal';
import Button from '../components/ui/Button';

const KANBAN_COLUMNS: { id: ProductionStatus; title: string; color: string }[] = [
  { id: 'cutting', title: 'Em Corte', color: 'bg-orange-800' },
  { id: 'finishing', title: 'Em Acabamento', color: 'bg-blue-700' },
  { id: 'ready_for_delivery', title: 'Pronto para Entrega', color: 'bg-purple-700' },
  { id: 'delivered', title: 'Entregue', color: 'bg-green-800' },
];

const ResourceAllocationModal: FC<{
  isOpen: boolean;
  order: ServiceOrder;
  productionTeam: User[];
  onClose: () => void;
  onSave: (orderId: string, assignedToIds: string[]) => void;
}> = ({ isOpen, order, productionTeam, onClose, onSave }) => {
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>(order.assignedToIds);

  const handleCheckboxChange = (userId: string) => {
    setSelectedUserIds(prev =>
      prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
    );
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Alocar Recursos para: ${order.id}`} className="max-w-md">
        <div className="space-y-2">
          {productionTeam.map(user => (
            <label key={user.id} className="flex items-center p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
                checked={selectedUserIds.includes(user.id)}
                onChange={() => handleCheckboxChange(user.id)}
              />
              <span className="ml-3 text-text-primary dark:text-slate-100">{user.name}</span>
            </label>
          ))}
        </div>
        <div className="flex justify-end mt-6 space-x-3">
            <Button variant="ghost" onClick={onClose}>Cancelar</Button>
            <Button onClick={() => onSave(order.id, selectedUserIds)}>Salvar</Button>
        </div>
    </Modal>
  );
};

const KanbanCard: FC<{
  order: ServiceOrder;
  // FIX: Change DragEvent type from HTMLDivElement to HTMLElement to match what the Card component provides.
  onDragStart: (e: DragEvent<HTMLElement>, orderId: string) => void;
  onAssign: (order: ServiceOrder) => void;
}> = ({ order, onDragStart, onAssign }) => {
  const assignedUsers = mockUsers.filter(u => order.assignedToIds.includes(u.id));
  return (
    <Card
      draggable
      onDragStart={(e) => onDragStart(e, order.id)}
      className="p-4 mt-4 shadow-sm border border-border dark:border-slate-700 cursor-grab active:cursor-grabbing"
    >
      <div className="flex justify-between items-center">
        <p className="font-bold text-sm font-mono">{order.id}</p>
        <p className="text-xs text-text-secondary dark:text-slate-400 font-mono">Pedido: {order.orderId}</p>
      </div>
      <p className="text-text-secondary dark:text-slate-400 text-sm mt-1">{order.clientName}</p>
      <div className="mt-3 pt-3 border-t border-border dark:border-slate-700">
        <div className="flex justify-between items-center">
          <div className="flex -space-x-2">
            {assignedUsers.length > 0 ? (
              assignedUsers.map(user => (
                <div key={user.id} title={user.name} className="w-6 h-6 rounded-full bg-slate-600 text-white flex items-center justify-center text-xs font-bold ring-2 ring-white">
                  {user.name.charAt(0)}
                </div>
              ))
            ) : (
              <span className="text-xs text-slate-400 dark:text-slate-500">Não alocado</span>
            )}
          </div>
          <Button variant="ghost" size="sm" onClick={() => onAssign(order)}>Alocar</Button>
        </div>
      </div>
    </Card>
  );
};

const ProductionPage: FC<{
    serviceOrders: ServiceOrder[];
    setServiceOrders: (update: ServiceOrder[] | ((prev: ServiceOrder[]) => ServiceOrder[])) => void;
}> = ({ serviceOrders, setServiceOrders }) => {
  const [viewMode, setViewMode] = useState<'kanban' | 'timeline'>('kanban');
  const [modalOrder, setModalOrder] = useState<ServiceOrder | null>(null);

  const productionTeam = useMemo(() => mockUsers.filter(u => u.role === 'producao'), []);
  
  const handleDragStart = (e: DragEvent<HTMLElement>, orderId: string) => {
    e.dataTransfer.setData("orderId", orderId);
  };
  
  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };
  
  const handleDrop = (e: DragEvent<HTMLDivElement>, newStatus: ProductionStatus) => {
    const orderId = e.dataTransfer.getData("orderId");
    setServiceOrders(prevOrders =>
      prevOrders.map(order =>
        order.id === orderId ? { ...order, status: newStatus } : order
      )
    );
  };

  const handleAssignSave = (orderId: string, assignedToIds: string[]) => {
      setServiceOrders(prev => prev.map(o => o.id === orderId ? {...o, assignedToIds} : o));
      setModalOrder(null);
  }

  const sortedTimelineOrders = useMemo(() => {
    return [...serviceOrders].sort((a, b) => new Date(a.deliveryDate).getTime() - new Date(b.deliveryDate).getTime());
  }, [serviceOrders]);


  return (
    <div>
      {modalOrder && (
        <ResourceAllocationModal 
            isOpen={!!modalOrder}
            order={modalOrder}
            productionTeam={productionTeam}
            onClose={() => setModalOrder(null)}
            onSave={handleAssignSave}
        />
      )}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-text-primary dark:text-slate-100">Painel de Produção</h1>
          <p className="mt-2 text-text-secondary dark:text-slate-400">Acompanhe e gerencie as Ordens de Serviço (OS).</p>
        </div>
        <div className="flex bg-slate-200 dark:bg-slate-800 p-1 rounded-lg">
            <button onClick={() => setViewMode('kanban')} className={`px-4 py-1 text-sm font-semibold rounded-md ${viewMode === 'kanban' ? 'bg-surface dark:bg-dark shadow' : 'text-text-secondary dark:text-slate-400'}`}>Kanban</button>
            <button onClick={() => setViewMode('timeline')} className={`px-4 py-1 text-sm font-semibold rounded-md ${viewMode === 'timeline' ? 'bg-surface dark:bg-dark shadow' : 'text-text-secondary dark:text-slate-400'}`}>Timeline</button>
        </div>
      </div>
      
      {viewMode === 'kanban' ? (
        <div className="grid grid-cols-4 gap-5 mt-6 h-[75vh]">
          {KANBAN_COLUMNS.map(column => (
            <div 
                key={column.id} 
                className="bg-slate-100 dark:bg-slate-800/50 rounded-lg p-3 flex flex-col"
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, column.id)}
            >
              <div className={`flex items-center mb-4 border-l-4 pl-2 ${column.color.replace('bg-', 'border-')}`}>
                <div className={`w-3 h-3 rounded-full mr-2 ${column.color}`}></div>
                <h3 className="font-semibold text-text-primary dark:text-slate-100">{column.title}</h3>
              </div>
              <div className="flex-1 overflow-y-auto pr-1">
                {serviceOrders
                  .filter(order => order.status === column.id)
                  .map(order => (
                    <KanbanCard key={order.id} order={order} onDragStart={handleDragStart} onAssign={setModalOrder} />
                  ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
         <Card className="mt-8 p-0">
          <CardContent>
            <h2 className="text-xl font-semibold text-text-primary dark:text-slate-100 mb-4">Timeline de Entregas</h2>
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead>
                        <tr className="border-b border-border dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
                            <th className="p-3">Data de Entrega</th>
                            <th className="p-3">OS ID</th>
                            <th className="p-3">Cliente</th>
                            <th className="p-3">Status</th>
                            <th className="p-3 text-right">Valor</th>
                        </tr>
                    </thead>
                    <tbody>
                        {sortedTimelineOrders.map(order => (
                            <tr key={order.id} className="border-b border-border dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50">
                                <td className="p-3 font-semibold">{new Date(order.deliveryDate).toLocaleDateString()}</td>
                                <td className="p-3 font-mono text-sm">{order.id}</td>
                                <td className="p-3">{order.clientName}</td>
                                <td className="p-3">
                                    <span className={`px-2 py-1 text-xs font-semibold rounded-full text-white ${KANBAN_COLUMNS.find(c => c.id === order.status)?.color}`}>
                                        {KANBAN_COLUMNS.find(c => c.id === order.status)?.title}
                                    </span>
                                </td>
                                <td className="p-3 text-right">{order.total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
          </CardContent>
         </Card>
      )}
    </div>
  );
};

export default ProductionPage;