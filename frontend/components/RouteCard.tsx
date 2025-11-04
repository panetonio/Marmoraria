import React from 'react';
import type { DeliveryRoute, Vehicle, ProductionEmployee } from '../types';
import Card, { CardContent } from './ui/Card';
import Button from './ui/Button';
import StatusBadge from './ui/StatusBadge';
import Badge from './ui/Badge';

interface RouteCardProps {
  route: DeliveryRoute;
  vehicle?: Vehicle;
  productionEmployees: ProductionEmployee[];
  onView?: (route: DeliveryRoute) => void;
  onEdit?: (route: DeliveryRoute) => void;
  onStatusChange?: (routeId: string, newStatus: string) => void;
  showActions?: boolean;
  className?: string;
}

const RouteCard: React.FC<RouteCardProps> = ({
  route,
  vehicle,
  productionEmployees,
  onView,
  onEdit,
  onStatusChange,
  showActions = true,
  className = ''
}) => {
  const getEmployeeName = (employeeId: string) => {
    const employee = productionEmployees.find(emp => emp.id === employeeId);
    return employee?.name || 'Não encontrado';
  };

  const getStatusConfig = () => {
    return {
      status: route.status,
      statusMap: {
        pending: { label: 'Pendente', variant: 'secondary' },
        scheduled: { label: 'Agendado', variant: 'info' },
        in_progress: { label: 'Em Rota', variant: 'warning' },
        completed: { label: 'Concluído', variant: 'success' },
        cancelled: { label: 'Cancelado', variant: 'error' }
      }
    };
  };

  const statusConfig = getStatusConfig();

  const getRouteTypeLabel = () => {
    return route.type === 'delivery' ? 'Entrega' : 'Instalação';
  };

  const getRouteTypeColor = () => {
    return route.type === 'delivery' ? 'bg-blue-500' : 'bg-purple-500';
  };

  const formatDateTime = (date: string) => {
    return new Date(date).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getDuration = () => {
    const start = new Date(route.scheduledStart);
    const end = new Date(route.scheduledEnd);
    const duration = end.getTime() - start.getTime();
    const hours = Math.floor(duration / (1000 * 60 * 60));
    const minutes = Math.floor((duration % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  };

  return (
    <Card className={`p-3 hover:shadow-lg transition-all duration-200 ${className}`}>
      <CardContent>
        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="font-mono text-sm font-semibold text-primary">
              {route.id}
            </span>
            <Badge 
              variant="info" 
              className={`text-xs ${getRouteTypeColor()}`}
            >
              {getRouteTypeLabel()}
            </Badge>
          </div>
          <StatusBadge 
            status={statusConfig.status} 
            statusMap={statusConfig.statusMap}
          />
        </div>

        {/* Service Order */}
        <div className="mb-2">
          <p className="text-sm font-medium text-text-primary dark:text-slate-100">
            OS: {route.serviceOrderId}
          </p>
        </div>

        {/* Vehicle Info */}
        {vehicle && (
          <div className="mb-2">
            <p className="text-xs text-text-secondary dark:text-slate-400">
              🚚 {vehicle.name} ({vehicle.licensePlate})
            </p>
            <p className="text-xs text-text-secondary dark:text-slate-400">
              {vehicle.type} • Capacidade: {vehicle.capacity}kg
            </p>
          </div>
        )}

        {/* Schedule Info */}
        <div className="mb-2">
          <p className="text-xs text-text-secondary dark:text-slate-400">
            📅 Início: {formatDateTime(route.scheduledStart)}
          </p>
          <p className="text-xs text-text-secondary dark:text-slate-400">
            🏁 Fim: {formatDateTime(route.scheduledEnd)}
          </p>
          <p className="text-xs text-text-secondary dark:text-slate-400">
            ⏱️ Duração: {getDuration()}
          </p>
        </div>

        {/* Team Info */}
        {route.teamIds && route.teamIds.length > 0 && (
          <div className="mb-2">
            <p className="text-xs text-text-secondary dark:text-slate-400 mb-1">
              👥 Equipe:
            </p>
            <div className="flex flex-wrap gap-1">
              {route.teamIds.slice(0, 2).map(employeeId => (
                <Badge key={employeeId} variant="secondary" className="text-xs">
                  {getEmployeeName(employeeId)}
                </Badge>
              ))}
              {route.teamIds.length > 2 && (
                <Badge variant="secondary" className="text-xs">
                  +{route.teamIds.length - 2}
                </Badge>
              )}
            </div>
          </div>
        )}

        {/* Progress Info */}
        {route.actualStart && (
          <div className="mb-2">
            <p className="text-xs text-text-secondary dark:text-slate-400">
              🚀 Iniciado: {formatDateTime(route.actualStart)}
            </p>
          </div>
        )}

        {route.actualEnd && (
          <div className="mb-2">
            <p className="text-xs text-text-secondary dark:text-slate-400">
              ✅ Concluído: {formatDateTime(route.actualEnd)}
            </p>
          </div>
        )}

        {/* Checklist Status */}
        {route.checklistCompleted && (
          <div className="mb-2">
            <Badge variant="success" className="text-xs">
              ✅ Checklist Concluído
            </Badge>
          </div>
        )}

        {/* Photos and Signature */}
        {(route.photos && route.photos.length > 0) || route.customerSignature ? (
          <div className="mb-2">
            <div className="flex items-center gap-2">
              {route.photos && route.photos.length > 0 && (
                <Badge variant="info" className="text-xs">
                  📸 {route.photos.length} foto(s)
                </Badge>
              )}
              {route.customerSignature && (
                <Badge variant="success" className="text-xs">
                  ✍️ Assinatura
                </Badge>
              )}
            </div>
          </div>
        ) : null}

        {/* Notes */}
        {route.notes && (
          <div className="mb-2">
            <p className="text-xs text-text-secondary dark:text-slate-400">
              📝 {route.notes}
            </p>
          </div>
        )}

        {/* Actions */}
        {showActions && (
          <div className="flex items-center gap-2 mt-3 pt-2 border-t border-border dark:border-slate-700">
            <Button variant="ghost" size="sm" className="text-xs" onClick={() => onView?.(route)}>
              👁️ Ver
            </Button>
            {route.status === 'pending' && (
              <Button variant="secondary" size="sm" className="text-xs">
                📅 Agendar
              </Button>
            )}
            {route.status === 'scheduled' && (
              <Button variant="accent" size="sm" className="text-xs">
                🚛 Iniciar
              </Button>
            )}
            {route.status === 'in_progress' && (
              <Button variant="success" size="sm" className="text-xs">
                ✅ Concluir
              </Button>
            )}
            {route.status === 'completed' && (
              <Button variant="ghost" size="sm" className="text-xs">
                📋 Relatório
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default RouteCard;
