import React, { useMemo, FC, DragEvent } from 'react';
import type { ServiceOrder, LogisticsStatus, Vehicle } from '../types';
import KanbanColumn from './KanbanColumn';
import OrderCard from './OrderCard';

const LOGISTICS_COLUMNS: { id: LogisticsStatus; title: string; color: string }[] = [
  { id: 'awaiting_scheduling', title: 'A Agendar', color: 'bg-purple-700' },
  { id: 'scheduled', title: 'Agendado', color: 'bg-blue-600' },
  { id: 'in_transit', title: 'Em Rota', color: 'bg-orange-700' },
  { id: 'delivered', title: 'Realizado', color: 'bg-indigo-600' },
  { id: 'completed', title: 'Finalizado', color: 'bg-green-800' },
];

// ============= MAIN COMPONENT =============
interface LogisticsKanbanProps {
  serviceOrders: ServiceOrder[];
  vehicles: Vehicle[];
  onView?: (order: ServiceOrder) => void;
  onSchedule: (order: ServiceOrder) => void;
  onStartRoute: (orderId: string) => void;
  onArrive: (orderId: string) => void;
  onConfirmDelivery: (orderId: string) => void;
  onConfirmInstallation: (orderId: string) => void;
房企 GenerateReceiptTerm: (order: ServiceOrder) => void;
  onGenerateInstallTerm: (order: ServiceOrder) => void;
  onOpenChecklist: (order: ServiceOrder) => void;
}

const LogisticsKanban: FC<LogisticsKanbanProps> = ({
  serviceOrders,
  vehicles,
  onView,
  onSchedule,
  onStartRoute,
  onArrive,
  onConfirmDelivery,
  onConfirmInstallation,
  onGenerateReceiptTerm,
  onGenerateInstallTerm,
  onOpenChecklist
}) => {
  const logisticsOrders = useMemo(() => {
    const logisticsStatuses: LogisticsStatus[] = ['awaiting_scheduling', 'scheduled', 'in_transit', 'delivered', 'completed'];
    return serviceOrders.filter(o => logisticsStatuses.includes(o.logisticsStatus));
  }, [serviceOrders]);

  // Handlers vazios para drag-and-drop (não usado em logística)
  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };
  
  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };
  
  const handleDragStart = (e: DragEvent<HTMLElement>, orderId: string) => {
    // Não usado em logística
  };
  
  const handleDragEnd = () => {
    // Não usado em logística
  };
  
  const handleClick = (order: ServiceOrder) => {
    // Se onView for fornecido, usar ele, caso contrário abrir checklist
    if (onView) {
      onView(order);
    } else {
      onOpenChecklist(order);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-5 gap-5 h-[75vh]">
      {LOGISTICS_COLUMNS.map(column => {
        const columnOrders = logisticsOrders.filter(o => o.logisticsStatus === column.id);
        return (
          <KanbanColumn
            key={column.id}
            title={column.title}
            color={column.color}
            count={columnOrders.length}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
          >
            {columnOrders.map(order => (
              <OrderCard
                key={order.id}
                order={order}
                view="logistics"
                vehicles={vehicles}
                isDragging={false}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
                onClick={handleClick}
                onSchedule={onSchedule}
                onStartRoute={onStartRoute}
                onArrive={onArrive}
                onConfirmDelivery={onConfirmDelivery}
                onConfirmInstallation={onConfirmInstallation}
                onGenerateReceiptTerm={onGenerateReceiptTerm}
                onGenerateInstallTerm={onGenerateInstallTerm}
                onOpenChecklist={onOpenChecklist}
              />
            ))}
          </KanbanColumn>
        );
      })}
    </div>
  );
};

export default LogisticsKanban;

