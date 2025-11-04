import React, { FC, DragEvent } from 'react';
import type { ServiceOrder, Vehicle, OrderCardView } from '../types';
import Card from './ui/Card';
import Button from './ui/Button';
import StatusBadge from './ui/StatusBadge';
import Badge from './ui/Badge';
import { productionStatusMap } from '../config/statusMaps';

interface OrderCardProps {
  order: ServiceOrder;
  view: OrderCardView;
  vehicles?: Vehicle[];
  isDragging?: boolean;
  onDragStart: (e: DragEvent<HTMLElement>, orderId: string) => void;
  onDragEnd: (e: DragEvent<HTMLElement>) => void;
  onClick: (order: ServiceOrder) => void;
  // Callbacks opcionais para ações
  onFinalizeProduction?: (order: ServiceOrder) => void;
  onAssign?: (order: ServiceOrder) => void;
  onAllocate?: (order: ServiceOrder) => void;
  onSchedule?: (order: ServiceOrder) => void;
  onStartRoute?: (orderId: string) => void;
  onArrive?: (orderId: string) => void;
  onConfirmDelivery?: (orderId: string) => void;
  onConfirmInstallation?: (orderId: string) => void;
  onOpenChecklist?: (order: ServiceOrder) => void;
  onGenerateReceiptTerm?: (order: ServiceOrder) => void;
  onGenerateInstallTerm?: (order: ServiceOrder) => void;
  onAddNote?: (orderId: string, note: string) => void;
  onAssignEmployee?: (orderId: string, employeeId: string) => void;
  assignedProfessionals?: Array<{ id: string; name: string; role?: string }>;
}

const priorityConfig: Record<string, { label: string; className: string }> = {
  normal: { label: 'Normal', className: 'bg-slate-500 text-white' },
  alta: { label: 'Alta', className: 'bg-amber-500 text-white' },
  urgente: { label: 'Urgente', className: 'bg-red-600 text-white' },
};

