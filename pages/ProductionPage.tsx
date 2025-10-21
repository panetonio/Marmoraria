import React, { useState, useMemo, FC, DragEvent, ChangeEvent, useEffect } from 'react';
import { mockProductionProfessionals } from '../data/mockData';
import type { ServiceOrder, ProductionStatus, ProductionProfessional, StockItem, Priority, FinalizationType, User } from '../types';
import Card, { CardContent, CardHeader } from '../components/ui/Card';
import Modal from '../components/ui/Modal';
import Button from '../components/ui/Button';
import { useData } from '../context/DataContext';
import StatusBadge from '../components/ui/StatusBadge';
import { productionStatusMap } from '../config/statusMaps';
import Select from '../components/ui/Select';
import Textarea from '../components/ui/Textarea';
import Input from '../components/ui/Input';
import FinalizationTypeModal from '../components/FinalizationTypeModal';
import QrCodeScanner from '../components/QrCodeScanner';


const KANBAN_COLUMNS: { id: ProductionStatus; title: string; color: string }[] = [
  { id: 'cutting', title: 'Em Corte', color: 'bg-orange-800' },
  { id: 'finishing', title: 'Em Acabamento', color: 'bg-blue-700' },
  { id: 'awaiting_pickup', title: 'Aguardando Retirada', color: 'bg-yellow-600' },
];

const priorityConfig: Record<Priority, { label: string; className: string }> = {
    normal: { label: 'Normal', className: 'bg-slate-500 text-white' },
    alta: { label: 'Alta', className: 'bg-amber-500 text-white' },
    urgente: { label: 'Urgente', className: 'bg-red-600 text-white' },
};

