import React, { useState, useMemo, FC, DragEvent } from 'react';
import { mockProductionProfessionals } from '../data/mockData';
import type { ServiceOrder, ProductionStatus, ProductionProfessional, StockItem } from '../types';
import Card, { CardContent, CardHeader } from '../components/ui/Card';
import Modal from '../components/ui/Modal';
import Button from '../components/ui/Button';
import { useData } from '../context/DataContext';
import StatusBadge from '../components/ui/StatusBadge';
import { productionStatusMap } from '../config/statusMaps';
import Select from '../components/ui/Select';

const KANBAN_COLUMNS: { id: ProductionStatus; title: string; color: string }[] = [
  { id: 'cutting', title: 'Em Corte', color: 'bg-orange-800' },
  { id: 'finishing', title: 'Em Acabamento', color: 'bg-blue-700' },
  { id: 'assembly', title: 'Em Montagem', color: 'bg-indigo-700' },
  { id: 'ready_for_delivery', title: 'Pronto para Entrega', color: 'bg-purple-700' },
  { id: 'delivered', title: 'Entregue', color: 'bg-green-800' },
];

const ServiceOrderDetailModal: FC<{
  isOpen: boolean;
  order: ServiceOrder;
  onClose: () => void;
}> = ({ isOpen, order, onClose }) => {
  const assignedProfessionals = mockProductionProfessionals.filter(p => order.assignedToIds.includes(p.id));

  const professionalRoles: Record<ProductionProfessional['role'], string> = {
      cortador: "Cortador",
      acabador: "Acabador",
      montador: "Montador",
      entregador: "Entregador"
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Detalhes da OS: ${order.id}`} className="max-w-4xl">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <Card className="p-0">
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm text-text-secondary dark:text-slate-400">Cliente</h4>
                  <p className="font-semibold text-text-primary dark:text-slate-100">{order.clientName}</p>
                </div>
                <div>
                  <h4 className="text-sm text-text-secondary dark:text-slate-400">Pedido de Origem</h4>
                  <p className="font-semibold font-mono text-text-primary dark:text-slate-100">{order.orderId}</p>
                </div>
                <div>
                  <h4 className="text-sm text-text-secondary dark:text-slate-400">Data de Entrega</h4>
                  <p className="font-semibold text-text-primary dark:text-slate-100">{new Date(order.deliveryDate).toLocaleDateString()}</p>
                </div>
                <div>
                  <h4 className="text-sm text-text-secondary dark:text-slate-400">Status Atual</h4>
                  <StatusBadge status={order.status} statusMap={productionStatusMap} />
                </div>
                 {order.allocatedSlabId && (
                    <div className="col-span-2">
                        <h4 className="text-sm text-text-secondary dark:text-slate-400">Chapa Alocada</h4>
                        <p className="font-semibold font-mono text-primary">{order.allocatedSlabId}</p>
                    </div>
                )}
              </div>
            </CardContent>
          </Card>
          
          <Card className="p-0">
            <CardHeader>Itens na Ordem de Serviço</CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-border dark:border-slate-700">
                      <th className="p-2">Descrição</th>
                      <th className="p-2 text-center">Qtd.</th>
                      <th className="p-2 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {order.items.map(item => (
                      <tr key={item.id} className="border-b border-border dark:border-slate-700 last:border-b-0">
                        <td className="p-2">{item.description}</td>
                        <td className="p-2 text-center">{item.quantity.toFixed(2)}</td>
                        <td className="p-2 text-right font-mono">{item.totalPrice.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
        
        <div className="md:col-span-1">
          <Card className="p-0">
            <CardHeader>Equipe Alocada</CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {assignedProfessionals.length > 0 ? (
                  assignedProfessionals.map(prof => (
                    <li key={prof.id} className="flex items-center">
                      <div className="w-8 h-8 rounded-full bg-slate-600 text-white flex items-center justify-center text-sm font-bold ring-2 ring-white mr-3">
                        {prof.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-semibold text-text-primary dark:text-slate-100">{prof.name}</p>
                        <p className="text-xs text-text-secondary dark:text-slate-400 capitalize">{professionalRoles[prof.role]}</p>
                      </div>
                    </li>
                  ))
                ) : (
                  <p className="text-sm text-text-secondary dark:text-slate-400 text-center py-4">Nenhum profissional alocado.</p>
                )}
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </Modal>
  );
};

const ResourceAllocationModal: FC<{
  isOpen: boolean;
  order: ServiceOrder;
  productionTeam: ProductionProfessional[];
  onClose: () => void;
  onSave: (orderId: string, assignedToIds: string[]) => void;
}> = ({ isOpen, order, productionTeam, onClose, onSave }) => {
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>(order.assignedToIds);

  const handleCheckboxChange = (userId: string) => {
    setSelectedUserIds(prev =>
      prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
    );
  };

  const professionalRoles: Record<ProductionProfessional['role'], string> = {
      cortador: "Cortador",
      acabador: "Acabador",
      montador: "Montador",
      entregador: "Entregador"
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Alocar Recursos para: ${order.id}`} className="max-w-md">
        <div className="space-y-2">
          {productionTeam.map(professional => (
            <label key={professional.id} className="flex items-center p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
                checked={selectedUserIds.includes(professional.id)}
                onChange={() => handleCheckboxChange(professional.id)}
              />
              <span className="ml-3 text-text-primary dark:text-slate-100">{professional.name} <span className="text-xs text-text-secondary dark:text-slate-400 capitalize">({professionalRoles[professional.role]})</span></span>
            </label>
          ))}
        </div>
        <div className="flex justify-end mt-6 space-x-3">
            <Button variant="ghost" onClick={onClose}>Cancelar</Button>
            <Button onClick={() => onSave(order.id, selectedUserIds)}>Salvar</Button>
        </div>
    </Modal>
  );
};

