import React, { useState, useMemo, FC, useEffect, useRef } from 'react';
import { useData } from '../context/DataContext';
import type { Equipment, MaintenanceLog, EquipmentStatus, EquipmentCategory, Page } from '../types';
import { mockProductionProfessionals, mockUsers } from '../data/mockData';
import Card, { CardContent, CardHeader, CardFooter } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import StatusBadge from '../components/ui/StatusBadge';
import type { StatusMap } from '../components/ui/StatusBadge';
import Textarea from '../components/ui/Textarea';
import QRCode from '../lib/qrcode-react';

const equipmentStatusMap: StatusMap<EquipmentStatus> = {
    operacional: { label: 'Operacional', variant: 'success' },
    em_manutencao: { label: 'Em Manutenção', variant: 'warning' },
    desativado: { label: 'Desativado', variant: 'default' },
};

const equipmentCategoryMap: Record<EquipmentCategory, string> = {
    maquina: 'Máquina',
    veiculo: 'Veículo',
};

const EquipmentForm: FC<{
    equipment: Equipment;
    onSave: (equipment: Equipment) => void;
    onCancel: () => void;
}> = ({ equipment: initialEquipment, onSave, onCancel }) => {
    const [equipment, setEquipment] = useState<Equipment>(initialEquipment);
    const [errors, setErrors] = useState<Record<string, string>>({});

    const handleChange = (field: keyof Equipment, value: any) => {
        setEquipment(prev => ({ ...prev, [field]: value }));
    };

    const validate = () => {
        const newErrors: Record<string, string> = {};
        if (!equipment.name.trim()) newErrors.name = "Nome é obrigatório.";
        if (!equipment.category) newErrors.category = "Categoria é obrigatória.";
        if (!equipment.serialNumber.trim()) newErrors.serialNumber = "Nº de série é obrigatório.";
        if (!equipment.purchaseDate) newErrors.purchaseDate = "Data da compra é obrigatória.";
        if (!equipment.warrantyEndDate) newErrors.warrantyEndDate = "Data da garantia é obrigatória.";
        if (!equipment.purchaseInvoiceNumber.trim()) newErrors.purchaseInvoiceNumber = "Nº da NF é obrigatório.";
        if (!equipment.supplierCnpj.trim()) newErrors.supplierCnpj = "CNPJ do Fornecedor é obrigatório.";
        if (!equipment.currentLocation.trim()) newErrors.currentLocation = "Localização é obrigatória.";
        
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };
    
    const handleSave = () => {
        if (validate()) {
            onSave(equipment);
        }
    };

    return (
        <Card>
            <CardHeader>{equipment.id.startsWith('new-') ? 'Novo Equipamento' : `Editando ${equipment.name}`}</CardHeader>
            <CardContent>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                    <Input label="Nome do Equipamento" value={equipment.name} onChange={e => handleChange('name', e.target.value)} error={errors.name} />
                    <Select label="Categoria" value={equipment.category} onChange={e => handleChange('category', e.target.value as EquipmentCategory)} error={errors.category}>
                        <option value="">Selecione...</option>
                        {Object.entries(equipmentCategoryMap).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
                    </Select>
                    
                    <Input label="Número de Série" value={equipment.serialNumber} onChange={e => handleChange('serialNumber', e.target.value)} error={errors.serialNumber} />
                    <Input label="Localização Atual" value={equipment.currentLocation} onChange={e => handleChange('currentLocation', e.target.value)} error={errors.currentLocation} />
                    
                    <Input label="Data da Compra" type="date" value={equipment.purchaseDate.split('T')[0]} onChange={e => handleChange('purchaseDate', e.target.value)} error={errors.purchaseDate} />
                    <Input label="Data Fim da Garantia" type="date" value={equipment.warrantyEndDate.split('T')[0]} onChange={e => handleChange('warrantyEndDate', e.target.value)} error={errors.warrantyEndDate} />
                    
                    <Input label="Nº da NF de Compra" value={equipment.purchaseInvoiceNumber} onChange={e => handleChange('purchaseInvoiceNumber', e.target.value)} error={errors.purchaseInvoiceNumber} />
                    <Input label="CNPJ do Fornecedor" value={equipment.supplierCnpj} onChange={e => handleChange('supplierCnpj', e.target.value)} error={errors.supplierCnpj} />
                    
                     <Select label="Responsável" value={equipment.assignedTo} onChange={e => handleChange('assignedTo', e.target.value)} error={errors.assignedTo}>
                        <option value="">Ninguém</option>
                        {mockProductionProfessionals.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </Select>

                     <Select label="Status" value={equipment.status} onChange={e => handleChange('status', e.target.value as EquipmentStatus)} error={errors.status}>
                        {Object.entries(equipmentStatusMap).map(([key, {label}]) => <option key={key} value={key}>{label}</option>)}
                    </Select>
                </div>
            </CardContent>
            <CardFooter className="flex justify-end space-x-4">
                <Button variant="ghost" onClick={onCancel}>Cancelar</Button>
                <Button onClick={handleSave}>Salvar</Button>
            </CardFooter>
        </Card>
    );
};

const MaintenanceFormModal: FC<{
    equipmentId: string;
    isOpen: boolean;
    onClose: () => void;
    onSave: (log: Omit<MaintenanceLog, 'id'>) => void;
}> = ({ equipmentId, isOpen, onClose, onSave }) => {
    const { currentUser } = useData();
    const [log, setLog] = useState<Partial<MaintenanceLog>>({
        maintenanceDate: new Date().toISOString().split('T')[0],
        performedBy: currentUser.id,
    });
    const [errors, setErrors] = useState<Record<string, string>>({});
    
    const handleChange = (field: keyof MaintenanceLog, value: any) => {
        setLog(prev => ({...prev, [field]: value }));
    };

    const validate = () => {
        const newErrors: Record<string, string> = {};
        if (!log.description?.trim()) newErrors.description = "Descrição é obrigatória.";
        if (!log.maintenanceDate) newErrors.maintenanceDate = "Data é obrigatória.";
        if ((log.cost || 0) < 0) newErrors.cost = "Custo não pode ser negativo.";
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };
    
    const handleSave = () => {
        if (validate()) {
            onSave({
                equipmentId,
                maintenanceDate: log.maintenanceDate!,
                description: log.description!,
                cost: log.cost || 0,
                performedBy: log.performedBy!,
                nextMaintenanceDate: log.nextMaintenanceDate
            });
        }
    };
    
    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Registrar Manutenção">
            <div className="space-y-4">
                <Textarea label="Descrição do Serviço" value={log.description || ''} onChange={e => handleChange('description', e.target.value)} error={errors.description} />
                <Input label="Custo (R$)" type="number" value={log.cost || ''} onChange={e => handleChange('cost', parseFloat(e.target.value) || 0)} error={errors.cost} />
                <Input label="Data da Manutenção" type="date" value={log.maintenanceDate?.split('T')[0] || ''} onChange={e => handleChange('maintenanceDate', e.target.value)} error={errors.maintenanceDate} />
                <Input label="Próxima Manutenção (Opcional)" type="date" value={log.nextMaintenanceDate?.split('T')[0] || ''} onChange={e => handleChange('nextMaintenanceDate', e.target.value)} />
                <Select label="Executado Por" value={log.performedBy || ''} onChange={e => handleChange('performedBy', e.target.value)}>
                    {mockUsers.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                </Select>
            </div>
             <div className="flex justify-end mt-6 space-x-3">
                <Button variant="ghost" onClick={onClose}>Cancelar</Button>
                <Button onClick={handleSave}>Salvar</Button>
            </div>
        </Modal>
    );
};

interface EquipmentPageProps {
    searchTarget: { page: Page; id: string } | null;
    clearSearchTarget: () => void;
}

const EquipmentDetailModal: FC<{ equipment: Equipment; isOpen: boolean; onClose: () => void }> = ({ equipment, isOpen, onClose }) => {
    const qrCodeRef = useRef<HTMLCanvasElement | null>(null);

    const handlePrint = () => {
        const canvas = qrCodeRef.current;
        if (!canvas) {
            console.warn('QR code ainda não foi renderizado para impressão.');
            return;
        }

        const dataUrl = canvas.toDataURL('image/png');
        if (!dataUrl) {
            console.warn('Não foi possível gerar a imagem do QR code.');
            return;
        }

        const printWindow = window.open('', '_blank');
        if (!printWindow) return;
        printWindow.document.write(`
            <!DOCTYPE html>
            <html><head><title>Etiqueta de Equipamento</title>
            <style>
                body { font-family: sans-serif; text-align: center; padding: 24px; color: #0f172a; }
                .qr-img { margin: 16px auto; width: 180px; height: 180px; }
                @media print { body { margin: 0; } }
            </style>
            </head><body>
            <h2>${equipment.name}</h2>
            <p>Serial: <strong>${equipment.serialNumber}</strong></p>
            <p>Categoria: <strong>${equipmentCategoryMap[equipment.category]}</strong></p>
            <img id="print-qr" src="${dataUrl}" alt="QR code do equipamento ${equipment.id}" class="qr-img" />
            <p>Localização: ${equipment.currentLocation}</p>
            <p>Status: ${equipmentStatusMap[equipment.status].label}</p>
            <script>
                const img = document.getElementById('print-qr');
                if (img && img.complete) {
                    window.focus();
                    window.print();
                } else if (img) {
                    img.addEventListener('load', () => {
                        window.focus();
                        window.print();
                    });
                }
            </script>
            </body></html>
        `);
        printWindow.document.close();
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Detalhes do Equipamento: ${equipment.name}`} className="max-w-4xl">
            <div className="flex flex-col md:flex-row gap-6">
                <div className="md:w-1/2">
                    <div className="bg-slate-100 dark:bg-dark p-4 rounded-lg text-center">
                        <h4 className="font-semibold mb-2">QR Code de Identificação</h4>
                        <div className="flex justify-center">
                            <QRCode
                                ref={qrCodeRef}
                                value={`marmoraria://asset/equipment/${equipment.id}`}
                                size={180}
                                includeMargin
                                aria-label={`QR code para ${equipment.name}`}
                                style={{ width: 180, height: 180 }}
                            />
                        </div>
                        <Button onClick={handlePrint} className="mt-4" size="sm">Imprimir Etiqueta</Button>
                    </div>
                </div>
                <div className="md:w-1/2 bg-slate-50 dark:bg-slate-700/50 p-6 rounded-lg">
                    <h3 className="text-2xl font-bold text-text-primary dark:text-slate-100 mb-1">{equipment.name}</h3>
                    <div className="mb-4"><StatusBadge status={equipment.status} statusMap={equipmentStatusMap} /></div>
                    
                    <div className="space-y-3 text-text-secondary dark:text-slate-300">
                        <p><strong>Número de Série:</strong> <span className="font-mono text-text-primary dark:text-slate-100">{equipment.serialNumber}</span></p>
                        <p><strong>Categoria:</strong> {equipmentCategoryMap[equipment.category]}</p>
                        <p><strong>Localização:</strong> {equipment.currentLocation}</p>
                        <p><strong>Responsável:</strong> {mockProductionProfessionals.find(p => p.id === equipment.assignedTo)?.name || 'Não atribuído'}</p>
                        <p><strong>Data de Compra:</strong> {new Date(equipment.purchaseDate).toLocaleDateString()}</p>
                        <p><strong>Fim da Garantia:</strong> {new Date(equipment.warrantyEndDate).toLocaleDateString()}</p>
                        <p><strong>NF de Compra:</strong> {equipment.purchaseInvoiceNumber}</p>
                        <p><strong>CNPJ Fornecedor:</strong> {equipment.supplierCnpj}</p>
                        {equipment.notes && <p><strong>Observações:</strong> {equipment.notes}</p>}
                    </div>
                </div>
            </div>
        </Modal>
    );
};

const EquipmentPage: FC<EquipmentPageProps> = ({ searchTarget, clearSearchTarget }) => {
    const { equipment, maintenanceLogs, saveEquipment, addMaintenanceLog } = useData();
    const [view, setView] = useState<'list' | 'form'>('list');
    const [editingEquipment, setEditingEquipment] = useState<Equipment | null>(null);
    const [viewingEquipment, setViewingEquipment] = useState<Equipment | null>(null);
    const [isMaintModalOpen, setIsMaintModalOpen] = useState(false);
    const [categoryFilter, setCategoryFilter] = useState<EquipmentCategory | 'all'>('all');
    
    const handleNew = () => {
        setEditingEquipment({
            id: 'new-eqp', name: '', serialNumber: '', category: 'maquina', status: 'operacional', assignedTo: '',
            currentLocation: '', purchaseDate: new Date().toISOString(),
            purchaseInvoiceNumber: '', supplierCnpj: '', warrantyEndDate: '', 
            createdAt: new Date().toISOString(), updatedAt: new Date().toISOString()
        });
        setView('form');
    };

    const handleEdit = (eq: Equipment) => {
        setEditingEquipment(JSON.parse(JSON.stringify(eq)));
        setView('form');
    };

    useEffect(() => {
        if (searchTarget && searchTarget.page === 'equipment') {
            const eq = equipment.find(e => e.id === searchTarget.id);
            if (eq) {
                // The maintenance log relatedEntityId is the equipmentId.
                // So this should work for both 'EQUIPMENT' and 'MAINTENANCE' activities.
                handleEdit(eq);
            }
            clearSearchTarget();
        }
    }, [searchTarget, equipment, clearSearchTarget]);

    const handleSave = (eq: Equipment) => {
        saveEquipment(eq);
        setView('list');
        setEditingEquipment(null);
    };

    const handleCancel = () => {
        setView('list');
        setEditingEquipment(null);
    };

    const handleAddMaintenance = (eq: Equipment) => {
        setEditingEquipment(eq); // To know which equipment we're adding to
        setIsMaintModalOpen(true);
    };

    const handleSaveMaintenance = (log: Omit<MaintenanceLog, 'id'>) => {
        addMaintenanceLog(log);
        setIsMaintModalOpen(false);
        setEditingEquipment(null);
    };

    const filteredEquipment = useMemo(() => {
        if (categoryFilter === 'all') return equipment;
        return equipment.filter(eq => eq.category === categoryFilter);
    }, [equipment, categoryFilter]);

    if (view === 'form' && editingEquipment) {
        return <EquipmentForm equipment={editingEquipment} onSave={handleSave} onCancel={handleCancel} />;
    }

    return (
        <div>
            {viewingEquipment && (
                <EquipmentDetailModal
                    equipment={viewingEquipment}
                    isOpen={!!viewingEquipment}
                    onClose={() => setViewingEquipment(null)}
                />
            )}
            {isMaintModalOpen && editingEquipment && (
                <MaintenanceFormModal 
                    isOpen={isMaintModalOpen}
                    onClose={() => { setIsMaintModalOpen(false); setEditingEquipment(null); }}
                    onSave={handleSaveMaintenance}
                    equipmentId={editingEquipment.id}
                />
            )}
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-3xl font-bold text-text-primary dark:text-slate-100">Controle de Equipamentos</h1>
                    <p className="mt-2 text-text-secondary dark:text-slate-400">Gerencie máquinas, ferramentas e seus históricos de manutenção.</p>
                </div>
                <Button onClick={handleNew}>Novo Equipamento</Button>
            </div>

            <Card className="mb-6">
                <CardContent>
                    <div className="flex items-center gap-4">
                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                            Filtrar por:
                        </label>
                        <div className="flex gap-2">
                            <Button 
                                size="sm" 
                                variant={categoryFilter === 'all' ? 'primary' : 'ghost'}
                                onClick={() => setCategoryFilter('all')}
                            >
                                Todos ({equipment.length})
                            </Button>
                            <Button 
                                size="sm" 
                                variant={categoryFilter === 'maquina' ? 'primary' : 'ghost'}
                                onClick={() => setCategoryFilter('maquina')}
                            >
                                🏭 Máquinas ({equipment.filter(eq => eq.category === 'maquina').length})
                            </Button>
                            <Button 
                                size="sm" 
                                variant={categoryFilter === 'veiculo' ? 'primary' : 'ghost'}
                                onClick={() => setCategoryFilter('veiculo')}
                            >
                                🚚 Veículos ({equipment.filter(eq => eq.category === 'veiculo').length})
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card className="p-0">
                <CardContent>
                     <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead><tr className="border-b border-border dark:border-slate-700"><th className="p-3">Equipamento</th><th className="p-3">Categoria</th><th className="p-3">Nº Série</th><th className="p-3">Localização</th><th className="p-3">Responsável</th><th className="p-3">Status</th><th className="p-3">Próx. Manutenção</th><th className="p-3 text-center">Ações</th></tr></thead>
                            <tbody>
                                {filteredEquipment.map(eq => {
                                    const logs = maintenanceLogs.filter(l => l.equipmentId === eq.id).sort((a,b) => new Date(b.maintenanceDate).getTime() - new Date(a.maintenanceDate).getTime());
                                    const nextMaint = logs[0]?.nextMaintenanceDate;
                                    return (
                                    <tr key={eq.id} className="border-b border-border dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50">
                                        <td className="p-3 font-semibold">{eq.name}</td>
                                        <td className="p-3">
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                                                {eq.category === 'maquina' ? '🏭' : '🚚'} {equipmentCategoryMap[eq.category]}
                                            </span>
                                        </td>
                                        <td className="p-3 font-mono text-sm">{eq.serialNumber}</td>
                                        <td className="p-3">{eq.currentLocation}</td>
                                        <td className="p-3">{mockProductionProfessionals.find(p => p.id === eq.assignedTo)?.name || '-'}</td>
                                        <td className="p-3"><StatusBadge status={eq.status} statusMap={equipmentStatusMap} /></td>
                                        <td className="p-3">{nextMaint ? new Date(nextMaint).toLocaleDateString() : '-'}</td>
                                        <td className="p-3 text-center space-x-2">
                                            <Button size="sm" variant="secondary" onClick={() => setViewingEquipment(eq)}>Detalhes/QR</Button>
                                            <Button size="sm" variant="secondary" onClick={() => handleAddMaintenance(eq)}>+ Manutenção</Button>
                                            <Button size="sm" variant="ghost" onClick={() => handleEdit(eq)}>Editar</Button>
                                        </td>
                                    </tr>
                                )})}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default EquipmentPage;