const ServiceOrderDetailModal: FC<{
  isOpen: boolean;
  order: ServiceOrder;
  onClose: () => void;
  onAttachClick: (order: ServiceOrder) => void;
  onRemoveAttachment: (orderId: string) => void;
  onUpdatePriority: (orderId: string, priority: Priority) => void;
  onUpdateObservations: (orderId: string, observations: string) => void;
  onUpdateTeam: (orderId: string, assignedToIds: string[]) => void;
  allUsers: (ProductionProfessional | User)[];
}> = ({ isOpen, order, onClose, onAttachClick, onRemoveAttachment, onUpdatePriority, onUpdateObservations, onUpdateTeam, allUsers }) => {
  const [observations, setObservations] = useState(order.observations || '');
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>(order.assignedToIds);

  useEffect(() => {
    // Sync local state if the order prop changes (e.g., opening modal for a different order)
    setObservations(order.observations || '');
    setSelectedUserIds(order.assignedToIds);
  }, [order]);

  const handleCloseAndSave = () => {
    // Only save if there's a change
    if (observations !== (order.observations || '')) {
      onUpdateObservations(order.id, observations);
    }
    // Salvar mudanças na equipe se houver alteração
    if (JSON.stringify(selectedUserIds.sort()) !== JSON.stringify(order.assignedToIds.sort())) {
      onUpdateTeam(order.id, selectedUserIds);
    }
    onClose();
  };

  const handleToggleUser = (userId: string) => {
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

  const roleLabels: Record<string, string> = {
    admin: "Administrador",
    vendedor: "Vendedor",
    producao: "Produção",
    aux_administrativo: "Aux. Administrativo",
    cortador: "Cortador",
    acabador: "Acabador",
    montador: "Montador",
    entregador: "Entregador"
  };

  return (
    <Modal isOpen={isOpen} onClose={handleCloseAndSave} title={`Detalhes da OS: ${order.id}`} className="max-w-4xl">
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
                 <div className="col-span-2">
                    <Select
                        label="Prioridade"
                        id="priority-select"
                        value={order.priority || 'normal'}
                        onChange={(e) => onUpdatePriority(order.id, e.target.value as Priority)}
                    >
                        <option value="normal">Normal</option>
                        <option value="alta">Alta</option>
                        <option value="urgente">Urgente</option>
                    </Select>
                 </div>
                 {order.allocatedSlabId && (
                    <div className="col-span-2">
                        <h4 className="text-sm text-text-secondary dark:text-slate-400">Chapa Alocada</h4>
                        <p className="font-semibold font-mono text-primary">{order.allocatedSlabId}</p>
                    </div>
                )}
                <div className="col-span-2">
                    <Textarea
                        label="Observações Gerais"
                        id="os-observations"
                        rows={4}
                        value={observations}
                        onChange={(e) => setObservations(e.target.value)}
                        placeholder="Adicione notas importantes para a produção, como detalhes de acabamento, cuidados especiais, etc."
                    />
                </div>
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

          <Card className="p-0">
            <CardHeader>Anexos</CardHeader>
             <CardContent>
                {order.attachment ? (
                    <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg">
                        <div className="flex items-center space-x-3">
                             <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-text-secondary dark:text-slate-400" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                            </svg>
                            <p className="text-sm font-medium text-text-primary dark:text-slate-200">{order.attachment.name}</p>
                        </div>
                        <div className="space-x-2">
                            <a href={order.attachment.url} target="_blank" rel="noopener noreferrer">
                                <Button variant="ghost" size="sm">Ver</Button>
                            </a>
                            <Button variant="destructive" size="sm" onClick={() => onRemoveAttachment(order.id)}>Remover</Button>
                        </div>
                    </div>
                ) : (
                    <div className="text-center">
                        <p className="text-sm text-text-secondary dark:text-slate-400 mb-2">Nenhum arquivo anexado a esta OS.</p>
                        <Button variant="secondary" size="sm" onClick={() => onAttachClick(order)}>Anexar Arquivo</Button>
                    </div>
                )}
            </CardContent>
          </Card>

          <Card className="p-0">
            <CardHeader>Checklist de Saída</CardHeader>
            <CardContent>
              {order.departureChecklist && order.departureChecklist.length > 0 ? (
                <ul className="space-y-2">
                  {order.departureChecklist.map(item => (
                    <li
                      key={item.id}
                      className={`flex items-center gap-3 rounded-lg border p-2 text-sm ${item.checked
                        ? 'border-green-400 bg-green-50 dark:bg-green-900/20 text-text-primary dark:text-slate-100'
                        : 'border-border dark:border-slate-700 text-text-secondary dark:text-slate-300'}`}
                    >
                      <span className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold ${item.checked
                        ? 'bg-green-500 text-white'
                        : 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200'}`}
                      >
                        {item.checked ? '✔' : '•'}
                      </span>
                      <span className="flex-1">{item.text}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-text-secondary dark:text-slate-400">
                  Nenhum checklist associado a esta ordem de serviço.
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="md:col-span-1">
          <Card className="p-0">
            <CardHeader>Alocar Equipe</CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {allUsers.length > 0 ? allUsers.map(user => {
                  const role = 'role' in user ? user.role : '';
                  const roleLabel = roleLabels[role] || role;
                  const isSelected = selectedUserIds.includes(user.id);
                  
                  return (
                    <label 
                      key={user.id} 
                      className={`flex items-center p-2 rounded-lg cursor-pointer transition-colors ${
                        isSelected 
                          ? 'bg-primary/10 border-2 border-primary' 
                          : 'hover:bg-slate-100 dark:hover:bg-slate-700 border-2 border-transparent'
                      }`}
                    >
                      <input
                        type="checkbox"
                        className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
                        checked={isSelected}
                        onChange={() => handleToggleUser(user.id)}
                      />
                      <div className="ml-3 flex items-center flex-1">
                        <div className="w-8 h-8 rounded-full bg-slate-600 text-white flex items-center justify-center text-sm font-bold ring-2 ring-white mr-3">
                          {user.name.charAt(0)}
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold text-text-primary dark:text-slate-100 text-sm">
                            {user.name}
                          </p>
                          <p className="text-xs text-text-secondary dark:text-slate-400">
                            {roleLabel}
                          </p>
                        </div>
                      </div>
                    </label>
                  );
                }) : (
                  <p className="text-sm text-text-secondary dark:text-slate-400 text-center py-4">
                    Nenhum usuário disponível
                  </p>
                )}
              </div>
              <div className="mt-3 pt-3 border-t border-border dark:border-slate-700">
                <p className="text-xs text-text-secondary dark:text-slate-400">
                  {selectedUserIds.length} {selectedUserIds.length === 1 ? 'pessoa alocada' : 'pessoas alocadas'}
                </p>
              </div>
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
  productionTeam: (ProductionProfessional | User)[];
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

  const roleLabels: Record<string, string> = {
    admin: "Administrador",
    vendedor: "Vendedor",
    producao: "Produção",
    aux_administrativo: "Auxiliar Administrativo",
    cortador: "Cortador",
    acabador: "Acabador",
    montador: "Montador",
    entregador: "Entregador"
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Alocar Recursos para: ${order.id}`} className="max-w-md">
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {productionTeam.length > 0 ? productionTeam.map(member => {
            const role = 'role' in member ? member.role : '';
            const roleLabel = roleLabels[role] || role;
            
            return (
              <label key={member.id} className="flex items-center p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
                  checked={selectedUserIds.includes(member.id)}
                  onChange={() => handleCheckboxChange(member.id)}
                />
                <span className="ml-3 text-text-primary dark:text-slate-100">
                  {member.name} 
                  <span className="text-xs text-text-secondary dark:text-slate-400 ml-1">
                    ({roleLabel})
                  </span>
                </span>
              </label>
            );
          }) : (
            <p className="text-center text-text-secondary dark:text-slate-400 py-4">
              Nenhum usuário disponível para alocação
            </p>
          )}
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

const AttachmentModalOS: FC<{
    order: ServiceOrder;
    isOpen: boolean;
    onClose: () => void;
    onSave: (serviceOrderId: string, file: File) => void;
}> = ({ order, isOpen, onClose, onSave }) => {
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [error, setError] = useState<string>('');

    const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) { // 5MB limit
                setError('O arquivo é muito grande. O limite é de 5MB.');
                setSelectedFile(null);
            } else {
                setError('');
                setSelectedFile(file);
            }
        }
    };

    const handleSave = () => {
        if (selectedFile) {
            onSave(order.id, selectedFile);
        } else {
            setError('Por favor, selecione um arquivo.');
        }
    };

    useEffect(() => {
        if (!isOpen) {
            setSelectedFile(null);
            setError('');
        }
    }, [isOpen]);

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Anexar Arquivo para OS: ${order.id}`}>
            <div className="space-y-4">
                <p className="text-sm text-text-secondary dark:text-slate-400">
                    Anexe um projeto, foto ou documento relevante para a execução da OS.
                </p>
                <div>
                    <label htmlFor="attachment-file-os" className="block text-sm font-medium text-text-secondary dark:text-slate-400 mb-1">
                        Selecione o arquivo (PDF ou Imagem, máx 5MB)
                    </label>
                    <input 
                        id="attachment-file-os" 
                        type="file" 
                        accept="image/*,application/pdf"
                        onChange={handleFileChange}
                        className="block w-full text-sm text-text-secondary dark:text-slate-300 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
                    />
                </div>
                {selectedFile && (
                    <div className="p-2 bg-slate-100 dark:bg-slate-800/50 rounded-lg text-sm">
                        Arquivo selecionado: <span className="font-semibold">{selectedFile.name}</span>
                    </div>
                )}
                {error && <p className="text-error text-center text-sm">{error}</p>}
            </div>
            <div className="flex justify-end mt-6 space-x-3">
                <Button variant="ghost" onClick={onClose}>Cancelar</Button>
                <Button onClick={handleSave} disabled={!selectedFile}>Salvar Anexo</Button>
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
  onFinalize: (order: ServiceOrder) => void;
}> = ({ order, isDragging, onDragStart, onDragEnd, onAssign, onAllocate, onView, onFinalize }) => {
  const assignedProfessionals = mockProductionProfessionals.filter(p => order.assignedToIds.includes(p.id));
  const priority = order.priority || 'normal';

  return (
    <Card
      draggable
      onDragStart={(e) => onDragStart(e, order.id)}
      onDragEnd={onDragEnd}
      onClick={() => onView(order)}
      className={`p-4 mt-4 shadow-sm border border-border dark:border-slate-700 cursor-pointer hover:shadow-lg hover:border-primary/50 transition-all duration-200 relative ${isDragging ? 'opacity-40 scale-95 bg-slate-200 dark:bg-slate-700' : ''}`}
    >
      {priority !== 'normal' && (
        <div className={`absolute -top-2 -right-2 px-2 py-0.5 text-xs font-bold rounded-full shadow-lg ${priorityConfig[priority].className}`}>
            {priorityConfig[priority].label.toUpperCase()}
        </div>
      )}
      <div className="flex justify-between items-start">
        <div>
            <p className="font-bold text-sm font-mono">{order.id}</p>
            <p className="text-xs text-text-secondary dark:text-slate-400 font-mono">Pedido: {order.orderId}</p>
        </div>
        {order.attachment && (
            <div title={order.attachment.name} className="text-slate-400">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8 4a3 3 0 00-3 3v4a5 5 0 0010 0V7a3 3 0 10-6 0v4a3 3 0 106 0V7a1 1 0 10-2 0v4a1 1 0 102 0V7a3 3 0 00-3-3z" clipRule="evenodd" />
                </svg>
            </div>
        )}
      </div>
      <p className="text-text-secondary dark:text-slate-400 text-sm mt-1">{order.clientName}</p>

      {order.allocatedSlabId && (
        <div className="mt-2 pt-2 border-t border-border/50 dark:border-slate-700/50 text-xs">
            <span className="text-slate-500 dark:text-slate-400">Chapa:</span> <span className="font-mono text-primary font-semibold">{order.allocatedSlabId}</span>
        </div>
      )}

      <div className="mt-3 pt-3 border-t border-border dark:border-slate-700">
        <div className="flex justify-between items-center flex-wrap gap-2">
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
          <div className="flex items-center gap-2">
            {order.status === 'finishing' && (
                 <Button variant="accent" size="sm" onClick={(e) => { e.stopPropagation(); onFinalize(order); }}>Finalizar Produção</Button>
            )}
            {order.status === 'cutting' && !order.allocatedSlabId && (
                <Button variant="secondary" size="sm" onClick={(e) => { e.stopPropagation(); onAllocate(order); }}>Alocar Chapa</Button>
            )}
            {order.status !== 'cutting' || order.allocatedSlabId ? (
                <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); onAssign(order); }}>Equipe</Button>
            ) : null}
          </div>
        </div>
      </div>
    </Card>
  );
};

const ProductionPage: FC = () => {
  const { 
      serviceOrders, setServiceOrders, allocateSlabToOrder, addAttachmentToServiceOrder, 
      removeAttachmentFromServiceOrder, updateServiceOrderPriority, 
      updateServiceOrderObservations, setFinalizationType, users
  } = useData();
  const [viewMode, setViewMode] = useState<'kanban' | 'timeline'>('kanban');
  const [modalOrder, setModalOrder] = useState<ServiceOrder | null>(null);
  const [slabAllocatingOrder, setSlabAllocatingOrder] = useState<ServiceOrder | null>(null);
  const [attachmentModalOrder, setAttachmentModalOrder] = useState<ServiceOrder | null>(null);
  const [viewingOrder, setViewingOrder] = useState<ServiceOrder | null>(null);
  const [professionalFilter, setProfessionalFilter] = useState<string>('');
  const [orderIdFilter, setOrderIdFilter] = useState<string>('');
  const [finalizingOrder, setFinalizingOrder] = useState<ServiceOrder | null>(null);
  const [draggedItemId, setDraggedItemId] = useState<string | null>(null);

  // Usar usuários reais do backend
  const productionTeam = useMemo(() => {
    // Pegar usuários de produção ou todos se não tiver
    return users.length > 0 ? users : mockProductionProfessionals;
  }, [users]);

  const filteredServiceOrders = useMemo(() => {
    return serviceOrders.filter(order => {
      const professionalMatch = professionalFilter ? order.assignedToIds.includes(professionalFilter) : true;
      const orderIdMatch = orderIdFilter ? order.orderId.toLowerCase().includes(orderIdFilter.toLowerCase()) : true;
      const productionStatuses: ProductionStatus[] = ['cutting', 'finishing', 'awaiting_pickup'];
      return professionalMatch && orderIdMatch && productionStatuses.includes(order.status);
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
  
  const handleDrop = (e: DragEvent<HTMLDivElement>, newStatus: ProductionStatus) => {
    e.preventDefault();
    const orderId = e.dataTransfer.getData("orderId");
    const order = serviceOrders.find(o => o.id === orderId);
    if (order && order.status !== newStatus) {
        if(newStatus === 'awaiting_pickup') return; // Cannot drag here
        setServiceOrders(prevOrders =>
            prevOrders.map(o =>
                o.id === orderId ? { ...o, status: newStatus } : o
            )
        );
    }
  };

  const handleFinalizeConfirm = (type: FinalizationType) => {
    if (finalizingOrder) {
        setFinalizationType(finalizingOrder.id, type);
        setFinalizingOrder(null);
    }
  };

  const handleAssignSave = (orderId: string, assignedToIds: string[]) => {
      setServiceOrders(prev => prev.map(o => o.id === orderId ? {...o, assignedToIds} : o));
      setModalOrder(null);
  }

  const handleSlabAllocationSave = (serviceOrderId: string, slabId: string) => {
    allocateSlabToOrder(serviceOrderId, slabId);
    setSlabAllocatingOrder(null);
  };

  const handleSaveAttachment = (serviceOrderId: string, file: File) => {
    addAttachmentToServiceOrder(serviceOrderId, file);
    setAttachmentModalOrder(null);
  };

  const sortedTimelineOrders = useMemo(() => {
    return [...filteredServiceOrders].sort((a, b) => new Date(a.deliveryDate).getTime() - new Date(b.deliveryDate).getTime());
  }, [filteredServiceOrders]);

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
      {slabAllocatingOrder && (
        <SlabAllocationModal
            isOpen={!!slabAllocatingOrder}
            order={slabAllocatingOrder}
            onClose={() => setSlabAllocatingOrder(null)}
            onSave={handleSlabAllocationSave}
        />
      )}
      {attachmentModalOrder && (
        <AttachmentModalOS
            isOpen={!!attachmentModalOrder}
            order={attachmentModalOrder}
            onClose={() => setAttachmentModalOrder(null)}
            onSave={handleSaveAttachment}
        />
      )}
      {viewingOrder && (
        <ServiceOrderDetailModal
            isOpen={!!viewingOrder}
            order={viewingOrder}
            onClose={() => setViewingOrder(null)}
            onAttachClick={() => setAttachmentModalOrder(viewingOrder)}
            onRemoveAttachment={removeAttachmentFromServiceOrder}
            onUpdatePriority={updateServiceOrderPriority}
            onUpdateObservations={updateServiceOrderObservations}
            onUpdateTeam={(orderId, assignedToIds) => {
              setServiceOrders(prev => prev.map(o => o.id === orderId ? {...o, assignedToIds} : o));
            }}
            allUsers={productionTeam}
        />
      )}
      {finalizingOrder && (
          <FinalizationTypeModal
            isOpen={!!finalizingOrder}
            onClose={() => setFinalizingOrder(null)}
            onConfirm={handleFinalizeConfirm}
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
                    {productionTeam.map(member => (
                        <option key={member.id} value={member.id}>{member.name}</option>
                    ))}
                </Select>
            </div>
            <div className="flex bg-slate-200 dark:bg-slate-800 p-1 rounded-lg">
                <button onClick={() => setViewMode('kanban')} className={`px-4 py-1 text-sm font-semibold rounded-md ${viewMode === 'kanban' ? 'bg-surface dark:bg-dark shadow' : 'text-text-secondary dark:text-slate-400'}`}>Kanban</button>
                <button onClick={() => setViewMode('timeline')} className={`px-4 py-1 text-sm font-semibold rounded-md ${viewMode === 'timeline' ? 'bg-surface dark:bg-dark shadow' : 'text-text-secondary dark:text-slate-400'}`}>Timeline</button>
            </div>
        </div>
      </div>

      <div className="mt-6">
        <QrCodeScanner />
      </div>

      {viewMode === 'kanban' ? (
        <div className="grid grid-cols-3 gap-5 mt-6 h-[75vh]">
          {KANBAN_COLUMNS.map(column => (
            <div 
                key={column.id} 
                className={`bg-slate-100 dark:bg-slate-800/50 rounded-lg p-3 flex flex-col`}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, column.id)}
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
                        onAllocate={setSlabAllocatingOrder}
                        onView={setViewingOrder}
                        onFinalize={setFinalizingOrder}
                    />
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
                            <th className="p-3">Prioridade</th>
                            <th className="p-3">Status</th>
                            <th className="p-3 text-right">Valor</th>
                        </tr>
                    </thead>
                    <tbody>
                        {sortedTimelineOrders.map(order => {
                          const priority = order.priority || 'normal';
                          return (
                            <tr key={order.id} onClick={() => setViewingOrder(order)} className="border-b border-border dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50 cursor-pointer">
                                <td className="p-3 font-semibold">{new Date(order.deliveryDate).toLocaleDateString()}</td>
                                <td className="p-3 font-mono text-sm">{order.id}</td>
                                <td className="p-3">{order.clientName}</td>
                                <td className="p-3">
                                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${priorityConfig[priority].className}`}>
                                        {priorityConfig[priority].label}
                                    </span>
                                </td>
                                <td className="p-3">
                                    <StatusBadge status={order.status} statusMap={productionStatusMap} />
                                </td>
                                <td className="p-3 text-right">{order.total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                            </tr>
                          );
                        })}
                         {sortedTimelineOrders.length === 0 && (
                            <tr>
                                <td colSpan={6} className="text-center p-4 text-text-secondary dark:text-slate-400">Nenhuma Ordem de Serviço encontrada com os filtros aplicados.</td>
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