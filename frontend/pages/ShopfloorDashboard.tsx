import React, { useState, useMemo } from 'react';
import { Collapse, Badge } from 'antd';
import type { ServiceOrder, ProductionStatus, LogisticsStatus, User, Vehicle, ProductionEmployee } from '../types';

type DeliveryScheduleInput = {
  vehicleId: string;
  start: string;
  end: string;
  teamIds: string[];
};
import { useData } from '../context/DataContext';
import ProductionKanban from '../components/ProductionKanban';
import LogisticsKanban from '../components/LogisticsKanban';
import AssemblyKanban from '../components/AssemblyKanban';
import ProductivityDashboard from '../components/ProductivityDashboard';
import OperationsFilters from '../components/OperationsFilters';
import PostDeliverySchedulingModal from '../components/PostDeliverySchedulingModal';
import ReceiptTermModal from '../components/ReceiptTermModal';
import InstallationTermModal from '../components/InstallationTermModal';
import Modal from '../components/ui/Modal';
import { formatDate } from '../utils/dateFormat';

interface FilterState {
  dateRange: { start: string; end: string };
  client: string;
  status: string;
  team: string;
  vehicle: string;
  priority: string;
}

const ShopfloorDashboard: React.FC = () => {
  const { 
    serviceOrders, 
    users, 
    vehicles, 
    productionEmployees,
    updateServiceOrderStatus,
    scheduleDelivery,
    confirmDelivery,
    confirmInstallation,
    updateDepartureChecklist,
    refreshServiceOrder,
    deliveryRoutes
  } = useData();

  // Estados de filtro
  const [filters, setFilters] = useState<FilterState>({
    dateRange: {
      start: new Date().toISOString().split('T')[0],
      end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    },
    client: '',
    status: '',
    team: '',
    vehicle: '',
    priority: ''
  });

  // Estados para modais
  const [viewingOrder, setViewingOrder] = useState<ServiceOrder | null>(null);
  const [schedulingOrder, setSchedulingOrder] = useState<ServiceOrder | null>(null);
  const [generatingReceiptTermOrder, setGeneratingReceiptTermOrder] = useState<ServiceOrder | null>(null);
  const [generatingInstallTermOrder, setGeneratingInstallTermOrder] = useState<ServiceOrder | null>(null);
  const [activeChecklistOrder, setActiveChecklistOrder] = useState<ServiceOrder | null>(null);

  // Filtrar OSs de produção
  const productionOrders = useMemo(() => {
    const productionStatuses: ProductionStatus[] = ['cutting', 'finishing'];
    return serviceOrders.filter(order => {
      const statusMatch = productionStatuses.includes(order.productionStatus);
      const dateMatch = new Date(order.deliveryDate) >= new Date(filters.dateRange.start) && 
                       new Date(order.deliveryDate) <= new Date(filters.dateRange.end);
      const clientMatch = !filters.client || order.clientName.toLowerCase().includes(filters.client.toLowerCase());
      const statusFilterMatch = !filters.status || order.status === filters.status || order.productionStatus === filters.status;
      const teamMatch = !filters.team || order.assignedToIds.includes(filters.team);
      const priorityMatch = !filters.priority || order.priority === filters.priority;
      
      return statusMatch && dateMatch && clientMatch && statusFilterMatch && teamMatch && priorityMatch;
    });
  }, [serviceOrders, filters]);

  // Filtrar OSs de logística
  const logisticsOrders = useMemo(() => {
    const logisticsStatuses: LogisticsStatus[] = ['awaiting_scheduling', 'scheduled', 'in_transit', 'delivered', 'completed'];
    return serviceOrders.filter(order => {
      const statusMatch = logisticsStatuses.includes(order.logisticsStatus);
      const dateMatch = new Date(order.deliveryDate) >= new Date(filters.dateRange.start) && 
                       new Date(order.deliveryDate) <= new Date(filters.dateRange.end);
      const clientMatch = !filters.client || order.clientName.toLowerCase().includes(filters.client.toLowerCase());
      const statusFilterMatch = !filters.status || order.status === filters.status || order.logisticsStatus === filters.status;
      const teamMatch = !filters.team || order.assignedToIds.includes(filters.team);
      const vehicleMatch = !filters.vehicle || order.vehicleId === filters.vehicle;
      const priorityMatch = !filters.priority || order.priority === filters.priority;
      
      return statusMatch && dateMatch && clientMatch && statusFilterMatch && teamMatch && vehicleMatch && priorityMatch;
    });
  }, [serviceOrders, filters]);

  // Filtrar OSs de montagem
  const assemblyOrders = useMemo(() => {
    const assemblyStatuses: ProductionStatus[] = ['cutting', 'finishing'];
    return serviceOrders.filter(order => {
      const statusMatch = assemblyStatuses.includes(order.productionStatus);
      const dateMatch = new Date(order.deliveryDate) >= new Date(filters.dateRange.start) &&
                       new Date(order.deliveryDate) <= new Date(filters.dateRange.end);
      const clientMatch = !filters.client || order.clientName.toLowerCase().includes(filters.client.toLowerCase());
      const statusFilterMatch = !filters.status || order.status === filters.status || order.productionStatus === filters.status;
      const teamMatch = !filters.team || order.assignedToIds.includes(filters.team);
      const priorityMatch = !filters.priority || order.priority === filters.priority;
      
      return statusMatch && dateMatch && clientMatch && statusFilterMatch && teamMatch && priorityMatch;
    });
  }, [serviceOrders, filters]);

  // Handlers para logística
  const handleStartRoute = async (orderId: string) => {
    try {
      const route = deliveryRoutes.find(r => r.serviceOrderId === orderId);
      if (route) {
        const response = await fetch(`/api/delivery-routes/${route.id}/status`, {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ status: 'in_progress' })
        });
        
        if (response.ok) {
          await refreshServiceOrder(orderId);
        } else {
          console.error('Failed to start route');
        }
      }
    } catch (error) {
      console.error('Error starting route:', error);
    }
  };

  const handleArriveAtDestination = async (orderId: string) => {
    try {
      const route = deliveryRoutes.find(r => r.serviceOrderId === orderId);
      if (route) {
        const response = await fetch(`/api/delivery-routes/${route.id}/status`, {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ status: 'completed' })
        });
        
        if (response.ok) {
          await refreshServiceOrder(orderId);
        } else {
          console.error('Failed to complete route');
        }
      }
    } catch (error) {
      console.error('Error completing route:', error);
    }
  };

  // Handlers para montagem
  const handleAddNote = (orderId: string, note: string) => {
    console.log(`Adicionando nota ao pedido ${orderId}: ${note}`);
  };

  const handleAssignEmployee = (orderId: string, employeeId: string) => {
    console.log(`Atribuindo funcionário ${employeeId} ao pedido ${orderId}`);
  };

  // Handlers para produção
  const handleAssign = (order: ServiceOrder) => {
    console.log('Atribuindo profissional ao pedido:', order.id);
  };

  const handleAllocate = (order: ServiceOrder) => {
    console.log('Alocando recursos para o pedido:', order.id);
  };

  const handleView = (order: ServiceOrder) => {
    setViewingOrder(order);
  };

  const handleFinalize = async (order: ServiceOrder) => {
    try {
      await updateServiceOrderStatus(order.id, 'ready_for_logistics');
      await refreshServiceOrder(order.id);
    } catch (error) {
      console.error('Erro ao finalizar produção:', error);
    }
  };

  // Handlers para logística
  const handleSchedule = (order: ServiceOrder) => {
    setSchedulingOrder(order);
  };

  const handleGenerateReceiptTerm = (order: ServiceOrder) => {
    setGeneratingReceiptTermOrder(order);
  };

  const handleGenerateInstallTerm = (order: ServiceOrder) => {
    setGeneratingInstallTermOrder(order);
  };

  const handleOpenChecklist = (order: ServiceOrder) => {
    setActiveChecklistOrder(order);
  };

  // Handler para agendamento de entrega
  const handleDeliveryScheduled = async (orderId: string, schedule: DeliveryScheduleInput) => {
    try {
      await scheduleDelivery(orderId, schedule);
      setSchedulingOrder(null);
      await refreshServiceOrder(orderId);
    } catch (error) {
      console.error('Erro ao agendar entrega:', error);
    }
  };

  // Handler para instalação agendada
  const handleInstallationScheduled = async (orderId: string, installationData: {
    scheduledStart: string;
    scheduledEnd: string;
    teamIds: string[];
    vehicleId?: string;
    notes?: string;
  }) => {
    try {
      // Implementar lógica de agendamento de instalação
      console.log('Agendando instalação:', orderId, installationData);
      setSchedulingOrder(null);
      await refreshServiceOrder(orderId);
    } catch (error) {
      console.error('Erro ao agendar instalação:', error);
    }
  };

  // Função para criar header dos painéis
  const getPanelHeader = (title: string, count: number) => (
    <div className="flex justify-between items-center w-full">
      <span className="font-semibold">{title}</span>
      <Badge count={count} style={{ backgroundColor: '#1e40af' }} />
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Modais */}
      {viewingOrder && (
        <Modal 
          isOpen={!!viewingOrder} 
          onClose={() => setViewingOrder(null)} 
          title={`Detalhes da OS: ${viewingOrder.id}`}
          className="max-w-4xl"
        >
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-text-secondary dark:text-slate-400 mb-1">Cliente</label>
                <p className="text-sm text-text-primary dark:text-slate-100">{viewingOrder.clientName}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-text-secondary dark:text-slate-400 mb-1">Status</label>
                <p className="text-sm text-text-primary dark:text-slate-100">{viewingOrder.status}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-text-secondary dark:text-slate-400 mb-1">Total</label>
                <p className="text-sm text-text-primary dark:text-slate-100">R$ {viewingOrder.total.toFixed(2)}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-text-secondary dark:text-slate-400 mb-1">Data de Entrega</label>
                <p className="text-sm text-text-primary dark:text-slate-100">{formatDate(viewingOrder.deliveryDate)}</p>
              </div>
            </div>
            {viewingOrder.observations && (
              <div>
                <label className="block text-sm font-medium text-text-secondary dark:text-slate-400 mb-1">Observações</label>
                <p className="text-sm text-text-primary dark:text-slate-100">{viewingOrder.observations}</p>
              </div>
            )}
          </div>
        </Modal>
      )}

      {schedulingOrder && (
        <PostDeliverySchedulingModal
          isOpen={!!schedulingOrder}
          serviceOrder={schedulingOrder}
          onClose={() => setSchedulingOrder(null)}
          onDeliveryConfirmed={(orderId, deliveryData) => {
            confirmDelivery(orderId, deliveryData);
            setSchedulingOrder(null);
          }}
          onInstallationScheduled={handleInstallationScheduled}
          vehicles={vehicles}
          productionEmployees={productionEmployees}
        />
      )}

      {generatingReceiptTermOrder && (
        <ReceiptTermModal
          isOpen={!!generatingReceiptTermOrder}
          order={generatingReceiptTermOrder}
          onClose={() => setGeneratingReceiptTermOrder(null)}
        />
      )}

      {generatingInstallTermOrder && (
        <InstallationTermModal
          isOpen={!!generatingInstallTermOrder}
          order={generatingInstallTermOrder}
          onClose={() => setGeneratingInstallTermOrder(null)}
        />
      )}

      {activeChecklistOrder && (
        <Modal
          isOpen={!!activeChecklistOrder}
          onClose={() => setActiveChecklistOrder(null)}
          title={`Checklist - ${activeChecklistOrder.id}`}
        >
          <div className="space-y-4">
            {activeChecklistOrder.departureChecklist && activeChecklistOrder.departureChecklist.length > 0 ? (
              <div className="space-y-2">
                {activeChecklistOrder.departureChecklist.map((item, index) => (
                  <div key={index} className="flex items-center gap-2 p-2 bg-slate-50 dark:bg-slate-800 rounded">
                    <input
                      type="checkbox"
                      checked={item.checked}
                      readOnly
                      className="rounded"
                    />
                    <span className={item.checked ? 'line-through text-text-secondary' : ''}>
                      {item.text}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-text-secondary dark:text-slate-400">Nenhum item no checklist ainda.</p>
            )}
          </div>
        </Modal>
      )}

      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-text-primary dark:text-slate-100">Chão de Fábrica Unificado</h1>
          <p className="mt-2 text-text-secondary dark:text-slate-400">
            Visão integrada de produção, logística, montagem e produtividade
          </p>
        </div>
      </div>

      {/* Filtros */}
      <OperationsFilters
        filters={filters}
        onFiltersChange={setFilters}
        vehicles={vehicles}
        productionEmployees={productionEmployees}
      />

      {/* Dashboard com Collapse */}
      <Collapse defaultActiveKey={['production']} accordion>
        <Collapse.Panel 
          header={getPanelHeader('🏭 Produção', productionOrders.length)} 
          key="production"
        >
          <ProductionKanban
            serviceOrders={productionOrders}
            users={users}
            vehicles={vehicles}
            onUpdateServiceOrders={(orders) => {
              // Atualizar serviceOrders no contexto se necessário
              console.log('Atualizando OSs de produção:', orders);
            }}
            onAssign={handleAssign}
            onAllocate={handleAllocate}
            onView={handleView}
            onFinalize={handleFinalize}
          />
        </Collapse.Panel>

        <Collapse.Panel 
          header={getPanelHeader('🚚 Logística', logisticsOrders.length)} 
          key="logistics"
        >
          <LogisticsKanban
            serviceOrders={logisticsOrders}
            vehicles={vehicles}
            onView={handleView}
            onSchedule={handleSchedule}
            onStartRoute={handleStartRoute}
            onArrive={handleArriveAtDestination}
            onConfirmDelivery={confirmDelivery}
            onConfirmInstallation={confirmInstallation}
            onGenerateReceiptTerm={handleGenerateReceiptTerm}
            onGenerateInstallTerm={handleGenerateInstallTerm}
            onOpenChecklist={handleOpenChecklist}
          />
        </Collapse.Panel>

        <Collapse.Panel 
          header={getPanelHeader('🔧 Montagem', assemblyOrders.length)} 
          key="assembly"
        >
          <AssemblyKanban
            serviceOrders={assemblyOrders}
            productionEmployees={productionEmployees}
            onView={handleView}
            onUpdateStatus={updateServiceOrderStatus}
            onAddNote={handleAddNote}
            onAssignEmployee={handleAssignEmployee}
          />
        </Collapse.Panel>

        <Collapse.Panel 
          header={getPanelHeader('📊 Produtividade', 0)} 
          key="productivity"
        >
          <ProductivityDashboard />
        </Collapse.Panel>
      </Collapse>
    </div>
  );
};

export default ShopfloorDashboard;

