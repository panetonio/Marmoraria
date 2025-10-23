import React from 'react';
import type { ServiceOrder, ProductionEmployee } from '../types';
import Card, { CardContent } from './ui/Card';
import Button from './ui/Button';
import StatusBadge from './ui/StatusBadge';
import Badge from './ui/Badge';

interface OrderCardProps {
  order: ServiceOrder;
  productionEmployees: ProductionEmployee[];
  onView?: (order: ServiceOrder) => void;
  onEdit?: (order: ServiceOrder) => void;
  onStatusChange?: (orderId: string, newStatus: string) => void;
  showActions?: boolean;
  variant?: 'production' | 'logistics' | 'assembly';
  className?: string;
}

const OrderCard: React.FC<OrderCardProps> = ({
  order,
  productionEmployees,
  onView,
  onEdit,
  onStatusChange,
  showActions = true,
  variant = 'production',
  className = ''
}) => {
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

  const getStatusConfig = () => {
    switch (variant) {
      case 'production':
        return {
          status: order.productionStatus,
          statusMap: {
            pending_production: { label: 'Aguardando', variant: 'secondary' },
            cutting: { label: 'Corte', variant: 'warning' },
            finishing: { label: 'Acabamento', variant: 'info' },
            quality_check: { label: 'Qualidade', variant: 'purple' },
            awaiting_logistics: { label: 'Pronto', variant: 'success' }
          }
        };
      case 'logistics':
        return {
          status: order.logisticsStatus,
          statusMap: {
            awaiting_scheduling: { label: 'Aguardando', variant: 'secondary' },
            scheduled: { label: 'Agendado', variant: 'info' },
            in_transit: { label: 'Em Rota', variant: 'warning' },
            delivered: { label: 'Entregue', variant: 'success' }
          }
        };
      case 'assembly':
        return {
          status: order.installation_confirmed ? 'scheduled' : 'delivered',
          statusMap: {
            delivered: { label: 'Aguardando', variant: 'secondary' },
            scheduled: { label: 'Agendado', variant: 'info' },
            in_installation: { label: 'Em Instalação', variant: 'warning' },
            completed: { label: 'Concluído', variant: 'success' }
          }
        };
      default:
        return { status: order.productionStatus, statusMap: {} };
    }
  };

  const statusConfig = getStatusConfig();

  const getVariantActions = () => {
    switch (variant) {
      case 'production':
        return (
          <>
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
          </>
        );
      case 'logistics':
        return (
          <>
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
          </>
        );
      case 'assembly':
        return (
          <>
            {!order.installation_confirmed && (
              <Button variant="secondary" size="sm" className="text-xs">
                📅 Agendar Montagem
              </Button>
            )}
            {order.installation_confirmed && !order.delivery_confirmed && (
              <Button variant="accent" size="sm" className="text-xs">
                🔧 Iniciar Instalação
              </Button>
            )}
            {order.installation_confirmed && order.delivery_confirmed && (
              <Button variant="success" size="sm" className="text-xs">
                ✅ Finalizar
              </Button>
            )}
          </>
        );
      default:
        return null;
    }
  };

  return (
    <Card className={`p-3 hover:shadow-lg transition-all duration-200 ${className}`}>
      <CardContent>
        {/* Header */}
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
            status={statusConfig.status} 
            statusMap={statusConfig.statusMap}
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

        {/* Variant-specific Info */}
        {variant === 'production' && order.allocatedSlabId && (
          <div className="mb-2">
            <Badge variant="info" className="text-xs">
              Chapa: {order.allocatedSlabId}
            </Badge>
          </div>
        )}

        {variant === 'logistics' && (
          <div className="mb-2">
            <p className="text-xs text-text-secondary dark:text-slate-400">
              📍 {order.deliveryAddress.city}, {order.deliveryAddress.uf}
            </p>
          </div>
        )}

        {variant === 'assembly' && (
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
        )}

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
        {showActions && (
          <div className="flex items-center gap-2 mt-3 pt-2 border-t border-border dark:border-slate-700">
            <Button variant="ghost" size="sm" className="text-xs" onClick={() => onView?.(order)}>
              👁️ Ver
            </Button>
            {getVariantActions()}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default OrderCard;
