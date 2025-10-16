import React, { useState, useMemo } from 'react';
import type { Supplier } from '../types';
import Card, { CardContent, CardHeader, CardFooter } from '../components/ui/Card';
import Button from '../components/ui/Button';
import { useData } from '../context/DataContext';
import { generateWhatsAppLink } from '../../utils/helpers';
import CreateReceiptModal from '../components/CreateReceiptModal';
import Input from '../components/ui/Input';
import Textarea from '../components/ui/Textarea';


const SupplierList: React.FC<{
    suppliers: Supplier[];
    onNew: () => void;
    onEdit: (supplier: Supplier) => void;
    onGenerateReceipt: (supplier: Supplier) => void;
}> = ({ suppliers, onNew, onEdit, onGenerateReceipt }) => {
    return (
        <Card className="p-0">
            <CardHeader>
                <div className="flex justify-between items-center">
                    <h2 className="text-2xl font-semibold text-text-primary dark:text-slate-100">Fornecedores</h2>
                    <Button onClick={onNew}>Novo Fornecedor</Button>
                </div>
            </CardHeader>
            <CardContent>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b border-border dark:border-slate-700">
                                <th className="p-3">Nome</th>
                                <th className="p-3">Contato</th>
                                <th className="p-3">Telefone</th>
                                <th className="p-3">Email</th>
                                <th className="p-3">CPF/CNPJ</th>
                                <th className="p-3">Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {suppliers.map(supplier => (
                                <tr key={supplier.id} className="border-b border-border dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50">
                                    <td className="p-3 font-semibold">{supplier.name}</td>
                                    <td className="p-3">{supplier.contactPerson}</td>
                                    <td className="p-3">{supplier.phone}</td>
                                    <td className="p-3">{supplier.email}</td>
                                    <td className="p-3 font-mono text-sm">{supplier.cpfCnpj}</td>
                                    <td className="p-3 space-x-4">
                                        <button onClick={() => onEdit(supplier)} className="text-primary hover:underline font-semibold text-sm">Editar</button>
                                        <button onClick={() => onGenerateReceipt(supplier)} className="text-green-600 dark:text-green-500 hover:underline font-semibold text-sm">Gerar Recibo</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </CardContent>
        </Card>
    );
};

const SupplierForm: React.FC<{
    supplier: Supplier;
    onSave: (supplier: Supplier) => void;
    onCancel: () => void;
}> = ({ supplier: initialSupplier, onSave, onCancel }) => {
    const [supplier, setSupplier] = useState<Supplier>(initialSupplier);
    const [errors, setErrors] = useState<Record<string, string>>({});

    const validate = () => {
        const newErrors: Record<string, string> = {};
        if (!supplier.name.trim()) newErrors.name = "Nome da empresa é obrigatório.";
        if (!supplier.contactPerson.trim()) newErrors.contactPerson = "Nome do contato é obrigatório.";
        if (!supplier.phone.trim()) newErrors.phone = "Telefone é obrigatório.";
        if (!supplier.cpfCnpj.trim()) newErrors.cpfCnpj = "CPF/CNPJ é obrigatório.";
        if (!supplier.address.trim()) newErrors.address = "Endereço é obrigatório.";
        if (!supplier.email.trim()) {
            newErrors.email = "Email é obrigatório.";
        } else if (!/\S+@\S+\.\S+/.test(supplier.email)) {
            newErrors.email = "Formato de email inválido.";
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSave = () => {
        if (validate()) {
            onSave(supplier);
        }
    };
    
    const isFormValid = useMemo(() => {
        return supplier.name.trim() &&
               supplier.contactPerson.trim() &&
               supplier.phone.trim() &&
               supplier.address.trim() &&
               supplier.cpfCnpj.trim() &&
               supplier.email.trim() &&
               /\S+@\S+\.\S+/.test(supplier.email);
    }, [supplier]);


    return (
        <Card>
            <CardHeader>{supplier.id.startsWith('new-') ? 'Novo Fornecedor' : `Editando ${supplier.name}`}</CardHeader>
            <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <Input
                        placeholder="Nome da Empresa"
                        value={supplier.name}
                        onChange={e => setSupplier({...supplier, name: e.target.value})}
                        error={errors.name}
                    />
                    <Input
                        placeholder="Nome do Contato"
                        value={supplier.contactPerson}
                        onChange={e => setSupplier({...supplier, contactPerson: e.target.value})}
                        error={errors.contactPerson}
                    />
                    <Input
                        placeholder="Telefone"
                        value={supplier.phone}
                        onChange={e => setSupplier({...supplier, phone: e.target.value})}
                        error={errors.phone}
                        endAdornment={supplier.phone && (
                            <a href={generateWhatsAppLink(supplier.phone)} target="_blank" rel="noopener noreferrer" title="Abrir no WhatsApp" className="text-green-500 hover:text-green-700 pointer-events-auto">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.487 5.235 3.487 8.413 0 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 4.315 1.919 6.066l-1.472 5.378 5.441-1.421zM11.999 4.521c.212 0 .416.03.612.088.225-.045.458-.068.696-.068h.001c.138 0 .274.01.409.029.164.023.324.057.48.102.18.053.352.12.518.2.148.071.29.155.425.25.158.114.306.242.441.381.119.123.23.255.335.395.122.161.233.332.336.512.092.158.175.324.248.499.063.149.117.302.162.458.042.145.074.293.097.444.02.127.031.255.031.385v.001c0 .093-.005.185-.014.276-.025.245-.084.482-.175.709-.131.325-.316.626-.55.895-.252.287-.556.533-.898.729-.281.16-.583.284-.901.372-.258.072-.524.12-.796.143-.332.028-.671.028-.999 0-.272-.023-.538-.071-.796-.143-.318-.088-.62-.212-.901-.372-.342-.196-.646-.442-.898-.729-.234-.269-.419-.57-.55-.895-.091-.227-.15-.464-.175-.709-.009-.091-.014-.183-.014-.276v-.001c0-.13.011-.258.031-.385.023-.151.055-.299.097-.444.045-.156.099-.309.162-.458.073-.175.156-.341.248-.499.103-.18.214-.351.336-.512.105-.14.216-.272.335.395.135-.139.283-.267.441.381.135-.095.277-.179.425-.25.166-.08.338-.147.518.2.156-.045.316-.079.48-.102.135-.019.271-.029.409-.029h.001z"/></svg>
                            </a>
                        )}
                    />
                    <Input
                        type="email"
                        placeholder="Email"
                        value={supplier.email}
                        onChange={e => setSupplier({...supplier, email: e.target.value})}
                        error={errors.email}
                    />
                    <Input
                        placeholder="CPF/CNPJ"
                        value={supplier.cpfCnpj}
                        onChange={e => setSupplier({...supplier, cpfCnpj: e.target.value})}
                        error={errors.cpfCnpj}
                    />
                    <div className="md:col-span-2">
                         <Textarea
                            placeholder="Endereço"
                            value={supplier.address}
                            onChange={e => setSupplier({...supplier, address: e.target.value})}
                            error={errors.address}
                            rows={3}
                        />
                    </div>
                     <Input
                        placeholder="CEP"
                        value={supplier.cep || ''}
                        onChange={e => setSupplier({...supplier, cep: e.target.value})}
                        error={errors.cep}
                        className="md:col-span-2"
                    />
                </div>
            </CardContent>
            <CardFooter className="flex justify-end space-x-4">
                <Button variant="ghost" onClick={onCancel}>Cancelar</Button>
                <Button onClick={handleSave} disabled={!isFormValid}>Salvar Fornecedor</Button>
            </CardFooter>
        </Card>
    );
};


const SuppliersPage: React.FC = () => {
    const { suppliers, saveSupplier, addReceipt } = useData();
    const [currentView, setCurrentView] = useState<'list' | 'form'>('list');
    const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
    const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);

    const handleNew = () => {
        setSelectedSupplier({
            id: `new-${Date.now()}`,
            name: '',
            contactPerson: '',
            phone: '',
            email: '',
            address: '',
            cep: '',
            cpfCnpj: ''
        });
        setCurrentView('form');
    };

    const handleEdit = (supplier: Supplier) => {
        setSelectedSupplier(supplier);
        setCurrentView('form');
    };

    const handleSave = (supplierToSave: Supplier) => {
        saveSupplier(supplierToSave);
        setCurrentView('list');
        setSelectedSupplier(null);
    };

    const handleCancel = () => {
        setCurrentView('list');
        setSelectedSupplier(null);
    };

    const handleGenerateReceiptClick = (supplier: Supplier) => {
        setSelectedSupplier(supplier);
        setIsReceiptModalOpen(true);
    };

    const handleSaveReceipt = (data: { amount: number, description: string }) => {
        if (!selectedSupplier) return;
        addReceipt({
            supplierId: selectedSupplier.id,
            supplierName: selectedSupplier.name,
            cpfCnpj: selectedSupplier.cpfCnpj,
            amount: data.amount,
            description: data.description,
        });
        // The modal will close itself after generating the PDF
    };


    return (
        <div>
            {currentView === 'list' && (
                <SupplierList 
                    suppliers={suppliers} 
                    onNew={handleNew} 
                    onEdit={handleEdit}
                    onGenerateReceipt={handleGenerateReceiptClick}
                />
            )}
            {currentView === 'form' && selectedSupplier && (
                <SupplierForm supplier={selectedSupplier} onSave={handleSave} onCancel={handleCancel} />
            )}
            {selectedSupplier && (
                <CreateReceiptModal
                    isOpen={isReceiptModalOpen}
                    onClose={() => setIsReceiptModalOpen(false)}
                    supplier={selectedSupplier}
                    onSave={handleSaveReceipt}
                />
            )}
        </div>
    );
};

export default SuppliersPage;