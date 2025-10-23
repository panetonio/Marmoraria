import React, { useState, useCallback } from 'react';
import type { ServiceOrder, ProductionStatus, Vehicle, ProductionEmployee } from '../types';
import Card, { CardHeader, CardContent } from './ui/Card';
import Button from './ui/Button';
import StatusBadge from './ui/StatusBadge';
import Badge from './ui/Badge';

interface ProductionKanbanProps {
  orders: ServiceOrder[];
  onStatusChange: (orderId: string, newStatus: ProductionStatus) => void;
  vehicles: Vehicle[];
  productionEmployees: ProductionEmployee[];
}

const PRODUCTION_COLUMNS: { id: ProductionStatus; title: string; color: string; description: string }[] = [
  { 
    id: 'pending_production', 
    title: 'Aguardando Produção', 
    color: 'bg-slate-500',
    description: 'OSs aguardando início da produção'
  },
  { 
    id: 'cutting', 
    title: 'Em Corte', 
    color: 'bg-orange-500',
    description: 'OSs em processo de corte'
  },
  { 
    id: 'finishing', 
    title: 'Em Acabamento', 
    color: 'bg-blue-500',
    description: 'OSs em processo de acabamento'
  },
  { 
    id: 'quality_check', 
    title: 'Controle de Qualidade', 
    color: 'bg-purple-500',
    description: 'OSs em controle de qualidade'
  },
  { 
    id: 'awaiting_logistics', 
    title: 'Pronto para Logística', 
    color: 'bg-green-500',
    description: 'OSs prontas para logística'
  }
];

