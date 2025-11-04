import React, { useState, useMemo, FC, DragEvent } from 'react';
import type { ServiceOrder, ProductionStatus, User } from '../types';
import { mockProductionProfessionals } from '../data/mockData';
import Select from '../components/ui/Select';
import KanbanColumn from './KanbanColumn';
import OrderCard from './OrderCard';

const KANBAN_COLUMNS: { id: ProductionStatus; title: string; color: string }[] = [
  { id: 'cutting', title: 'Em Corte', color: 'bg-orange-800' },
  { id: 'finishing', title: 'Em Acabamento', color: 'bg-blue-700' },
  { id: 'awaiting_pickup', title: 'Aguardando Retirada', color: 'bg-yellow-600' },
];


// ============= MAIN COMPONENT =============
interface ProductionKanbanProps {
  serviceOrders: ServiceOrder[];
  users: User[];
  vehicles: any[]; // Vehicle type
  onUpdateServiceOrders: (orders: ServiceOrder[]) => void;
  onAssign: (order: ServiceOrder) => void;
  onAllocate: (order: ServiceOrder) => void;
  onView: (order: ServiceOrder) => void;
  onFinalize: (order: ServiceOrder) => void;
}

const ProductionKanban: FC<ProductionKanbanProps> = ({
  serviceOrders,
  users,
  vehicles,
  onUpdateServiceOrders,
  onAssign,
  onAllocate,
  onView,
  onFinalize
}) => {
  const [professionalFilter, setProfessionalFilter] = useState<string>('');
  const [orderIdFilter, setOrderIdFilter] = useState<string>('');
  const [draggedItemId, setDraggedItemId] = useState<string | null>(null);

  // Usar usuários reais do backend
  const productionTeam = useMemo(() => {
    // Pegar usuários de produção ou todos se não tiver
    return users.length > 0 ? users : mockProductionProfessionals;
  }, [users]);

  const filteredServiceOrders = useMemo(() => {
    return serviceOrders.filter(order => {
      const professionalMatch = professionalFilter ? order.assignedToIds.includes(professionalFilter) : true;
      const orderIdMatch = orderIdFilter ? order.orderId.toLowerCase().includes(orderIdFilter.toLowerCase()) : true;
      const productionStatuses: ProductionStatus[] = ['cutting', 'finishing', 'awaiting_pickup'];
      return professionalMatch && orderIdMatch && productionStatuses.includes(order.productionStatus);
    });
  }, [serviceOrders, professionalFilter, orderIdFilter]);
  
  const handleDragStart = (e: DragEvent<HTMLElement>, orderId: string) => {
    e.dataTransfer.setData("orderId", orderId);
    setDraggedItemId(orderId);
  };

  const handleDragEnd = () => {
    setDraggedItemId(null);
  };
  
  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };
  
  const handleDrop = (e: DragEvent<HTMLDivElement>, newStatus: ProductionStatus) => {
    e.preventDefault();
    const orderId = e.dataTransfer.getData("orderId");
    const order = serviceOrders.find(o => o.id === orderId);
    if (order && order.productionStatus !== newStatus) {
        if(newStatus === 'awaiting_pickup') return; // Cannot drag here
        const updatedOrders = serviceOrders.map(o =>
            o.id === orderId ? { ...o, productionStatus: newStatus } : o
        );
        onUpdateServiceOrders(updatedOrders);
    }
  };

  return (
        <div>
      {/* Filtros */}
      <div className="flex items-center space-x-4 mb-6">
        <div className="flex-shrink-0">
          <label htmlFor="order-id-filter" className="sr-only">Filtrar por ID do Pedido</label>
          <input
              id="order-id-filter"
              type="text"
              placeholder="Filtrar por Pedido (PED-...)"
              value={orderIdFilter}
              onChange={(e) => setOrderIdFilter(e.target.value)}
              className="block w-full pl-3 pr-10 py-2 text-base border-border bg-slate-50 dark:border-slate-600 dark:bg-slate-700 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm rounded-md h-[42px]"
              aria-label="Filtrar por ID do Pedido"
          />
        </div>
       <div className="flex-shrink-0">
          <Select
              id="professional-filter"
              value={professionalFilter}
              onChange={(e) => setProfessionalFilter(e.target.value)}
              aria-label="Filtrar por profissional"
          >
              <option value="">Todos os Profissionais</option>
              {productionTeam.map(member => (
                  <option key={member.id} value={member.id}>{member.name}</option>
              ))}
          </Select>
        </div>
      </div>

      {/* Kanban */}
      <div className="grid grid-cols-3 gap-5 h-[75vh]">
        {KANBAN_COLUMNS.map(column => {
          const columnOrders = filteredServiceOrders.filter(order => order.productionStatus === column.id);
          return (
            <KanbanColumn
              key={column.id}
              title={column.title}
              color={column.color}
              count={columnOrders.length}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, column.id)}
            >
              {columnOrders.map(order => {
                const assignedProfessionals = productionTeam.filter(p => order.assignedToIds.includes(p.id));
                return (
                  <OrderCard
                    key={order.id}
                    order={order}
                    view="production"
                    vehicles={vehicles}
                    isDragging={draggedItemId === order.id}
                    onDragStart={handleDragStart}
                    onDragEnd={handleDragEnd}
                    onClick={onView}
                    onFinalizeProduction={onFinalize}
                    onAssign={onAssign}
                    onAllocate={onAllocate}
                    assignedProfessionals={assignedProfessionals.map(p => ({ id: p.id, name: p.name, role: (p as any).role }))}
                  />
                );
              })}
            </KanbanColumn>
          );
        })}
      </div>
    </div>
  );
};

export default ProductionKanban;
