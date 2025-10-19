import React, { useState, useMemo, FC } from 'react';
import type { Equipment, MaintenanceLog, EquipmentStatus, EquipmentCategory, User, ProductionEmployee } from '../types';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import Card, { CardHeader, CardContent } from '../components/ui/Card';
import Modal from '../components/ui/Modal';
import Button from '../components/ui/Button';
import StatusBadge from '../components/ui/StatusBadge';
import { equipmentStatusMap, equipmentCategoryMap } from '../config/statusMaps';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import Textarea from '../components/ui/Textarea';

const WarrantyAlerts: FC<{ equipment: Equipment[] }> = ({ equipment }) => {
    const expiringSoon = useMemo(() => {
        const thirtyDaysFromNow = new Date();
        thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
        
        return equipment.filter(eq => {
            const warrantyEnd = new Date(eq.warrantyEndDate);
            return warrantyEnd <= thirtyDaysFromNow && warrantyEnd >= new Date();
        });
    }, [equipment]);

    if (expiringSoon.length === 0) return null;

    return (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-300 dark:border-yellow-500/30 p-4 rounded-lg mb-6">
            <div className="flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-yellow-600 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <h3 className="text-lg font-semibold text-yellow-800 dark:text-yellow-200">Garantias Próximas do Vencimento</h3>
            </div>
            <ul className="mt-2 list-disc list-inside text-yellow-700 dark:text-yellow-300 text-sm">
                {expiringSoon.map(eq => (
                    <li key={eq.id}>
                        <strong>{eq.name}:</strong> Garantia expira em {new Date(eq.warrantyEndDate).toLocaleDateString()}
                    </li>
                ))}
            </ul>
        </div>
    );
};

const EquipmentCard: FC<{ 
    equipment: Equipment, 
    onSelect: (equipment: Equipment) => void,
    assignedEmployee?: ProductionEmployee 
}> = ({ equipment, onSelect, assignedEmployee }) => {
    const isWarrantyExpiring = useMemo(() => {
        const thirtyDaysFromNow = new Date();
        thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
        const warrantyEnd = new Date(equipment.warrantyEndDate);
        return warrantyEnd <= thirtyDaysFromNow && warrantyEnd >= new Date();
    }, [equipment.warrantyEndDate]);

    return (
        <Card onClick={() => onSelect(equipment)} className="p-0 overflow-hidden cursor-pointer hover:shadow-xl transition-shadow duration-300 flex flex-col">
            <div className="p-4 flex flex-col flex-grow">
                <div className="flex justify-between items-start mb-2">
                    <h4 className="font-bold text-text-primary dark:text-slate-100">{equipment.name}</h4>
                    <StatusBadge status={equipment.status} statusMap={equipmentStatusMap} />
                </div>
                <p className="font-mono text-xs text-text-secondary dark:text-slate-400 mb-2">S/N: {equipment.serialNumber}</p>
                <div className="mb-2">
                    <StatusBadge status={equipment.category} statusMap={equipmentCategoryMap} />
                </div>
                
                <div className="space-y-1 text-sm text-gray-700 dark:text-slate-300">
                    <p><strong>Data de Compra:</strong> {new Date(equipment.purchaseDate).toLocaleDateString()}</p>
                    <p className={isWarrantyExpiring ? "text-yellow-600 dark:text-yellow-400 font-semibold" : ""}>
                        <strong>Garantia até:</strong> {new Date(equipment.warrantyEndDate).toLocaleDateString()}
                    </p>
                    {assignedEmployee && (
                        <p><strong>Responsável:</strong> {assignedEmployee.name} ({assignedEmployee.role})</p>
                    )}
                </div>
            </div>
        </Card>
    );
};