const ProductionKanban: React.FC<ProductionKanbanProps> = ({
  orders,
  onStatusChange,
  vehicles,
  productionEmployees
}) => {
  const [draggedOrderId, setDraggedOrderId] = useState<string | null>(null);

  const handleDragStart = useCallback((e: React.DragEvent, orderId: string) => {
    setDraggedOrderId(orderId);
    e.dataTransfer.effectAllowed = 'move';
  }, []);

  const handleDragEnd = useCallback(() => {
    setDraggedOrderId(null);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent, newStatus: ProductionStatus) => {
    e.preventDefault();
    const orderId = e.dataTransfer.getData('orderId');
    if (orderId && orderId !== draggedOrderId) {
      onStatusChange(orderId, newStatus);
    }
    setDraggedOrderId(null);
  }, [draggedOrderId, onStatusChange]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }, []);

  const getOrdersForColumn = (status: ProductionStatus) => {
    return orders.filter(order => order.productionStatus === status);
  };

  const getEmployeeName = (employeeId: string) => {
    const employee = productionEmployees.find(emp => emp.id === employeeId);
    return employee?.name || 'Não atribuído';
  };

  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case 'urgente': return 'bg-red-500';
      case 'alta': return 'bg-orange-500';
      default: return 'bg-slate-500';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-text-primary dark:text-slate-100">
            🏭 Produção
          </h2>
          <p className="text-text-secondary dark:text-slate-400">
            Controle do fluxo de produção das Ordens de Serviço
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="info">
            Total: {orders.length} OSs
          </Badge>
          <Button variant="secondary" size="sm">
            📊 Relatório de Produção
          </Button>
        </div>
      </div>

      {/* Kanban Board */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {PRODUCTION_COLUMNS.map(column => {
          const columnOrders = getOrdersForColumn(column.id);
          
          return (
            <div
              key={column.id}
              className="bg-slate-100 dark:bg-slate-800/50 rounded-lg p-4 flex flex-col min-h-[600px]"
              onDrop={(e) => handleDrop(e, column.id)}
              onDragOver={handleDragOver}
            >
              {/* Column Header */}
              <div className={`flex items-center mb-4 border-l-4 pl-2 ${column.color.replace('bg-', 'border-')}`}>
                <div className={`w-3 h-3 rounded-full mr-2 ${column.color}`}></div>
                <div>
                  <h3 className="font-semibold text-text-primary dark:text-slate-100">
                    {column.title}
                  </h3>
                  <p className="text-xs text-text-secondary dark:text-slate-400">
                    {column.description}
                  </p>
                </div>
              </div>

              {/* Orders Count */}
              <div className="mb-4">
                <Badge variant="secondary" className="text-sm">
                  {columnOrders.length} OSs
                </Badge>
              </div>

              {/* Orders */}
              <div className="flex-1 space-y-3 overflow-y-auto pr-1">
                {columnOrders.map(order => (
                  <Card
                    key={order.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, order.id)}
                    onDragEnd={handleDragEnd}
                    className={`p-3 cursor-move hover:shadow-lg transition-all duration-200 ${
                      draggedOrderId === order.id ? 'opacity-50 scale-95' : ''
                    }`}
                  >
                    <CardContent>
                      {/* Order Header */}
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-sm font-semibold text-primary">
                            {order.id}
                          </span>
                          {order.priority && order.priority !== 'normal' && (
                            <div className={`w-2 h-2 rounded-full ${getPriorityColor(order.priority)}}`}></div>
                          )}
                        </div>
                        <StatusBadge 
                          status={order.productionStatus} 
                          statusMap={{
                            pending_production: { label: 'Aguardando', variant: 'secondary' },
                            cutting: { label: 'Corte', variant: 'warning' },
                            finishing: { label: 'Acabamento', variant: 'info' },
                            quality_check: { label: 'Qualidade', variant: 'purple' },
                            awaiting_logistics: { label: 'Pronto', variant: 'success' }
                          }}
                        />
                      </div>

                      {/* Client Info */}
                      <div className="mb-2">
                        <p className="font-medium text-text-primary dark:text-slate-100 text-sm">
                          {order.clientName}
                        </p>
                        <p className="text-xs text-text-secondary dark:text-slate-400">
                          {new Date(order.deliveryDate).toLocaleDateString('pt-BR')}
                        </p>
                      </div>

                      {/* Items Summary */}
                      <div className="mb-2">
                        <p className="text-xs text-text-secondary dark:text-slate-400">
                          {order.items.length} item(s) • R$ {order.total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                        </p>
                      </div>

                      {/* Assigned Team */}
                      {order.assignedToIds.length > 0 && (
                        <div className="mb-2">
                          <p className="text-xs text-text-secondary dark:text-slate-400 mb-1">
                            Equipe:
                          </p>
                          <div className="flex flex-wrap gap-1">
                            {order.assignedToIds.slice(0, 2).map(employeeId => (
                              <Badge key={employeeId} variant="secondary" className="text-xs">
                                {getEmployeeName(employeeId)}
                              </Badge>
                            ))}
                            {order.assignedToIds.length > 2 && (
                              <Badge variant="secondary" className="text-xs">
                                +{order.assignedToIds.length - 2}
                              </Badge>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Allocated Slab */}
                      {order.allocatedSlabId && (
                        <div className="mb-2">
                          <Badge variant="info" className="text-xs">
                            Chapa: {order.allocatedSlabId}
                          </Badge>
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex items-center gap-2 mt-3 pt-2 border-t border-border dark:border-slate-700">
                        <Button variant="ghost" size="sm" className="text-xs">
                          👁️ Ver
                        </Button>
                        {order.productionStatus === 'cutting' && !order.allocatedSlabId && (
                          <Button variant="secondary" size="sm" className="text-xs">
                            📋 Alocar Chapa
                          </Button>
                        )}
                        {order.productionStatus === 'finishing' && (
                          <Button variant="accent" size="sm" className="text-xs">
                            ✅ Finalizar
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}

                {/* Empty State */}
                {columnOrders.length === 0 && (
                  <div className="text-center py-8 text-text-secondary dark:text-slate-500">
                    <div className="text-4xl mb-2">📦</div>
                    <p className="text-sm">Nenhuma OS nesta etapa</p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {PRODUCTION_COLUMNS.map(column => {
          const count = getOrdersForColumn(column.id).length;
          return (
            <Card key={column.id} className="p-4 text-center">
              <div className={`w-4 h-4 rounded-full mx-auto mb-2 ${column.color}`}></div>
              <p className="text-2xl font-bold text-text-primary dark:text-slate-100">
                {count}
              </p>
              <p className="text-xs text-text-secondary dark:text-slate-400">
                {column.title}
              </p>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default ProductionKanban;
