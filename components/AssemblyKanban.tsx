import React, { useState, useMemo, FC, DragEvent } from 'react';
import type { ServiceOrder, ProductionStatus, ProductionEmployee } from '../types';
import Card from '../components/ui/Card';
import KanbanColumn from './KanbanColumn';
import OrderCard from './OrderCard';

const KANBAN_COLUMNS: { id: ProductionStatus; title: string; color: string }[] = [
  { id: 'cutting', title: 'Corte', color: 'bg-blue-600' },
  { id: 'finishing', title: 'Acabamento', color: 'bg-purple-600' },
  { id: 'awaiting_pickup', title: 'Aguardando Montagem', color: 'bg-yellow-600' },
  { id: 'ready_for_logistics', title: 'Pronto para Entrega', color: 'bg-green-600' },
];

// ============= MAIN COMPONENT =============
interface AssemblyKanbanProps {
  serviceOrders: ServiceOrder[];
  productionEmployees: ProductionEmployee[];
  onView?: (order: ServiceOrder) => void;
  onUpdateStatus: (orderId: string, newStatus: ProductionStatus) => void;
  onAddNote: (orderId: string, note: string) => void;
  onAssignEmployee: (orderId: string, employeeId: string) => void;
}

const AssemblyKanban: FC<AssemblyKanbanProps> = ({
  serviceOrders,
  productionEmployees,
  onView,
  onUpdateStatus,
  onAddNote,
  onAssignEmployee
}) => {
  const [draggedOrderId, setDraggedOrderId] = useState<string | null>(null);

  const assemblyOrders = useMemo(() => {
    const assemblyStatuses: ProductionStatus[] = ['cutting', 'finishing', 'awaiting_pickup', 'ready_for_logistics'];
    return serviceOrders.filter(o => assemblyStatuses.includes(o.status));
  }, [serviceOrders]);

  const handleDragStart = (e: DragEvent<HTMLElement>, orderId: string) => {
    e.dataTransfer.setData('text/plain', orderId);
    setDraggedOrderId(orderId);
  };

  const handleDragEnd = () => {
    setDraggedOrderId(null);
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>, targetStatus: ProductionStatus) => {
    e.preventDefault();
    const orderId = e.dataTransfer.getData('text/plain');
    if (orderId && orderId !== draggedOrderId) {
      onUpdateStatus(orderId, targetStatus);
      setDraggedOrderId(null);
    }
  };

  // Handlers para OrderCard (assembly não tem schedule/start/complete explícitos, mas pode usar onUpdateStatus)
  const handleSchedule = (order: ServiceOrder) => {
    // Para assembly, pode atualizar status para o próximo estágio
    onUpdateStatus(order.id, 'awaiting_pickup');
  };

  const handleStart = (order: ServiceOrder) => {
    // Para assembly, pode atualizar status para 'finishing'
    onUpdateStatus(order.id, 'finishing');
  };

  const handleComplete = (order: ServiceOrder) => {
    // Para assembly, pode atualizar status para 'ready_for_logistics'
    onUpdateStatus(order.id, 'ready_for_logistics');
  };

  const handleClick = (order: ServiceOrder) => {
    // Se onView for fornecido, usar ele, caso contrário apenas logar
    if (onView) {
      onView(order);
    } else {
      console.log('Clicked order:', order.id);
    }
  };

  const getOrdersByStatus = (status: ProductionStatus) => {
    return assemblyOrders.filter(order => order.status === status);
  };

  const getColumnStats = (status: ProductionStatus) => {
    const orders = getOrdersByStatus(status);
    const totalValue = orders.reduce((sum, order) => sum + order.total, 0);
    return {
      count: orders.length,
      totalValue
    };
  };

  return (
    <div>
      {/* Estatísticas Gerais */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        {KANBAN_COLUMNS.map(column => {
          const stats = getColumnStats(column.id);
          return (
            <Card key={column.id} className="p-4 text-center">
              <div className={`w-3 h-3 rounded-full mx-auto mb-2 ${column.color}`}></div>
              <div className="text-2xl font-bold text-text-primary dark:text-slate-100">{stats.count}</div>
              <div className="text-sm text-text-secondary dark:text-slate-400">{column.title}</div>
              <div className="text-xs text-text-secondary dark:text-slate-400 mt-1">
                R$ {stats.totalValue.toFixed(2)}
              </div>
            </Card>
          );
        })}
      </div>

      {/* Kanban Board */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {KANBAN_COLUMNS.map(column => {
          const orders = getOrdersByStatus(column.id);
          return (
            <KanbanColumn
              key={column.id}
              title={column.title}
              color={column.color}
              count={orders.length}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, column.id)}
            >
              {orders.map(order => {
                const assignedProfessionals = productionEmployees.filter(emp => order.assignedToIds.includes(emp.id));
                return (
                  <OrderCard
                    key={order.id}
                    order={order}
                    view="assembly"
                    isDragging={draggedOrderId === order.id}
                    onDragStart={handleDragStart}
                    onDragEnd={handleDragEnd}
                    onClick={handleClick}
                    onSchedule={handleSchedule}
                    onAddNote={onAddNote}
                    onAssignEmployee={onAssignEmployee}
                    assignedProfessionals={assignedProfessionals.map(p => ({ id: p.id, name: p.name, role: p.role }))}
                  />
                );
              })}
              
              {orders.length === 0 && (
                <div className="text-center text-text-secondary dark:text-slate-400 py-8">
                  <div className="text-4xl mb-2">📦</div>
                  <div className="text-sm">Nenhum pedido nesta etapa</div>
                </div>
              )}
            </KanbanColumn>
          );
        })}
      </div>
    </div>
  );
};

export default AssemblyKanban;