const OrderCard: FC<OrderCardProps> = ({
  order,
  view,
  vehicles = [],
  isDragging = false,
  onDragStart,
  onDragEnd,
  onClick,
  onFinalizeProduction,
  onAssign,
  onAllocate,
  onSchedule,
  onStartRoute,
  onArrive,
  onConfirmDelivery,
  onConfirmInstallation,
  onOpenChecklist,
  onGenerateReceiptTerm,
  onGenerateInstallTerm,
  onAddNote,
  onAssignEmployee,
  assignedProfessionals = [],
}) => {
  const priority = order.priority || 'normal';
  
  // Detectar status de exceção
  const isExceptionStatus = [
    'rework_needed', 'delivery_issue', 'installation_pending_review', 'installation_issue',
    'quality_issue', 'material_shortage', 'equipment_failure', 'customer_not_available',
    'weather_delay', 'permit_issue', 'measurement_error', 'design_change'
  ].includes(order.status);
  
  const isCriticalException = [
    'rework_needed', 'delivery_issue', 'installation_issue', 'quality_issue',
    'material_shortage', 'equipment_failure', 'permit_issue', 'measurement_error'
  ].includes(order.status);

  // Dados da rota/veículo (para view === 'logistics')
  const assignedVehicle = order.vehicleId ? vehicles.find(vehicle => vehicle.id === order.vehicleId) : undefined;
  const deliveryStart = order.deliveryStart || order.deliveryScheduledDate;
  const startDate = deliveryStart ? new Date(deliveryStart) : null;
  const endDate = order.deliveryEnd ? new Date(order.deliveryEnd) : null;

  // Determinar quais botões mostrar baseado na view e status
  const shouldShowFinalizeProduction = view === 'production' && order.productionStatus === 'finishing' && onFinalizeProduction;
  const shouldShowAllocate = view === 'production' && order.productionStatus === 'cutting' && !order.allocatedSlabId && onAllocate;
  const shouldShowAssign = view === 'production' && (order.productionStatus !== 'cutting' || order.allocatedSlabId) && onAssign;
  const shouldShowSchedule = (view === 'logistics' && order.logisticsStatus === 'awaiting_scheduling' && onSchedule) ||
                             (view === 'assembly' && order.logisticsStatus === 'awaiting_scheduling' && onSchedule);
  const shouldShowStartRoute = view === 'logistics' && order.logisticsStatus === 'scheduled' && onStartRoute;
  const shouldShowArrive = view === 'logistics' && order.logisticsStatus === 'in_transit' && onArrive;
  const shouldShowConfirmDelivery = view === 'logistics' && order.logisticsStatus === 'delivered' && 
                                     order.finalizationType !== 'pickup' && !order.delivery_confirmed && onConfirmDelivery;
  const shouldShowConfirmInstallation = view === 'logistics' && order.logisticsStatus === 'delivered' && 
                                        order.finalizationType === 'delivery_installation' && 
                                        !order.installation_confirmed && order.delivery_confirmed && onConfirmInstallation;
  const shouldShowReceiptTerm = view === 'logistics' && 
                                 (order.logisticsStatus === 'awaiting_scheduling' || order.logisticsStatus === 'scheduled' || order.status === 'awaiting_pickup') && 
                                 order.finalizationType !== 'pickup' && onGenerateReceiptTerm;
  const shouldShowInstallTerm = view === 'logistics' && order.installation_confirmed && onGenerateInstallTerm;
  const shouldShowChecklist = view === 'logistics' && onOpenChecklist;

        return (
    <Card
      draggable
      onDragStart={(e) => onDragStart(e, order.id)}
      onDragEnd={onDragEnd}
      onClick={() => onClick(order)}
      className={`p-4 mt-4 shadow-sm border cursor-pointer hover:shadow-lg hover:border-primary/50 transition-all duration-200 relative ${
        isDragging ? 'opacity-40 scale-95 bg-slate-200 dark:bg-slate-700' : ''
      } ${
        isExceptionStatus 
          ? isCriticalException 
            ? 'border-red-500 dark:border-red-400 bg-red-50/50 dark:bg-red-900/20' 
            : 'border-yellow-500 dark:border-yellow-400 bg-yellow-50/50 dark:bg-yellow-900/20'
          : 'border-border dark:border-slate-700'
      }`}
    >
      {/* Badge de prioridade */}
      {priority !== 'normal' && (
        <div className={`absolute -top-2 -right-2 px-2 py-0.5 text-xs font-bold rounded-full shadow-lg ${priorityConfig[priority].className}`}>
          {priorityConfig[priority].label.toUpperCase()}
        </div>
      )}
      
      {/* Ícone de alerta para status de exceção */}
      {isExceptionStatus && (
        <div className={`absolute -top-2 -left-2 w-6 h-6 rounded-full flex items-center justify-center shadow-lg ${
          isCriticalException 
            ? 'bg-red-500 text-white' 
            : 'bg-yellow-500 text-white'
        }`}>
          <span className="text-xs font-bold">⚠</span>
        </div>
      )}

      {/* Header do Card */}
      <div className="flex justify-between items-start">
        <div>
          <p className="font-bold text-sm font-mono">{order.id}</p>
          <p className="text-xs text-text-secondary dark:text-slate-400 font-mono">Pedido: {order.orderId}</p>
        </div>
        <div className="flex gap-2 items-center">
          {/* Badges de tipo (para logística) */}
          {view === 'logistics' && (
            <>
              {order.finalizationType === 'delivery_installation' && (
                <Badge variant="primary">Instalação</Badge>
              )}
              {order.finalizationType !== 'pickup' && (
                <Badge variant="success">Entrega</Badge>
            )}
          </>
          )}
          {/* Ícone de anexo */}
          {order.attachment && (
            <div title={order.attachment.name} className="text-slate-400">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8 4a3 3 0 00-3 3v4a5 5 0 0010 0V7a3 3 0 10-6 0v4a3 3 0 106 0V的角度 a1 1 0 10-2 0v4a1 1 0 102 0V7a3 3 0 00-3-3z" clipRule="evenodd" />
              </svg>
            </div>
          )}
          {/* Botão de checklist (logística) */}
          {shouldShowChecklist && (
            <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); onOpenChecklist!(order); }}>
              Checklist
              </Button>
            )}
        </div>
      </div>

      {/* Nome do cliente */}
      <p className="text-text-secondary dark:text-slate-400 text-sm mt-1">{order.clientName}</p>
      
      {/* StatusBadge para status de exceção */}
      {isExceptionStatus && (
        <div className="mt-2">
          <StatusBadge status={order.status} statusMap={productionStatusMap} />
        </div>
      )}

      {/* Informações de rota/veículo (para logística) */}
      {view === 'logistics' && startDate && (
        <div className="mt-2 text-sm text-text-secondary dark:text-slate-300">
          <div className="font-semibold text-primary">
            {startDate.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'short' })}
            {' '}•{' '}
            {startDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
            {endDate && (
              <span className="text-xs text-text-secondary dark:text-slate-400"> — {endDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
            )}
          </div>
          {assignedVehicle && (
            <div className="flex items-center gap-2 mt-1 text-xs text-text-secondary dark:text-slate-400">
              <span className="font-medium text-text-primary dark:text-slate-200">Veículo:</span>
              <span>{assignedVehicle.name} ({assignedVehicle.licensePlate})</span>
            </div>
          )}
        </div>
      )}

      {/* Chapa alocada (para produção) */}
      {order.allocatedSlabId && (
        <div className="mt-2 pt-2 border-t border-border/50 dark:border-slate-700/50 text-xs">
          <span className="text-slate-500 dark:text-slate-400">Chapa:</span>{' '}
          <span className="font-mono text-primary font-semibold">{order.allocatedSlabId}</span>
        </div>
      )}

      {/* Profissionais atribuídos */}
      {assignedProfessionals.length > 0 && (
        <div className="mt-2 pt-2 border-t border-border/50 dark:border-slate-700/50">
          <div className="flex -space-x-2">
            {assignedProfessionals.map(professional => (
              <div 
                key={professional.id} 
                title={professional.name} 
                className="w-6 h-6 rounded-full bg-slate-600 text-white flex items-center justify-center text-xs font-bold ring-2 ring-white"
              >
                {professional.name.charAt(0)}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Rodapé do Card - Botões de ação */}
      <div className="mt-3 pt-3 border-t border-border dark:border-slate-700 space-y-2">
        {/* Botão para resolver exceção */}
        {isExceptionStatus && (
          <Button 
            variant="accent" 
            size="sm" 
            className="w-full"
            onClick={(e) => { e.stopPropagation(); onClick(order); }}
          >
            Resolver
          </Button>
        )}

        {/* Ações de Produção */}
        {shouldShowFinalizeProduction && (
          <Button 
            variant="accent" 
            size="sm" 
            className="w-full"
            onClick={(e) => { e.stopPropagation(); onFinalizeProduction!(order); }}
          >
            Finalizar Produção
          </Button>
        )}
        {shouldShowAllocate && (
          <Button 
            variant="secondary" 
            size="sm" 
            className="w-full"
            onClick={(e) => { e.stopPropagation(); onAllocate!(order); }}
          >
            Alocar Chapa
          </Button>
        )}
        {shouldShowAssign && (
          <Button 
            variant="ghost" 
            size="sm" 
            className="w-full"
            onClick={(e) => { e.stopPropagation(); onAssign!(order); }}
          >
            Equipe
          </Button>
        )}

        {/* Ações de Logística */}
        {shouldShowSchedule && (
          <Button 
            size="sm" 
            className="w-full" 
            onClick={(e) => { e.stopPropagation(); onSchedule!(order); }}
          >
            Agendar
          </Button>
        )}
        {shouldShowStartRoute && (
          <Button 
            size="sm" 
            className="w-full" 
            onClick={(e) => { e.stopPropagation(); onStartRoute!(order.id); }}
          >
            Iniciar Rota
          </Button>
        )}
        {shouldShowArrive && (
          <Button 
            size="sm" 
            className="w-full" 
            onClick={(e) => { e.stopPropagation(); onArrive!(order.id); }}
          >
            Chegou ao Destino
          </Button>
        )}
        
        {/* Confirmações (no status 'delivered') */}
        {view === 'logistics' && order.logisticsStatus === 'delivered' && (
          <div className="space-y-2">
            {order.finalizationType !== 'pickup' && order.delivery_confirmed && (
              <div className="text-sm font-semibold text-green-600 flex items-center justify-center gap-1 p-1 bg-green-100 dark:bg-green-900/50 rounded-md">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Entrega Concluída
              </div>
            )}
            {shouldShowConfirmDelivery && (
              <Button 
                size="sm" 
                className="w-full" 
                variant="secondary"
                onClick={(e) => { e.stopPropagation(); onConfirmDelivery!(order.id); }}
              >
                Confirmar Entrega
              </Button>
            )}
            {order.finalizationType === 'delivery_installation' && order.installation_confirmed && (
              <div className="text-sm font-semibold text-green-600 flex items-center justify-center gap-1 p-1 bg-green-100 dark:bg-green-900/50 rounded-md">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Instalação Concluída
            </div>
            )}
            {shouldShowConfirmInstallation && (
              <Button 
                size="sm" 
                className="w-full" 
                variant="secondary"
                onClick={(e) => { e.stopPropagation(); onConfirmInstallation!(order.id); }}
                disabled={!order.delivery_confirmed}
              >
                Confirmar Instalação
              </Button>
            )}
          </div>
        )}

        {/* Geração de documentos */}
        {(shouldShowReceiptTerm || shouldShowInstallTerm) && (
          <div className="!mt-3 pt-2 border-t border-dashed space-y-2">
            {shouldShowReceiptTerm && (
              <Button 
                size="sm" 
                variant="ghost" 
                className="w-full" 
                onClick={(e) => { e.stopPropagation(); onGenerateReceiptTerm!(order); }}
              >
                Gerar Termo Recebimento
              </Button>
            )}
            {shouldShowInstallTerm && (
              <Button 
                size="sm" 
                variant="ghost" 
                className="w-full" 
                onClick={(e) => { e.stopPropagation(); onGenerateInstallTerm!(order); }}
              >
                Gerar Termo Instalação
            </Button>
            )}
          </div>
        )}
      </div>
    </Card>
  );
};

export default OrderCard;
