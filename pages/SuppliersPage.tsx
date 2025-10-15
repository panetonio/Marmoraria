import React, { useState, useMemo } from 'react';
import { mockSuppliers } from '../data/mockData';
import type { Supplier } from '../types';
import Card, { CardContent, CardHeader, CardFooter } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';

declare const html2canvas: any;
declare const jspdf: any;


const generateWhatsAppLink = (phone: string) => {
    if (!phone) return '';
    const cleanedPhone = phone.replace(/\D/g, '');
    if (cleanedPhone.length <= 11) {
        return `https://wa.me/55${cleanedPhone}`;
    }
    return `https://wa.me/${cleanedPhone}`;
};

const ReceiptModal: React.FC<{
    supplier: Supplier;
    isOpen: boolean;
    onClose: () => void;
}> = ({ supplier, isOpen, onClose }) => {
    const [amount, setAmount] = useState(''); // Store as string of digits, e.g. "12550" for 125.50
    const [description, setDescription] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [error, setError] = useState('');

    const receiptId = useMemo(() => {
        const now = new Date();
        const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
        const timeStr = now.toTimeString().slice(0, 8).replace(/:/g, '');
        return `REC-${dateStr}-${timeStr}-${supplier.id.replace('sup-', '')}`;
    }, [supplier.id]);

    const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value.replace(/\D/g, '');
        setAmount(value);
    };

    const formatAmountForDisplay = (digits: string) => {
        if (!digits) return '';
        const padded = digits.padStart(3, '0');
        const integer = padded.slice(0, -2);
        const decimal = padded.slice(-2);
        const formattedInteger = parseInt(integer, 10).toLocaleString('pt-BR');
        return `${formattedInteger},${decimal}`;
    };

    const formattedCurrency = useMemo(() => {
        if (!amount) return 'R$ 0,00';
        const num = parseInt(amount, 10) / 100;
        return num.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    }, [amount]);

    const handleGeneratePdf = async () => {
        if (!amount || !description.trim()) {
            setError('O valor e a descrição são obrigatórios.');
            return;
        }
        setError('');
        const printableArea = document.getElementById('receipt-printable-area');
        if (!printableArea || isGenerating) return;

        setIsGenerating(true);

        try {
            const canvas = await html2canvas(printableArea, {
                scale: 2,
                useCORS: true,
                backgroundColor: '#ffffff',
            });

            const imgData = canvas.toDataURL('image/png');
            const { jsPDF } = jspdf;
            const pdf = new jsPDF('p', 'mm', 'a4');
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = pdf.internal.pageSize.getHeight();
            const imgHeight = canvas.height * pdfWidth / canvas.width;
            
            pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, Math.min(imgHeight, pdfHeight));
            pdf.save(`recibo-${receiptId}.pdf`);
        } catch (err) {
            console.error("Error generating PDF:", err);
            alert("Ocorreu um erro ao gerar o PDF. Verifique o console para mais detalhes.");
        } finally {
            setIsGenerating(false);
            onClose();
        }
    };
    
    const today = new Date();

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Gerar Recibo para ${supplier.name}`} className="max-w-2xl">
            <div className="space-y-4">
                <div>
                    <label htmlFor="receipt-amount" className="block text-sm font-medium text-text-secondary dark:text-slate-400 mb-1">Valor (R$)</label>
                    <input
                        id="receipt-amount"
                        type="text"
                        placeholder="0,00"
                        value={formatAmountForDisplay(amount)}
                        onChange={handleAmountChange}
                        className={`p-2 border rounded w-full bg-slate-50 dark:bg-slate-700 ${error && !amount ? 'border-error' : 'border-border dark:border-slate-600'}`}
                    />
                </div>
                <div>
                    <label htmlFor="receipt-description" className="block text-sm font-medium text-text-secondary dark:text-slate-400 mb-1">Referente a</label>
                    <textarea
                        id="receipt-description"
                        rows={3}
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Ex: Pagamento de chapa de granito"
                        className={`p-2 border rounded w-full bg-slate-50 dark:bg-slate-700 ${error && !description ? 'border-error' : 'border-border dark:border-slate-600'}`}
                    ></textarea>
                </div>
                {error && <p className="text-error text-center text-sm">{error}</p>}
            </div>

            <div className="flex justify-end mt-6 space-x-3">
                <Button variant="ghost" onClick={onClose}>Cancelar</Button>
                <Button onClick={handleGeneratePdf} disabled={isGenerating}>
                    {isGenerating ? 'Gerando...' : 'Gerar PDF'}
                </Button>
            </div>

            {/* Hidden printable area */}
            <div id="receipt-printable-area" className="absolute -left-[9999px] top-0 w-[210mm] bg-white p-12 text-black font-sans text-base">
                <div className="border-b-2 border-black pb-4 text-center">
                    <h1 className="text-3xl font-bold">RECIBO DE PAGAMENTO</h1>
                </div>
                <div className="flex justify-between items-center mt-4 text-sm">
                    <span>ID: {receiptId}</span>
                    <span className="font-semibold">Valor: {formattedCurrency}</span>
                    <span>Data: {today.toLocaleDateString('pt-BR')}</span>
                </div>
                <div className="mt-12 text-lg leading-relaxed">
                    <p>
                        Eu, <strong>{supplier.name}</strong>, inscrito(a) no CPF/CNPJ sob o nº <strong>{supplier.cpfCnpj}</strong>, contato <strong>{supplier.phone}</strong>, declaro para os devidos fins que recebi da empresa <strong>Marmoraria ERP</strong> a quantia de <strong>{formattedCurrency}</strong>.
                    </p>
                    <p className="mt-6">
                        Este valor é referente ao pagamento de:
                    </p>
                    <p className="mt-2 p-4 border border-dashed border-gray-400 bg-gray-50">
                        {description}
                    </p>
                    <p className="mt-8">
                        Dou plena, rasa e geral quitação do referido valor, para nada mais reclamar, seja a que título for.
                    </p>
                </div>
                <div className="mt-24 text-center">
                    <p>_________________________________________</p>
                    <p className="mt-2 font-semibold">{supplier.name}</p>
                    <p>{supplier.cpfCnpj}</p>
                </div>
            </div>
        </Modal>
    );
};

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

const FieldError: React.FC<{ message?: string }> = ({ message }) => {
    if (!message) return null;
    return <p className="text-error text-xs mt-1">{message}</p>;
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
                    <div>
                        <input type="text" placeholder="Nome da Empresa" value={supplier.name} onChange={e => setSupplier({...supplier, name: e.target.value})} className={`p-2 border rounded w-full bg-slate-50 dark:bg-slate-700 ${errors.name ? 'border-error' : 'border-border dark:border-slate-600'}`} />
                        <FieldError message={errors.name} />
                    </div>
                    <div>
                        <input type="text" placeholder="Nome do Contato" value={supplier.contactPerson} onChange={e => setSupplier({...supplier, contactPerson: e.target.value})} className={`p-2 border rounded w-full bg-slate-50 dark:bg-slate-700 ${errors.contactPerson ? 'border-error' : 'border-border dark:border-slate-600'}`} />
                        <FieldError message={errors.contactPerson} />
                    </div>
                    <div className="relative">
                        <input type="text" placeholder="Telefone" value={supplier.phone} onChange={e => setSupplier({...supplier, phone: e.target.value})} className={`p-2 border rounded w-full pr-10 bg-slate-50 dark:bg-slate-700 ${errors.phone ? 'border-error' : 'border-border dark:border-slate-600'}`} />
                         {supplier.phone && (
                            <a href={generateWhatsAppLink(supplier.phone)} target="_blank" rel="noopener noreferrer" title="Abrir no WhatsApp" className="absolute inset-y-0 right-0 flex items-center pr-3 text-green-500 hover:text-green-700">
                               <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.487 5.235 3.487 8.413 0 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 4.315 1.919 6.066l-1.472 5.378 5.441-1.421zM11.999 4.521c.212 0 .416.03.612.088.225-.045.458-.068.696-.068h.001c.138 0 .274.01.409.029.164.023.324.057.48.102.18.053.352.12.518.2.148.071.29.155.425.25.158.114.306.242.441.381.119.123.23.255.335.395.122.161.233.332.336.512.092.158.175.324.248.499.063.149.117.302.162.458.042.145.074.293.097.444.02.127.031.255.031.385v.001c0 .093-.005.185-.014.276-.025.245-.084.482-.175.709-.131.325-.316.626-.55.895-.252.287-.556.533-.898.729-.281.16-.583.284-.901.372-.258.072-.524.12-.796.143-.332.028-.671.028-.999 0-.272-.023-.538-.071-.796-.143-.318-.088-.62-.212-.901-.372-.342-.196-.646-.442-.898-.729-.234-.269-.419-.57-.55-.895-.091-.227-.15-.464-.175-.709-.009-.091-.014-.183-.014-.276v-.001c0-.13.011-.258.031-.385.023-.151.055-.299.097-.444.045-.156.099-.309.162-.458.073-.175.156-.341.248.499.103-.18.214-.351.336.512.105-.14.216-.272.335.395.135-.139.283-.267.441.381.135-.095.277-.179.425-.25.166-.08.338-.147.518.2.156-.045.316-.079.48-.102.135-.019.271-.029.409-.029h.001z"/></svg>
                            </a>
                        )}
                         <FieldError message={errors.phone} />
                    </div>
                    <div>
                        <input type="email" placeholder="Email" value={supplier.email} onChange={e => setSupplier({...supplier, email: e.target.value})} className={`p-2 border rounded w-full bg-slate-50 dark:bg-slate-700 ${errors.email ? 'border-error' : 'border-border dark:border-slate-600'}`} />
                         <FieldError message={errors.email} />
                    </div>
                    <div>
                        <input type="text" placeholder="CPF/CNPJ" value={supplier.cpfCnpj} onChange={e => setSupplier({...supplier, cpfCnpj: e.target.value})} className={`p-2 border rounded w-full bg-slate-50 dark:bg-slate-700 ${errors.cpfCnpj ? 'border-error' : 'border-border dark:border-slate-600'}`} />
                        <FieldError message={errors.cpfCnpj} />
                    </div>
                    <div className="md:col-span-2">
                        <textarea placeholder="Endereço" value={supplier.address} onChange={e => setSupplier({...supplier, address: e.target.value})} className={`p-2 border rounded w-full bg-slate-50 dark:bg-slate-700 ${errors.address ? 'border-error' : 'border-border dark:border-slate-600'}`} rows={3}></textarea>
                        <FieldError message={errors.address} />
                    </div>
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
    const [suppliers, setSuppliers] = useState<Supplier[]>(mockSuppliers);
    const [currentView, setCurrentView] = useState<'list' | 'form'>('list');
    const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
    const [selectedSupplierForReceipt, setSelectedSupplierForReceipt] = useState<Supplier | null>(null);

    const handleNew = () => {
        setSelectedSupplier({
            id: `new-${Date.now()}`,
            name: '',
            contactPerson: '',
            phone: '',
            email: '',
            address: '',
            cpfCnpj: ''
        });
        setCurrentView('form');
    };

    const handleEdit = (supplier: Supplier) => {
        setSelectedSupplier(supplier);
        setCurrentView('form');
    };

    const handleSave = (supplierToSave: Supplier) => {
        if (supplierToSave.id.startsWith('new-')) {
            // It's a new supplier
            setSuppliers([...suppliers, { ...supplierToSave, id: `sup-${suppliers.length + 1}` }]);
        } else {
            // It's an existing supplier
            setSuppliers(suppliers.map(s => s.id === supplierToSave.id ? supplierToSave : s));
        }
        setCurrentView('list');
        setSelectedSupplier(null);
    };

    const handleCancel = () => {
        setCurrentView('list');
        setSelectedSupplier(null);
    };

    const handleGenerateReceiptClick = (supplier: Supplier) => {
        setSelectedSupplierForReceipt(supplier);
    };

    const handleCloseReceiptModal = () => {
        setSelectedSupplierForReceipt(null);
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
            {selectedSupplierForReceipt && (
                <ReceiptModal 
                    isOpen={!!selectedSupplierForReceipt}
                    onClose={handleCloseReceiptModal}
                    supplier={selectedSupplierForReceipt}
                />
            )}
        </div>
    );
};

export default SuppliersPage;