const SlabAllocationModal: FC<{
    isOpen: boolean;
    order: ServiceOrder;
    onClose: () => void;
    onSave: (serviceOrderId: string, slabId: string) => void;
}> = ({ isOpen, order, onClose, onSave }) => {
    const { stockItems, materials } = useData();
    const [selectedSlabId, setSelectedSlabId] = useState('');

    const requiredMaterialId = useMemo(() => {
        const materialItem = order.items.find(item => item.type === 'material');
        return materialItem?.materialId || null;
    }, [order]);
    
    const availableSlabs = useMemo(() => {
        if (!requiredMaterialId) return [];
        return stockItems.filter(item => 
            item.materialId === requiredMaterialId && item.status === 'disponivel'
        );
    }, [stockItems, requiredMaterialId]);
    
    const requiredMaterial = materials.find(m => m.id === requiredMaterialId);
    
    const handleSave = () => {
        if (selectedSlabId) {
            onSave(order.id, selectedSlabId);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Alocar Chapa para OS: ${order.id}`} className="max-w-3xl">
            {!requiredMaterial ? (
                <p>Esta OS não contém um item de material para alocação.</p>
            ) : (
                <>
                    <div className="mb-4 p-3 bg-slate-100 dark:bg-slate-800/50 rounded-lg">
                        <h4 className="font-semibold">Material Requerido: <span className="text-primary">{requiredMaterial.name}</span></h4>
                    </div>
                    <div className="max-h-80 overflow-y-auto space-y-2">
                        {availableSlabs.length > 0 ? availableSlabs.map(slab => (
                            <label key={slab.id} className={`flex items-center p-3 rounded-lg border-2 cursor-pointer transition-all ${selectedSlabId === slab.id ? 'border-primary bg-primary/10' : 'border-border dark:border-slate-700'}`}>
                                <input
                                    type="radio"
                                    name="slab-selection"
                                    className="h-4 w-4 text-primary focus:ring-primary"
                                    checked={selectedSlabId === slab.id}
                                    onChange={() => setSelectedSlabId(slab.id)}
                                />
                                <img src={slab.photoUrl} alt={slab.id} className="w-20 h-12 object-cover rounded mx-4" />
                                <div className="flex-1">
                                    <p className="font-bold font-mono">{slab.id}</p>
                                    <p className="text-sm text-text-secondary dark:text-slate-400">Dimensões: {slab.width}m x {slab.height}m</p>
                                </div>
                                <p className="text-sm text-text-secondary dark:text-slate-400">{slab.location}</p>
                            </label>
                        )) : (
                            <p className="text-center p-8 text-text-secondary dark:text-slate-400">Nenhuma chapa de {requiredMaterial.name} disponível no estoque.</p>
                        )}
                    </div>
                     <div className="flex justify-end mt-6 space-x-3">
                        <Button variant="ghost" onClick={onClose}>Cancelar</Button>
                        <Button onClick={handleSave} disabled={!selectedSlabId}>Alocar Chapa Selecionada</Button>
                    </div>
                </>
            )}
        </Modal>
    );
};

const ConfirmationModal: FC<{
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  message: string;
}> = ({ isOpen, onClose, onConfirm, message }) => {
    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Confirmar Ação">
            <p className="text-text-primary dark:text-slate-200">{message}</p>
            <div className="flex justify-end mt-6 space-x-3">
                <Button variant="ghost" onClick={onClose}>Cancelar</Button>
                <Button variant="primary" onClick={onConfirm}>Confirmar</Button>
            </div>
        </Modal>
    );
};

const KanbanCard: FC<{
  order: ServiceOrder;
  isDragging: boolean;
  onDragStart: (e: DragEvent<HTMLElement>, orderId: string) => void;
  onDragEnd: (e: DragEvent<HTMLElement>) => void;
  onAssign: (order: ServiceOrder) => void;
  onAllocate: (order: ServiceOrder) => void;
  onView: (order: ServiceOrder) => void;
}> = ({ order, isDragging, onDragStart, onDragEnd, onAssign, onAllocate, onView }) => {
  const assignedProfessionals = mockProductionProfessionals.filter(p => order.assignedToIds.includes(p.id));
  return (
    <Card
      draggable
      onDragStart={(e) => onDragStart(e, order.id)}
      onDragEnd={onDragEnd}
      onClick={() => onView(order)}
      className={`p-4 mt-4 shadow-sm border border-border dark:border-slate-700 cursor-pointer hover:shadow-lg hover:border-primary/50 transition-all duration-200 ${isDragging ? 'opacity-40 scale-95 bg-slate-200 dark:bg-slate-700' : ''}`}
    >
      <div className="flex justify-between items-center">
        <p className="font-bold text-sm font-mono">{order.id}</p>
        <p className="text-xs text-text-secondary dark:text-slate-400 font-mono">Pedido: {order.orderId}</p>
      </div>
      <p className="text-text-secondary dark:text-slate-400 text-sm mt-1">{order.clientName}</p>

      {order.allocatedSlabId && (
        <div className="mt-2 pt-2 border-t border-border/50 dark:border-slate-700/50 text-xs">
            <span className="text-slate-500 dark:text-slate-400">Chapa:</span> <span className="font-mono text-primary font-semibold">{order.allocatedSlabId}</span>
        </div>
      )}

      <div className="mt-3 pt-3 border-t border-border dark:border-slate-700">
        <div className="flex justify-between items-center">
          <div className="flex -space-x-2">
            {assignedProfessionals.length > 0 ? (
              assignedProfessionals.map(professional => (
                <div key={professional.id} title={professional.name} className="w-6 h-6 rounded-full bg-slate-600 text-white flex items-center justify-center text-xs font-bold ring-2 ring-white">
                  {professional.name.charAt(0)}
                </div>
              ))
            ) : (
              <span className="text-xs text-slate-400 dark:text-slate-500">Não alocado</span>
            )}
          </div>
           {order.status === 'cutting' && !order.allocatedSlabId && (
              <Button variant="secondary" size="sm" onClick={(e) => { e.stopPropagation(); onAllocate(order); }}>Alocar Chapa</Button>
           )}
           {order.status !== 'cutting' || order.allocatedSlabId ? (
                <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); onAssign(order); }}>Equipe</Button>
           ) : null}
        </div>
      </div>
    </Card>
  );
};

const ProductionPage: FC = () => {
  const { serviceOrders, setServiceOrders, allocateSlabToOrder } = useData();
  const [viewMode, setViewMode] = useState<'kanban' | 'timeline'>('kanban');
  const [modalOrder, setModalOrder] = useState<ServiceOrder | null>(null);
  const [allocatingOrder, setAllocatingOrder] = useState<ServiceOrder | null>(null);
  const [viewingOrder, setViewingOrder] = useState<ServiceOrder | null>(null);
  const [professionalFilter, setProfessionalFilter] = useState<string>('');
  const [orderIdFilter, setOrderIdFilter] = useState<string>('');
  const [confirmationData, setConfirmationData] = useState<{ orderId: string; newStatus: ProductionStatus } | null>(null);
  const [draggedItemId, setDraggedItemId] = useState<string | null>(null);
  const [draggedOverColumn, setDraggedOverColumn] = useState<ProductionStatus | null>(null);

  const productionTeam = useMemo(() => mockProductionProfessionals, []);

  const filteredServiceOrders = useMemo(() => {
    return serviceOrders.filter(order => {
      const professionalMatch = professionalFilter ? order.assignedToIds.includes(professionalFilter) : true;
      const orderIdMatch = orderIdFilter ? order.orderId.toLowerCase().includes(orderIdFilter.toLowerCase()) : true;
      return professionalMatch && orderIdMatch;
    });
  }, [serviceOrders, professionalFilter, orderIdFilter]);
  
  const handleDragStart = (e: DragEvent<HTMLElement>, orderId: string) => {
    e.dataTransfer.setData("orderId", orderId);
    setDraggedItemId(orderId);
  };

  const handleDragEnd = () => {
    setDraggedItemId(null);
  };
  
  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };
  
  const handleDragEnter = (e: DragEvent<HTMLDivElement>, status: ProductionStatus) => {
    e.preventDefault();
    setDraggedOverColumn(status);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDraggedOverColumn(null);
  };
  
  const handleDrop = (e: DragEvent<HTMLDivElement>, newStatus: ProductionStatus) => {
    e.preventDefault();
    setDraggedOverColumn(null);
    const orderId = e.dataTransfer.getData("orderId");
    const order = serviceOrders.find(o => o.id === orderId);
    if (order && order.status !== newStatus) {
        setConfirmationData({ orderId, newStatus });
    }
  };

  const handleAssignSave = (orderId: string, assignedToIds: string[]) => {
      setServiceOrders(prev => prev.map(o => o.id === orderId ? {...o, assignedToIds} : o));
      setModalOrder(null);
  }

  const handleConfirmStatusChange = () => {
    if (!confirmationData) return;
    const { orderId, newStatus } = confirmationData;
    setServiceOrders(prevOrders =>
      prevOrders.map(order =>
        order.id === orderId ? { ...order, status: newStatus } : order
      )
    );
    setConfirmationData(null);
  };

  const handleSlabAllocationSave = (serviceOrderId: string, slabId: string) => {
    allocateSlabToOrder(serviceOrderId, slabId);
    setAllocatingOrder(null);
  };

  const sortedTimelineOrders = useMemo(() => {
    return [...filteredServiceOrders].sort((a, b) => new Date(a.deliveryDate).getTime() - new Date(b.deliveryDate).getTime());
  }, [filteredServiceOrders]);

  const columnTitles = useMemo(() => 
    KANBAN_COLUMNS.reduce((acc, col) => {
        acc[col.id] = col.title;
        return acc;
    }, {} as Record<ProductionStatus, string>), []);


  return (
    <div>
      {modalOrder && (
        <ResourceAllocationModal 
            isOpen={!!modalOrder}
            order={modalOrder}
            productionTeam={productionTeam}
            onClose={() => setModalOrder(null)}
            onSave={handleAssignSave}
        />
      )}
      {allocatingOrder && (
        <SlabAllocationModal
            isOpen={!!allocatingOrder}
            order={allocatingOrder}
            onClose={() => setAllocatingOrder(null)}
            onSave={handleSlabAllocationSave}
        />
      )}
      {viewingOrder && (
        <ServiceOrderDetailModal
            isOpen={!!viewingOrder}
            order={viewingOrder}
            onClose={() => setViewingOrder(null)}
        />
      )}
      {confirmationData && (
          <ConfirmationModal
            isOpen={!!confirmationData}
            onClose={() => setConfirmationData(null)}
            onConfirm={handleConfirmStatusChange}
            message={`Tem certeza que deseja mover a OS ${confirmationData.orderId} para o status "${columnTitles[confirmationData.newStatus]}"?`}
          />
      )}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-text-primary dark:text-slate-100">Painel de Produção</h1>
          <p className="mt-2 text-text-secondary dark:text-slate-400">Acompanhe e gerencie as Ordens de Serviço (OS).</p>
        </div>
        <div className="flex items-center space-x-4">
             <div className="flex-shrink-0">
                <label htmlFor="order-id-filter" className="sr-only">Filtrar por ID do Pedido</label>
                <input
                    id="order-id-filter"
                    type="text"
                    placeholder="Filtrar por Pedido (PED-...)"
                    value={orderIdFilter}
                    onChange={(e) => setOrderIdFilter(e.target.value)}
                    className="block w-full pl-3 pr-10 py-2 text-base border-border bg-slate-50 dark:border-slate-600 dark:bg-slate-700 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm rounded-md h-[42px]"
                    aria-label="Filtrar por ID do Pedido"
                />
            </div>
             <div className="flex-shrink-0">
                <Select
                    id="professional-filter"
                    value={professionalFilter}
                    onChange={(e) => setProfessionalFilter(e.target.value)}
                    aria-label="Filtrar por profissional"
                >
                    <option value="">Todos os Profissionais</option>
                    {mockProductionProfessionals.map(prof => (
                        <option key={prof.id} value={prof.id}>{prof.name}</option>
                    ))}
                </Select>
            </div>
            <div className="flex bg-slate-200 dark:bg-slate-800 p-1 rounded-lg">
                <button onClick={() => setViewMode('kanban')} className={`px-4 py-1 text-sm font-semibold rounded-md ${viewMode === 'kanban' ? 'bg-surface dark:bg-dark shadow' : 'text-text-secondary dark:text-slate-400'}`}>Kanban</button>
                <button onClick={() => setViewMode('timeline')} className={`px-4 py-1 text-sm font-semibold rounded-md ${viewMode === 'timeline' ? 'bg-surface dark:bg-dark shadow' : 'text-text-secondary dark:text-slate-400'}`}>Timeline</button>
            </div>
        </div>
      </div>
      
      {viewMode === 'kanban' ? (
        <div className="grid grid-cols-5 gap-5 mt-6 h-[75vh]">
          {KANBAN_COLUMNS.map(column => (
            <div 
                key={column.id} 
                className={`bg-slate-100 dark:bg-slate-800/50 rounded-lg p-3 flex flex-col transition-colors duration-200 ${draggedOverColumn === column.id ? 'bg-primary/10 dark:bg-primary/20' : ''}`}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, column.id)}
                onDragEnter={(e) => handleDragEnter(e, column.id)}
                onDragLeave={handleDragLeave}
            >
              <div className={`flex items-center mb-4 border-l-4 pl-2 ${column.color.replace('bg-', 'border-')}`}>
                <div className={`w-3 h-3 rounded-full mr-2 ${column.color}`}></div>
                <h3 className="font-semibold text-text-primary dark:text-slate-100">{column.title}</h3>
              </div>
              <div className="flex-1 overflow-y-auto pr-1">
                {filteredServiceOrders
                  .filter(order => order.status === column.id)
                  .map(order => (
                    <KanbanCard
                        key={order.id}
                        order={order}
                        isDragging={draggedItemId === order.id}
                        onDragStart={handleDragStart}
                        onDragEnd={handleDragEnd}
                        onAssign={setModalOrder}
                        onAllocate={setAllocatingOrder}
                        onView={setViewingOrder} />
                  ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
         <Card className="mt-8 p-0">
          <CardContent>
            <h2 className="text-xl font-semibold text-text-primary dark:text-slate-100 mb-4">Timeline de Entregas</h2>
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead>
                        <tr className="border-b border-border dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
                            <th className="p-3">Data de Entrega</th>
                            <th className="p-3">OS ID</th>
                            <th className="p-3">Cliente</th>
                            <th className="p-3">Status</th>
                            <th className="p-3 text-right">Valor</th>
                        </tr>
                    </thead>
                    <tbody>
                        {sortedTimelineOrders.map(order => (
                            <tr key={order.id} onClick={() => setViewingOrder(order)} className="border-b border-border dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50 cursor-pointer">
                                <td className="p-3 font-semibold">{new Date(order.deliveryDate).toLocaleDateString()}</td>
                                <td className="p-3 font-mono text-sm">{order.id}</td>
                                <td className="p-3">{order.clientName}</td>
                                <td className="p-3">
                                    <StatusBadge status={order.status} statusMap={productionStatusMap} />
                                </td>
                                <td className="p-3 text-right">{order.total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                            </tr>
                        ))}
                         {sortedTimelineOrders.length === 0 && (
                            <tr>
                                <td colSpan={5} className="text-center p-4 text-text-secondary dark:text-slate-400">Nenhuma Ordem de Serviço encontrada com os filtros aplicados.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
          </CardContent>
         </Card>
      )}
    </div>
  );
};

export default ProductionPage;