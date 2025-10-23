import React, { useState, useCallback } from 'react';
import type { ServiceOrder, ProductionEmployee } from '../types';
import Card, { CardHeader, CardContent } from './ui/Card';
import Button from './ui/Button';
import StatusBadge from './ui/StatusBadge';
import Badge from './ui/Badge';

interface AssemblyKanbanProps {
  orders: ServiceOrder[];
  onStatusChange: (orderId: string, newStatus: string) => void;
  productionEmployees: ProductionEmployee[];
}

const ASSEMBLY_COLUMNS: { id: string; title: string; color: string; description: string }[] = [
  { 
    id: 'delivered', 
    title: 'Aguardando Montagem', 
    color: 'bg-slate-500',
    description: 'OSs entregues aguardando montagem'
  },
  { 
    id: 'scheduled', 
    title: 'Montagem Agendada', 
    color: 'bg-blue-500',
    description: 'Montagem agendada para instalação'
  },
  { 
    id: 'in_installation', 
    title: 'Em Instalação', 
    color: 'bg-orange-500',
    description: 'Equipe realizando a montagem'
  },
  { 
    id: 'completed', 
    title: 'Montagem Concluída', 
    color: 'bg-green-500',
    description: 'Montagem finalizada com sucesso'
  }
];

const AssemblyKanban: React.FC<AssemblyKanbanProps> = ({
  orders,
  onStatusChange,
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

  const handleDrop = useCallback((e: React.DragEvent, newStatus: string) => {
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

  const getOrdersForColumn = (status: string) => {
    return orders.filter(order => {
      // Mapear status de montagem baseado no estado da OS
      if (status === 'delivered') {
        return order.logisticsStatus === 'delivered' && !order.installation_confirmed;
      }
      if (status === 'scheduled') {
        return order.installation_confirmed && !order.delivery_confirmed;
      }
      if (status === 'in_installation') {
        return order.installation_confirmed && order.delivery_confirmed;
      }
      if (status === 'completed') {
        return order.installation_confirmed && order.delivery_confirmed && order.isFinalized;
      }
      return false;
    });
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

  const getInstallationTeam = (order: ServiceOrder) => {
    // Buscar equipe de montagem (funcionários com role 'montador')
    const installers = productionEmployees.filter(emp => 
      emp.role === 'montador' && emp.isActive
    );
    return installers;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-text-primary dark:text-slate-100">
            🔧 Montagem
          </h2>
          <p className="text-text-secondary dark:text-slate-400">
            Controle de instalação e montagem das OSs
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="info">
            Total: {orders.length} OSs
          </Badge>
          <Button variant="secondary" size="sm">
            📊 Relatório de Montagem
          </Button>
        </div>
      </div>

      {/* Installation Teams Summary */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold text-text-primary dark:text-slate-100">
            👥 Equipes de Montagem
          </h3>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {getInstallationTeam(orders[0] || {}).slice(0, 3).map(employee => (
              <div key={employee.id} className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-text-primary dark:text-slate-100">
                    {employee.name}
                  </span>
                  <Badge variant="success" className="text-xs">
                    Disponível
                  </Badge>
                </div>
                <p className="text-xs text-text-secondary dark:text-slate-400">
                  {employee.role} • {employee.phone}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Kanban Board */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {ASSEMBLY_COLUMNS.map(column => {
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
                          status={column.id} 
                          statusMap={{
                            delivered: { label: 'Aguardando', variant: 'secondary' },
                            scheduled: { label: 'Agendado', variant: 'info' },
                            in_installation: { label: 'Em Instalação', variant: 'warning' },
                            completed: { label: 'Concluído', variant: 'success' }
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

                      {/* Installation Type */}
                      <div className="mb-2">
                        <Badge variant="info" className="text-xs">
                          {order.finalizationType === 'delivery_installation' ? 'Entrega + Instalação' : 'Apenas Instalação'}
                        </Badge>
                      </div>

                      {/* Installation Status */}
                      <div className="mb-2">
                        <div className="flex items-center gap-2 text-xs">
                          <span className={`w-2 h-2 rounded-full ${order.delivery_confirmed ? 'bg-green-500' : 'bg-slate-300'}`}></span>
                          <span className="text-text-secondary dark:text-slate-400">
                            Entrega: {order.delivery_confirmed ? 'Confirmada' : 'Pendente'}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-xs">
                          <span className={`w-2 h-2 rounded-full ${order.installation_confirmed ? 'bg-green-500' : 'bg-slate-300'}`}></span>
                          <span className="text-text-secondary dark:text-slate-400">
                            Instalação: {order.installation_confirmed ? 'Agendada' : 'Pendente'}
                          </span>
                        </div>
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

                      {/* Actions */}
                      <div className="flex items-center gap-2 mt-3 pt-2 border-t border-border dark:border-slate-700">
                        <Button variant="ghost" size="sm" className="text-xs">
                          👁️ Ver
                        </Button>
                        {column.id === 'delivered' && (
                          <Button variant="secondary" size="sm" className="text-xs">
                            📅 Agendar Montagem
                          </Button>
                        )}
                        {column.id === 'scheduled' && (
                          <Button variant="accent" size="sm" className="text-xs">
                            🔧 Iniciar Instalação
                          </Button>
                        )}
                        {column.id === 'in_installation' && (
                          <Button variant="success" size="sm" className="text-xs">
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
                    <div className="text-4xl mb-2">🔧</div>
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
        {ASSEMBLY_COLUMNS.map(column => {
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

export default AssemblyKanban;
