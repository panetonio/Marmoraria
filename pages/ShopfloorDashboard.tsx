import React, { useState, useMemo, useCallback } from 'react';
import type { ServiceOrder, ProductionStatus, LogisticsStatus, Vehicle, ProductionEmployee, DeliveryRoute, ChecklistTemplate } from '../types';
import { useData } from '../context/DataContext';
import { api } from '../utils/api';
import Card, { CardHeader, CardContent } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Tabs from '../components/ui/Tabs';
import OperationsFilters from '../components/OperationsFilters';
import ProductionKanban from '../components/ProductionKanban';
import LogisticsKanban from '../components/LogisticsKanban';
import AssemblyKanban from '../components/AssemblyKanban';
import ProductivityDashboard from '../components/ProductivityDashboard';

type ShopfloorTab = 'production' | 'logistics' | 'assembly' | 'productivity';

interface FilterState {
  dateRange: { start: string; end: string };
  client: string;
  status: string;
  team: string;
  vehicle: string;
  priority: string;
}

const ShopfloorDashboard: React.FC = () => {
  const { serviceOrders, vehicles, productionEmployees, deliveryRoutes, checklistTemplates } = useData();
  
  const [activeTab, setActiveTab] = useState<ShopfloorTab>('production');
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

  // Filtrar dados baseado nos filtros
  const filteredServiceOrders = useMemo(() => {
    return serviceOrders.filter(order => {
      const dateMatch = new Date(order.deliveryDate) >= new Date(filters.dateRange.start) &&
                       new Date(order.deliveryDate) <= new Date(filters.dateRange.end);
      const clientMatch = !filters.client || order.clientName.toLowerCase().includes(filters.client.toLowerCase());
      const teamMatch = !filters.team || order.assignedToIds.includes(filters.team);
      const priorityMatch = !filters.priority || order.priority === filters.priority;
      
      return dateMatch && clientMatch && teamMatch && priorityMatch;
    });
  }, [serviceOrders, filters]);

  const filteredDeliveryRoutes = useMemo(() => {
    return deliveryRoutes.filter(route => {
      const dateMatch = new Date(route.scheduledStart) >= new Date(filters.dateRange.start) &&
                       new Date(route.scheduledStart) <= new Date(filters.dateRange.end);
      const vehicleMatch = !filters.vehicle || route.vehicleId === filters.vehicle;
      
      return dateMatch && vehicleMatch;
    });
  }, [deliveryRoutes, filters]);

  // Separar OSs por tipo de operação
  const productionOrders = useMemo(() => {
    const productionStatuses: ProductionStatus[] = ['pending_production', 'cutting', 'finishing', 'quality_check', 'awaiting_logistics'];
    return filteredServiceOrders.filter(order => productionStatuses.includes(order.productionStatus));
  }, [filteredServiceOrders]);

  const logisticsOrders = useMemo(() => {
    const logisticsStatuses: LogisticsStatus[] = ['awaiting_scheduling', 'scheduled', 'in_transit', 'delivered'];
    return filteredServiceOrders.filter(order => logisticsStatuses.includes(order.logisticsStatus));
  }, [filteredServiceOrders]);

  const assemblyOrders = useMemo(() => {
    return filteredServiceOrders.filter(order => 
      order.finalizationType === 'delivery_installation' && 
      (order.logisticsStatus === 'delivered' || order.installation_confirmed)
    );
  }, [filteredServiceOrders]);

  // Handlers para atualização de status
  const handleProductionStatusChange = useCallback((orderId: string, newStatus: ProductionStatus) => {
    // Implementar lógica de atualização
    console.log(`Atualizando OS ${orderId} para status de produção: ${newStatus}`);
  }, []);

  const handleLogisticsStatusChange = useCallback((orderId: string, newStatus: LogisticsStatus) => {
    // Implementar lógica de atualização
    console.log(`Atualizando OS ${orderId} para status de logística: ${newStatus}`);
  }, []);

  const handleAssemblyStatusChange = useCallback((orderId: string, newStatus: string) => {
    // Implementar lógica de atualização
    console.log(`Atualizando OS ${orderId} para status de montagem: ${newStatus}`);
  }, []);

  // Handler para confirmação de entrega
  const handleDeliveryConfirmed = useCallback(async (orderId: string, deliveryData: {
    checklistCompleted: boolean;
    photos: Array<{ url: string; description?: string }>;
    customerSignature: { url: string; timestamp: string };
  }) => {
    try {
      // Atualizar OS com dados da entrega
      console.log('Confirmando entrega para OS:', orderId, deliveryData);
      
      // Aqui você implementaria a lógica para:
      // 1. Atualizar o status da OS para 'delivered'
      // 2. Salvar as fotos e assinatura
      // 3. Marcar checklist como concluído
      // 4. Atualizar o banco de dados
      
      // Por enquanto, apenas log
      console.log('Entrega confirmada com sucesso');
    } catch (error) {
      console.error('Erro ao confirmar entrega:', error);
      throw error;
    }
  }, []);

  // Handler para agendamento de instalação
  const handleInstallationScheduled = useCallback(async (orderId: string, installationData: {
    scheduledStart: string;
    scheduledEnd: string;
    teamIds: string[];
    vehicleId?: string;
    notes?: string;
  }) => {
    try {
      console.log('Agendando instalação para OS:', orderId, installationData);
      
      // Criar rota de instalação via API
      const response = await api.createInstallationRoute({
        serviceOrderId: orderId,
        scheduledStart: installationData.scheduledStart,
        scheduledEnd: installationData.scheduledEnd,
        teamIds: installationData.teamIds,
        vehicleId: installationData.vehicleId,
        notes: installationData.notes
      });

      if (response.success) {
        console.log('Instalação agendada com sucesso:', response.data);
        // Aqui você poderia atualizar o estado local se necessário
      } else {
        throw new Error(response.message || 'Erro ao agendar instalação');
      }
    } catch (error) {
      console.error('Erro ao agendar instalação:', error);
      throw error;
    }
  }, []);

  const tabs = [
    { 
      id: 'production' as ShopfloorTab, 
      label: `Produção (${productionOrders.length})`,
      icon: '🏭'
    },
    { 
      id: 'logistics' as ShopfloorTab, 
      label: `Logística (${logisticsOrders.length})`,
      icon: '🚚'
    },
    { 
      id: 'assembly' as ShopfloorTab, 
      label: `Montagem (${assemblyOrders.length})`,
      icon: '🔧'
    },
    { 
      id: 'productivity' as ShopfloorTab, 
      label: 'Produtividade',
      icon: '📊'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-text-primary dark:text-slate-100">
            Shopfloor Dashboard
          </h1>
          <p className="text-text-secondary dark:text-slate-400 mt-1">
            Controle operacional integrado de produção, logística e montagem
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="secondary" size="sm">
            📊 Relatórios
          </Button>
          <Button variant="secondary" size="sm">
            ⚙️ Configurações
          </Button>
        </div>
      </div>

      {/* Filtros */}
      <OperationsFilters
        filters={filters}
        onFiltersChange={setFilters}
        vehicles={vehicles}
        productionEmployees={productionEmployees}
      />

      {/* Tabs */}
      <Tabs
        tabs={tabs}
        activeTab={activeTab}
        onTabClick={setActiveTab}
        className="bg-white dark:bg-slate-800 rounded-lg shadow-sm"
      />

      {/* Conteúdo das Abas */}
      <div className="mt-6">
        {activeTab === 'production' && (
          <ProductionKanban
            orders={productionOrders}
            onStatusChange={handleProductionStatusChange}
            vehicles={vehicles}
            productionEmployees={productionEmployees}
          />
        )}

        {activeTab === 'logistics' && (
          <LogisticsKanban
            orders={logisticsOrders}
            routes={filteredDeliveryRoutes}
            onStatusChange={handleLogisticsStatusChange}
            onDeliveryConfirmed={handleDeliveryConfirmed}
            onInstallationScheduled={handleInstallationScheduled}
            vehicles={vehicles}
            productionEmployees={productionEmployees}
            checklistTemplates={checklistTemplates}
          />
        )}

        {activeTab === 'assembly' && (
          <AssemblyKanban
            orders={assemblyOrders}
            onStatusChange={handleAssemblyStatusChange}
            productionEmployees={productionEmployees}
          />
        )}

        {activeTab === 'productivity' && (
          <ProductivityDashboard
            serviceOrders={filteredServiceOrders}
            productionEmployees={productionEmployees}
          />
        )}
      </div>
    </div>
  );
};

export default ShopfloorDashboard;
