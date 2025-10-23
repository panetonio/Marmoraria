import React, { useState, useCallback } from 'react';
import type { ServiceOrder, LogisticsStatus, Vehicle, ProductionEmployee, DeliveryRoute, ChecklistTemplate } from '../types';
import Card, { CardHeader, CardContent } from './ui/Card';
import Button from './ui/Button';
import StatusBadge from './ui/StatusBadge';
import Badge from './ui/Badge';
import PostDeliverySchedulingModal from './PostDeliverySchedulingModal';

interface LogisticsKanbanProps {
  orders: ServiceOrder[];
  routes: DeliveryRoute[];
  onStatusChange: (orderId: string, newStatus: LogisticsStatus) => void;
  onDeliveryConfirmed: (orderId: string, deliveryData: {
    checklistCompleted: boolean;
    photos: Array<{ url: string; description?: string }>;
    customerSignature: { url: string; timestamp: string };
  }) => void;
  onInstallationScheduled: (orderId: string, installationData: {
    scheduledStart: string;
    scheduledEnd: string;
    teamIds: string[];
    vehicleId?: string;
    notes?: string;
  }) => void;
  vehicles: Vehicle[];
  productionEmployees: ProductionEmployee[];
  checklistTemplates?: ChecklistTemplate[];
}

const LOGISTICS_COLUMNS: { id: LogisticsStatus; title: string; color: string; description: string }[] = [
  { 
    id: 'awaiting_scheduling', 
    title: 'Aguardando Agendamento', 
    color: 'bg-slate-500',
    description: 'OSs prontas para agendamento'
  },
  { 
    id: 'scheduled', 
    title: 'Agendado', 
    color: 'bg-blue-500',
    description: 'OSs com entrega agendada'
  },
  { 
    id: 'in_transit', 
    title: 'Em Trânsito', 
    color: 'bg-orange-500',
    description: 'OSs em rota de entrega'
  },
  { 
    id: 'delivered', 
    title: 'Entregue', 
    color: 'bg-green-500',
    description: 'OSs entregues ao cliente'
  }
];