const EquipmentDetailModal: FC<{ 
    equipment: Equipment, 
    isOpen: boolean, 
    onClose: () => void,
    maintenanceLogs: MaintenanceLog[],
    productionEmployees: ProductionEmployee[],
    onAddMaintenance: (maintenance: MaintenanceLog) => void
}> = ({ equipment, isOpen, onClose, maintenanceLogs, productionEmployees, onAddMaintenance }) => {
    const [showMaintenanceForm, setShowMaintenanceForm] = useState(false);
    const [maintenanceForm, setMaintenanceForm] = useState({
        description: '',
        cost: '',
        performedBy: '',
        companyCnpj: '',
        invoiceNumber: '',
        nextMaintenanceDate: '',
        maintenanceWarrantyDate: '',
        warrantyClaim: false
    });

    const equipmentMaintenanceLogs = useMemo(() => {
        return maintenanceLogs
            .filter(log => log.equipmentId === equipment.id)
            .sort((a, b) => new Date(b.maintenanceDate).getTime() - new Date(a.maintenanceDate).getTime());
    }, [maintenanceLogs, equipment.id]);

    const assignedEmployee = productionEmployees.find(emp => emp.id === equipment.assignedTo);

    const handleAddMaintenance = () => {
        if (!maintenanceForm.description || !maintenanceForm.performedBy || !maintenanceForm.companyCnpj || !maintenanceForm.invoiceNumber) return;

        const newMaintenance: MaintenanceLog = {
            id: `maintenance-${Date.now()}`,
            equipmentId: equipment.id,
            maintenanceDate: new Date().toISOString(),
            description: maintenanceForm.description,
            cost: parseFloat(maintenanceForm.cost) || 0,
            performedBy: maintenanceForm.performedBy,
            companyCnpj: maintenanceForm.companyCnpj,
            invoiceNumber: maintenanceForm.invoiceNumber,
            nextMaintenanceDate: maintenanceForm.nextMaintenanceDate || undefined,
            maintenanceWarrantyDate: maintenanceForm.maintenanceWarrantyDate || undefined,
            warrantyClaim: maintenanceForm.warrantyClaim,
            createdAt: new Date().toISOString()
        };

        onAddMaintenance(newMaintenance);
        setMaintenanceForm({
            description: '',
            cost: '',
            performedBy: '',
            companyCnpj: '',
            invoiceNumber: '',
            nextMaintenanceDate: '',
            maintenanceWarrantyDate: '',
            warrantyClaim: false
        });
        setShowMaintenanceForm(false);
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Detalhes do Equipamento: ${equipment.name}`} className="max-w-6xl">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                    <Card>
                        <CardHeader>
                            <h3 className="text-xl font-semibold">Informações do Equipamento</h3>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                <div className="flex justify-between items-center">
                                    <span className="font-semibold">Nome:</span>
                                    <span>{equipment.name}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="font-semibold">Número de Série:</span>
                                    <span className="font-mono">{equipment.serialNumber}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="font-semibold">Categoria:</span>
                                    <StatusBadge status={equipment.category} statusMap={equipmentCategoryMap} />
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="font-semibold">Status:</span>
                                    <StatusBadge status={equipment.status} statusMap={equipmentStatusMap} />
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="font-semibold">Data de Compra:</span>
                                    <span>{new Date(equipment.purchaseDate).toLocaleDateString()}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="font-semibold">Garantia até:</span>
                                    <span>{new Date(equipment.warrantyEndDate).toLocaleDateString()}</span>
                                </div>
                                {assignedEmployee && (
                                    <div className="flex justify-between items-center">
                                        <span className="font-semibold">Responsável:</span>
                                        <span>{assignedEmployee.name} ({assignedEmployee.role})</span>
                                    </div>
                                )}
                                {equipment.purchaseInvoiceId && (
                                    <div className="flex justify-between items-center">
                                        <span className="font-semibold">Nota Fiscal:</span>
                                        <span className="font-mono">{equipment.purchaseInvoiceId}</span>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div>
                    <Card>
                        <CardHeader>
                            <div className="flex justify-between items-center">
                                <h3 className="text-xl font-semibold">Histórico de Manutenções</h3>
                                <Button 
                                    size="sm" 
                                    onClick={() => setShowMaintenanceForm(true)}
                                >
                                    + Nova Manutenção
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent>
                            {showMaintenanceForm && (
                                <div className="mb-6 p-4 border border-border dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                                    <h4 className="font-semibold mb-3">Registrar Nova Manutenção</h4>
                                    <div className="space-y-3">
                                        <Textarea
                                            label="Descrição da Manutenção"
                                            value={maintenanceForm.description}
                                            onChange={(e) => setMaintenanceForm(prev => ({ ...prev, description: e.target.value }))}
                                            rows={3}
                                        />
                                        <div className="grid grid-cols-2 gap-3">
                                            <Input
                                                label="Custo (R$)"
                                                type="number"
                                                value={maintenanceForm.cost}
                                                onChange={(e) => setMaintenanceForm(prev => ({ ...prev, cost: e.target.value }))}
                                            />
                                            <Input
                                                label="Empresa Terceirizada"
                                                value={maintenanceForm.performedBy}
                                                onChange={(e) => setMaintenanceForm(prev => ({ ...prev, performedBy: e.target.value }))}
                                                placeholder="Nome da empresa"
                                            />
                                        </div>
                                        <div className="grid grid-cols-2 gap-3">
                                            <Input
                                                label="CNPJ da Empresa"
                                                value={maintenanceForm.companyCnpj}
                                                onChange={(e) => setMaintenanceForm(prev => ({ ...prev, companyCnpj: e.target.value }))}
                                                placeholder="00.000.000/0000-00"
                                            />
                                            <Input
                                                label="Número da NF"
                                                value={maintenanceForm.invoiceNumber}
                                                onChange={(e) => setMaintenanceForm(prev => ({ ...prev, invoiceNumber: e.target.value }))}
                                                placeholder="NF-MAN-2024-XXX"
                                            />
                                        </div>
                                        <div className="grid grid-cols-2 gap-3">
                                            <Input
                                                label="Próxima Manutenção (opcional)"
                                                type="date"
                                                value={maintenanceForm.nextMaintenanceDate}
                                                onChange={(e) => setMaintenanceForm(prev => ({ ...prev, nextMaintenanceDate: e.target.value }))}
                                            />
                                            <Input
                                                label="Garantia da Manutenção (opcional)"
                                                type="date"
                                                value={maintenanceForm.maintenanceWarrantyDate}
                                                onChange={(e) => setMaintenanceForm(prev => ({ ...prev, maintenanceWarrantyDate: e.target.value }))}
                                            />
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <input
                                                type="checkbox"
                                                id="warranty-claim"
                                                checked={maintenanceForm.warrantyClaim}
                                                onChange={(e) => setMaintenanceForm(prev => ({ ...prev, warrantyClaim: e.target.checked }))}
                                                className="rounded"
                                            />
                                            <label htmlFor="warranty-claim" className="text-sm">Coberto pela garantia do equipamento</label>
                                        </div>
                                        <div className="flex space-x-2">
                                            <Button size="sm" onClick={handleAddMaintenance}>
                                                Salvar
                                            </Button>
                                            <Button size="sm" variant="ghost" onClick={() => setShowMaintenanceForm(false)}>
                                                Cancelar
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="space-y-3 max-h-96 overflow-y-auto">
                                {equipmentMaintenanceLogs.map(log => {
                                    return (
                                        <div key={log.id} className="p-3 border border-border dark:border-slate-700 rounded-lg">
                                            <div className="flex justify-between items-start mb-2">
                                                <span className="font-semibold text-sm">
                                                    {new Date(log.maintenanceDate).toLocaleDateString()}
                                                </span>
                                                {log.warrantyClaim && (
                                                    <span className="text-xs bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 px-2 py-1 rounded">
                                                        Garantia
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-sm text-gray-700 dark:text-slate-300 mb-2">{log.description}</p>
                                            <div className="text-xs text-gray-500 dark:text-slate-400 space-y-1">
                                                <p><strong>Custo:</strong> R$ {log.cost.toFixed(2)}</p>
                                                <p><strong>Empresa:</strong> {log.performedBy}</p>
                                                <p><strong>CNPJ:</strong> {log.companyCnpj}</p>
                                                <p><strong>NF:</strong> {log.invoiceNumber}</p>
                                                {log.nextMaintenanceDate && (
                                                    <p><strong>Próxima manutenção:</strong> {new Date(log.nextMaintenanceDate).toLocaleDateString()}</p>
                                                )}
                                                {log.maintenanceWarrantyDate && (
                                                    <p><strong>Garantia da manutenção:</strong> {new Date(log.maintenanceWarrantyDate).toLocaleDateString()}</p>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                                {equipmentMaintenanceLogs.length === 0 && (
                                    <p className="text-center text-gray-500 dark:text-slate-400 py-4">
                                        Nenhuma manutenção registrada
                                    </p>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </Modal>
    );
};

const EquipmentForm: FC<{
    equipment: Equipment;
    onSave: (equipment: Equipment) => void;
    onCancel: () => void;
    productionEmployees: ProductionEmployee[];
    invoices: any[];
}> = ({ equipment: initialEquipment, onSave, onCancel, productionEmployees, invoices }) => {
    const [equipment, setEquipment] = useState<Equipment>(initialEquipment);
    const [errors, setErrors] = useState<Record<string, string>>({});

    const validate = () => {
        const newErrors: Record<string, string> = {};
        if (!equipment.name.trim()) newErrors.name = "Nome do equipamento é obrigatório.";
        if (!equipment.serialNumber.trim()) newErrors.serialNumber = "Número de série é obrigatório.";
        if (!equipment.purchaseDate) newErrors.purchaseDate = "Data de compra é obrigatória.";
        if (!equipment.warrantyEndDate) newErrors.warrantyEndDate = "Data de fim da garantia é obrigatória.";
        if (!equipment.assignedTo) newErrors.assignedTo = "Profissional responsável é obrigatório.";
        
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
            <CardHeader>
                <h2 className="text-2xl font-semibold">
                    {equipment.id.startsWith('new-') ? 'Novo Equipamento' : `Editando ${equipment.name}`}
                </h2>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input
                            label="Nome do Equipamento"
                            value={equipment.name}
                            onChange={(e) => setEquipment({...equipment, name: e.target.value})}
                            error={errors.name}
                        />
                        <Input
                            label="Número de Série"
                            value={equipment.serialNumber}
                            onChange={(e) => setEquipment({...equipment, serialNumber: e.target.value})}
                            error={errors.serialNumber}
                        />
                        <Select
                            label="Categoria"
                            value={equipment.category}
                            onChange={(e) => setEquipment({...equipment, category: e.target.value as EquipmentCategory})}
                        >
                            <option value="maquina">Máquina</option>
                            <option value="veiculo">Veículo</option>
                        </Select>
                        <Input
                            label="Data de Compra"
                            type="date"
                            value={equipment.purchaseDate}
                            onChange={(e) => setEquipment({...equipment, purchaseDate: e.target.value})}
                            error={errors.purchaseDate}
                        />
                        <Input
                            label="Garantia até"
                            type="date"
                            value={equipment.warrantyEndDate}
                            onChange={(e) => setEquipment({...equipment, warrantyEndDate: e.target.value})}
                            error={errors.warrantyEndDate}
                        />
                        <Select
                            label="Status"
                            value={equipment.status}
                            onChange={(e) => setEquipment({...equipment, status: e.target.value as EquipmentStatus})}
                        >
                            <option value="operacional">Operacional</option>
                            <option value="em_manutencao">Em Manutenção</option>
                            <option value="desativado">Desativado</option>
                        </Select>
                        <Select
                            label="Responsável"
                            value={equipment.assignedTo}
                            onChange={(e) => setEquipment({...equipment, assignedTo: e.target.value})}
                            error={errors.assignedTo}
                        >
                            <option value="">Selecione um funcionário</option>
                            {productionEmployees.filter(emp => emp.isActive).map(employee => (
                                <option key={employee.id} value={employee.id}>
                                    {employee.name} - {employee.role}
                                </option>
                            ))}
                        </Select>
                        <Select
                            label="Nota Fiscal de Compra"
                            value={equipment.purchaseInvoiceId || ''}
                            onChange={(e) => setEquipment({...equipment, purchaseInvoiceId: e.target.value || undefined})}
                        >
                            <option value="">Nenhuma</option>
                            {invoices.map(invoice => (
                                <option key={invoice.id} value={invoice.id}>{invoice.id} - {invoice.clientName}</option>
                            ))}
                        </Select>
                    </div>
                </div>
            </CardContent>
            <div className="flex justify-end space-x-4 p-6 border-t border-border dark:border-slate-700">
                <Button variant="ghost" onClick={onCancel}>Cancelar</Button>
                <Button onClick={handleSave}>Salvar Equipamento</Button>
            </div>
        </Card>
    );
};

const EquipmentPage: React.FC = () => {
    const { 
        equipment, 
        maintenanceLogs, 
        productionEmployees,
        invoices,
        addEquipment, 
        updateEquipment, 
        deleteEquipment,
        addMaintenanceLog 
    } = useData();
    const { currentUser, hasAccessToPage } = useAuth();
    
    const [currentView, setCurrentView] = useState<'list' | 'form'>('list');
    const [selectedEquipment, setSelectedEquipment] = useState<Equipment | null>(null);
    const [statusFilter, setStatusFilter] = useState<string>('');
    const [categoryFilter, setCategoryFilter] = useState<string>('');

    const handleNew = () => {
        setSelectedEquipment({
            id: `new-${Date.now()}`,
            name: '',
            serialNumber: '',
            category: 'maquina', // Categoria padrão
            purchaseDate: '',
            warrantyEndDate: '',
            assignedTo: '', // Será obrigatório selecionar
            status: 'operacional',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        });
        setCurrentView('form');
    };

    const handleEdit = (equipment: Equipment) => {
        setSelectedEquipment(equipment);
        setCurrentView('form');
    };

    const handleSave = (equipmentToSave: Equipment) => {
        if (equipmentToSave.id.startsWith('new-')) {
            addEquipment(equipmentToSave);
        } else {
            updateEquipment(equipmentToSave);
        }
        setCurrentView('list');
        setSelectedEquipment(null);
    };

    const handleCancel = () => {
        setCurrentView('list');
        setSelectedEquipment(null);
    };

    const filteredEquipment = useMemo(() => {
        return equipment.filter(eq => {
            const statusMatch = statusFilter ? eq.status === statusFilter : true;
            const categoryMatch = categoryFilter ? eq.category === categoryFilter : true;
            return statusMatch && categoryMatch;
        }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }, [equipment, statusFilter, categoryFilter]);

    return (
        <div>
            {currentView === 'list' && (
                <>
                    <div className="flex justify-between items-center mb-4">
                        <div>
                            <h1 className="text-3xl font-bold text-text-primary dark:text-slate-100">Gestão de Equipamentos</h1>
                            <p className="mt-2 text-text-secondary dark:text-slate-400">Gerencie o inventário de equipamentos, manutenções e garantias.</p>
                        </div>
                        <Button onClick={handleNew}>+ Adicionar Equipamento</Button>
                    </div>

                    <WarrantyAlerts equipment={equipment} />

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                        <Card className="p-4">
                            <div className="flex items-center space-x-4">
                                <label htmlFor="status-filter" className="font-semibold text-text-primary dark:text-slate-100">Status:</label>
                                <Select
                                    id="status-filter"
                                    value={statusFilter}
                                    onChange={(e) => setStatusFilter(e.target.value)}
                                    className="w-full"
                                >
                                    <option value="">Todos</option>
                                    <option value="operacional">Operacional</option>
                                    <option value="em_manutencao">Em Manutenção</option>
                                    <option value="desativado">Desativado</option>
                                </Select>
                            </div>
                        </Card>
                        <Card className="p-4">
                            <div className="flex items-center space-x-4">
                                <label htmlFor="category-filter" className="font-semibold text-text-primary dark:text-slate-100">Categoria:</label>
                                <Select
                                    id="category-filter"
                                    value={categoryFilter}
                                    onChange={(e) => setCategoryFilter(e.target.value)}
                                    className="w-full"
                                >
                                    <option value="">Todas</option>
                                    <option value="maquina">Máquinas</option>
                                    <option value="veiculo">Veículos</option>
                                </Select>
                            </div>
                        </Card>
                        <Card className="p-4">
                            <div className="text-center">
                                <div className="text-2xl font-bold text-text-primary dark:text-slate-100">{equipment.length}</div>
                                <div className="text-sm text-text-secondary dark:text-slate-400">Total de Equipamentos</div>
                            </div>
                        </Card>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {filteredEquipment.map(eq => {
                            const assignedEmployee = productionEmployees.find(emp => emp.id === eq.assignedTo);
                            return (
                                <EquipmentCard 
                                    key={eq.id} 
                                    equipment={eq} 
                                    onSelect={setSelectedEquipment}
                                    assignedEmployee={assignedEmployee}
                                />
                            );
                        })}
                        {filteredEquipment.length === 0 && (
                            <div className="col-span-full text-center p-10 bg-surface dark:bg-dark rounded-lg shadow-md">
                                <p className="text-text-secondary dark:text-slate-400">Nenhum equipamento encontrado com os filtros aplicados.</p>
                            </div>
                        )}
                    </div>

                    {selectedEquipment && (
                        <EquipmentDetailModal
                            equipment={selectedEquipment}
                            isOpen={!!selectedEquipment}
                            onClose={() => setSelectedEquipment(null)}
                            maintenanceLogs={maintenanceLogs}
                            productionEmployees={productionEmployees}
                            onAddMaintenance={addMaintenanceLog}
                        />
                    )}
                </>
            )}

            {currentView === 'form' && selectedEquipment && (
                <EquipmentForm
                    equipment={selectedEquipment}
                    onSave={handleSave}
                    onCancel={handleCancel}
                    productionEmployees={productionEmployees}
                    invoices={invoices}
                />
            )}
        </div>
    );
};

export default EquipmentPage;