const LogisticsKanban: React.FC<LogisticsKanbanProps> = ({
  orders,
  routes,
  onStatusChange,
  onDeliveryConfirmed,
  onInstallationScheduled,
  vehicles,
  productionEmployees,
  checklistTemplates = []
}) => {
  const [draggedOrderId, setDraggedOrderId] = useState<string | null>(null);
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);
  const [confirmingDeliveryOrder, setConfirmingDeliveryOrder] = useState<ServiceOrder | null>(null);

  const handleDragStart = useCallback((e: React.DragEvent, orderId: string) => {
    setDraggedOrderId(orderId);
    e.dataTransfer.effectAllowed = 'move';
  }, []);

  const handleDragEnd = useCallback(() => {
    setDraggedOrderId(null);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent, newStatus: LogisticsStatus) => {
    e.preventDefault();
    const orderId = e.dataTransfer.getData('orderId');
    if (orderId && orderId !== draggedOrderId) {
      // Se está sendo movido para "delivered", abrir modal de confirmação
      if (newStatus === 'delivered') {
        const order = orders.find(o => o.id === orderId);
        if (order) {
          setConfirmingDeliveryOrder(order);
          return; // Não alterar status ainda, aguardar confirmação do modal
        }
      }
      onStatusChange(orderId, newStatus);
    }
    setDraggedOrderId(null);
  }, [draggedOrderId, onStatusChange, orders]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }, []);

  const getOrdersForColumn = (status: LogisticsStatus) => {
    return orders.filter(order => order.logisticsStatus === status);
  };

  const getVehicleName = (vehicleId: string) => {
    const vehicle = vehicles.find(v => v.id === vehicleId);
    return vehicle ? `${vehicle.name} (${vehicle.licensePlate})` : 'Veículo não encontrado';
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

  const getRouteForOrder = (orderId: string) => {
    return routes.find(route => route.serviceOrderId === orderId);
  };

  const handleSelectOrder = (orderId: string) => {
    setSelectedOrders(prev => 
      prev.includes(orderId) 
        ? prev.filter(id => id !== orderId)
        : [...prev, orderId]
    );
  };

  const handleCreateRoute = () => {
    if (selectedOrders.length > 0) {
      console.log('Criando rota para OSs:', selectedOrders);
      // Implementar lógica de criação de rota
    }
  };

  const handleDeliveryConfirmed = async (orderId: string, deliveryData: {
    checklistCompleted: boolean;
    photos: Array<{ url: string; description?: string }>;
    customerSignature: { url: string; timestamp: string };
  }) => {
    try {
      await onDeliveryConfirmed(orderId, deliveryData);
      // Atualizar status para delivered após confirmação
      onStatusChange(orderId, 'delivered');
      setConfirmingDeliveryOrder(null);
    } catch (error) {
      console.error('Erro ao confirmar entrega:', error);
    }
  };

  const handleInstallationScheduled = async (orderId: string, installationData: {
    scheduledStart: string;
    scheduledEnd: string;
    teamIds: string[];
    vehicleId?: string;
    notes?: string;
  }) => {
    try {
      await onInstallationScheduled(orderId, installationData);
      setConfirmingDeliveryOrder(null);
    } catch (error) {
      console.error('Erro ao agendar instalação:', error);
    }
  };

  const getChecklistTemplate = (order: ServiceOrder) => {
    // Buscar template de checklist para entrega
    return checklistTemplates.find(template => 
      template.type === 'entrega' && template.isActive
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-text-primary dark:text-slate-100">
            🚚 Logística
          </h2>
          <p className="text-text-secondary dark:text-slate-400">
            Controle de entregas e rotas de distribuição
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="info">
            Total: {orders.length} OSs
          </Badge>
          {selectedOrders.length > 0 && (
            <Button variant="accent" size="sm" onClick={handleCreateRoute}>
              🚛 Criar Rota ({selectedOrders.length})
            </Button>
          )}
          <Button variant="secondary" size="sm">
            📊 Relatório de Logística
          </Button>
        </div>
      </div>

      {/* Routes Summary */}
      {routes.length > 0 && (
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold text-text-primary dark:text-slate-100">
              🛣️ Rotas Ativas
            </h3>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {routes.slice(0, 3).map(route => (
                <div key={route.id} className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono text-sm font-semibold text-primary">
                      {route.id}
                    </span>
                    <StatusBadge 
                      status={route.status} 
                      statusMap={{
                        pending: { label: 'Pendente', variant: 'secondary' },
                        scheduled: { label: 'Agendado', variant: 'info' },
                        in_progress: { label: 'Em Rota', variant: 'warning' },
                        completed: { label: 'Concluído', variant: 'success' },
                        cancelled: { label: 'Cancelado', variant: 'error' }
                      }}
                    />
                  </div>
                  <p className="text-sm text-text-secondary dark:text-slate-400">
                    {getVehicleName(route.vehicleId)}
                  </p>
                  <p className="text-xs text-text-secondary dark:text-slate-400">
                    {new Date(route.scheduledStart).toLocaleDateString('pt-BR')} - 
                    {new Date(route.scheduledEnd).toLocaleDateString('pt-BR')}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Kanban Board */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {LOGISTICS_COLUMNS.map(column => {
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
                {columnOrders.map(order => {
                  const route = getRouteForOrder(order.id);
                  
                  return (
                    <Card
                      key={order.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, order.id)}
                      onDragEnd={handleDragEnd}
                      className={`p-3 cursor-move hover:shadow-lg transition-all duration-200 ${
                        draggedOrderId === order.id ? 'opacity-50 scale-95' : ''
                      } ${selectedOrders.includes(order.id) ? 'ring-2 ring-primary' : ''}`}
                    >
                      <CardContent>
                        {/* Order Header */}
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={selectedOrders.includes(order.id)}
                              onChange={() => handleSelectOrder(order.id)}
                              className="h-4 w-4 rounded text-primary"
                            />
                            <span className="font-mono text-sm font-semibold text-primary">
                              {order.id}
                            </span>
                            {order.priority && order.priority !== 'normal' && (
                              <div className={`w-2 h-2 rounded-full ${getPriorityColor(order.priority)}}`}></div>
                            )}
                          </div>
                          <StatusBadge 
                            status={order.logisticsStatus} 
                            statusMap={{
                              awaiting_scheduling: { label: 'Aguardando', variant: 'secondary' },
                              scheduled: { label: 'Agendado', variant: 'info' },
                              in_transit: { label: 'Em Rota', variant: 'warning' },
                              delivered: { label: 'Entregue', variant: 'success' }
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

                        {/* Route Info */}
                        {route && (
                          <div className="mb-2 p-2 bg-slate-50 dark:bg-slate-800/50 rounded">
                            <p className="text-xs font-medium text-text-primary dark:text-slate-100">
                              🚛 Rota: {route.id}
                            </p>
                            <p className="text-xs text-text-secondary dark:text-slate-400">
                              {getVehicleName(route.vehicleId)}
                            </p>
                            <p className="text-xs text-text-secondary dark:text-slate-400">
                              {new Date(route.scheduledStart).toLocaleDateString('pt-BR')} - 
                              {new Date(route.scheduledEnd).toLocaleDateString('pt-BR')}
                            </p>
                          </div>
                        )}

                        {/* Delivery Address */}
                        <div className="mb-2">
                          <p className="text-xs text-text-secondary dark:text-slate-400">
                            📍 {order.deliveryAddress.city}, {order.deliveryAddress.uf}
                          </p>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2 mt-3 pt-2 border-t border-border dark:border-slate-700">
                          <Button variant="ghost" size="sm" className="text-xs">
                            👁️ Ver
                          </Button>
                          {order.logisticsStatus === 'awaiting_scheduling' && (
                            <Button variant="secondary" size="sm" className="text-xs">
                              📅 Agendar
                            </Button>
                          )}
                          {order.logisticsStatus === 'scheduled' && (
                            <Button variant="accent" size="sm" className="text-xs">
                              🚛 Iniciar Rota
                            </Button>
                          )}
                          {order.logisticsStatus === 'in_transit' && (
                            <Button variant="success" size="sm" className="text-xs">
                              ✅ Entregar
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}

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
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {LOGISTICS_COLUMNS.map(column => {
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

      {/* Post-Delivery Scheduling Modal */}
      {confirmingDeliveryOrder && (
        <PostDeliverySchedulingModal
          isOpen={!!confirmingDeliveryOrder}
          serviceOrder={confirmingDeliveryOrder}
          checklistTemplate={getChecklistTemplate(confirmingDeliveryOrder)}
          onClose={() => setConfirmingDeliveryOrder(null)}
          onDeliveryConfirmed={handleDeliveryConfirmed}
          onInstallationScheduled={handleInstallationScheduled}
          vehicles={vehicles}
          productionEmployees={productionEmployees}
        />
      )}
    </div>
  );
};

export default LogisticsKanban;
