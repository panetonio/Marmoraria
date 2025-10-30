import React, { useState, FC, useMemo, useEffect, useRef } from 'react';
import type { Material, Service, Product } from '../types';
import { useData } from '../context/DataContext';
import Card, { CardContent, CardHeader, CardFooter } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import Tabs from '../components/ui/Tabs';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import QRCode from '../lib/qrcode-react';

type CatalogView = 'materials' | 'services' | 'products';

const ConfirmationModal: FC<{
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
}> = ({ isOpen, onClose, onConfirm, title, message }) => {
    return (
        <Modal isOpen={isOpen} onClose={onClose} title={title}>
            <p className="text-text-primary dark:text-slate-200">{message}</p>
            <div className="flex justify-end mt-6 space-x-3">
                <Button variant="ghost" onClick={onClose}>Cancelar</Button>
                <Button variant="destructive" onClick={onConfirm}>Confirmar Exclusão</Button>
            </div>
        </Modal>
    );
};

// --- Material Management ---
const MaterialFormModal: FC<{
    material: Material | null;
    isOpen: boolean;
    onClose: () => void;
    onSave: (material: Material) => void;
}> = ({ material: initialMaterial, isOpen, onClose, onSave }) => {
    const { suppliers } = useData();
    const [material, setMaterial] = useState(initialMaterial);
    const [errors, setErrors] = useState<Record<string, string>>({});

    useEffect(() => {
        setMaterial(initialMaterial);
        if (!isOpen) {
            setErrors({});
        }
    }, [initialMaterial, isOpen]);

    const handleChange = (field: keyof Material, value: any) => {
        setMaterial(prev => prev ? { ...prev, [field]: value } : null);
    };

    const validate = () => {
        if (!material) return false;
        const newErrors: Record<string, string> = {};
        if (!material.name.trim()) newErrors.name = "Nome é obrigatório.";
        if (!material.supplier.trim()) newErrors.supplier = "Fornecedor é obrigatório.";
        if (material.costPerSqM <= 0) newErrors.costPerSqM = "Custo deve ser > 0.";
        if (material.slabWidth <= 0) newErrors.slabWidth = "Largura deve ser > 0.";
        if (material.slabHeight <= 0) newErrors.slabHeight = "Altura deve ser > 0.";
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSave = () => {
        if (validate() && material) {
            onSave(material);
        }
    };

    if (!isOpen || !material) return null;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={material.id.startsWith('new-') ? 'Novo Material' : 'Editar Material'}>
            <div className="space-y-4">
                <Input label="Nome do Material" value={material.name} onChange={e => handleChange('name', e.target.value)} error={errors.name} />
                <Input label="URL da Foto" value={material.photoUrl} onChange={e => handleChange('photoUrl', e.target.value)} />
                <Select label="Fornecedor" value={material.supplier} onChange={e => handleChange('supplier', e.target.value)} error={errors.supplier}>
                    <option value="">-- Selecione --</option>
                    {suppliers.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                </Select>
                <Input label="SKU / Código" value={material.sku} onChange={e => handleChange('sku', e.target.value)} />
                <div className="grid grid-cols-2 gap-4">
                    <Input label="Custo por m² (R$)" type="number" value={material.costPerSqM} onChange={e => handleChange('costPerSqM', parseFloat(e.target.value) || 0)} error={errors.costPerSqM} />
                    <Input label="Estoque Mínimo (m²)" type="number" value={material.minStockSqM || ''} onChange={e => handleChange('minStockSqM', parseFloat(e.target.value) || 0)} />
                </div>
                 <div className="grid grid-cols-2 gap-4">
                    <Input label="Largura da Chapa (m)" type="number" value={material.slabWidth} onChange={e => handleChange('slabWidth', parseFloat(e.target.value) || 0)} error={errors.slabWidth} />
                    <Input label="Altura da Chapa (m)" type="number" value={material.slabHeight} onChange={e => handleChange('slabHeight', parseFloat(e.target.value) || 0)} error={errors.slabHeight} />
                </div>
            </div>
            <div className="flex justify-end mt-6 space-x-3">
                <Button variant="ghost" onClick={onClose}>Cancelar</Button>
                <Button onClick={handleSave}>Salvar</Button>
            </div>
        </Modal>
    );
};

const MaterialManagement = () => {
    const { materials, saveMaterial, deleteMaterial } = useData();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingMaterial, setEditingMaterial] = useState<Material | null>(null);
    const [deletingId, setDeletingId] = useState<string | null>(null);

    const handleNew = () => {
        setEditingMaterial({ id: 'new-mat', name: '', photoUrl: '', supplier: '', costPerSqM: 0, slabWidth: 0, slabHeight: 0, sku: '', minStockSqM: 0 });
        setIsModalOpen(true);
    };

    const handleEdit = (material: Material) => {
        setEditingMaterial(JSON.parse(JSON.stringify(material)));
        setIsModalOpen(true);
    };

    const handleSave = (material: Material) => {
        saveMaterial(material);
        setIsModalOpen(false);
        setEditingMaterial(null);
    };

    const handleDelete = () => {
        if(deletingId) {
            deleteMaterial(deletingId);
            setDeletingId(null);
        }
    };
    
    return (
        <Card className="p-0">
             <MaterialFormModal material={editingMaterial} isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSave={handleSave} />
             <ConfirmationModal 
                isOpen={!!deletingId}
                onClose={() => setDeletingId(null)}
                onConfirm={handleDelete}
                title="Confirmar Exclusão"
                message="Tem certeza que deseja excluir este material? Esta ação não pode ser desfeita."
             />
            <CardHeader>
                <div className="flex justify-between items-center">
                    <h2 className="text-xl font-semibold">Gestão de Materiais</h2>
                    <Button onClick={handleNew}>Novo Material</Button>
                </div>
            </CardHeader>
            <CardContent>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead><tr className="border-b border-border dark:border-slate-700"><th className="p-3">Foto</th><th className="p-3">Nome</th><th className="p-3">Fornecedor</th><th className="p-3 text-right">Custo/m²</th><th className="p-3 text-center">Ações</th></tr></thead>
                        <tbody>
                            {materials.map(mat => (
                                <tr key={mat.id} className="border-b border-border dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50">
                                    <td className="p-2"><img src={mat.photoUrl} alt={mat.name} className="h-10 w-16 object-cover rounded"/></td>
                                    <td className="p-3 font-semibold">{mat.name}</td>
                                    <td className="p-3">{mat.supplier}</td>
                                    <td className="p-3 text-right">{mat.costPerSqM.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                                    <td className="p-3 text-center space-x-2">
                                        <Button size="sm" variant="ghost" onClick={() => handleEdit(mat)}>Editar</Button>
                                        <Button size="sm" variant="destructive" onClick={() => setDeletingId(mat.id)}>Excluir</Button>
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

// --- Service Management ---
const ServiceManagement = () => {
    // Similar to MaterialManagement but for Services
    const { services, saveService, deleteService } = useData();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingService, setEditingService] = useState<Service | null>(null);
    const [deletingId, setDeletingId] = useState<string | null>(null);

    const handleNew = () => {
        setEditingService({ id: 'new-srv', name: '', unit: 'm', price: 0 });
        setIsModalOpen(true);
    };
    
    const handleEdit = (service: Service) => {
        setEditingService(JSON.parse(JSON.stringify(service)));
        setIsModalOpen(true);
    };

    const handleSave = (service: Service) => {
        saveService(service);
        setIsModalOpen(false);
    };
    
    const handleDelete = () => {
        if(deletingId) {
            deleteService(deletingId);
            setDeletingId(null);
        }
    };

    return (
        <Card className="p-0">
            {editingService && <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Editar Serviço">
                <div className="space-y-4">
                    <Input label="Nome do Serviço" value={editingService.name} onChange={e => setEditingService({...editingService, name: e.target.value})} />
                    <Select label="Unidade" value={editingService.unit} onChange={e => setEditingService({...editingService, unit: e.target.value as Service['unit']})}>
                        <option value="m">Metro (m)</option>
                        <option value="un">Unidade (un)</option>
                        <option value="%">Porcentagem (%)</option>
                    </Select>
                    <Input label="Preço (R$)" type="number" value={editingService.price} onChange={e => setEditingService({...editingService, price: parseFloat(e.target.value) || 0})} />
                </div>
                 <div className="flex justify-end mt-6 space-x-3">
                    <Button variant="ghost" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
                    <Button onClick={() => handleSave(editingService)}>Salvar</Button>
                </div>
            </Modal>}
            <ConfirmationModal isOpen={!!deletingId} onClose={() => setDeletingId(null)} onConfirm={handleDelete} title="Confirmar Exclusão" message="Tem certeza que deseja excluir este serviço?" />
            <CardHeader>
                <div className="flex justify-between items-center">
                    <h2 className="text-xl font-semibold">Gestão de Serviços</h2>
                    <Button onClick={handleNew}>Novo Serviço</Button>
                </div>
            </CardHeader>
            <CardContent>
                <table className="w-full text-left">
                    <thead><tr className="border-b"><th className="p-3">Nome</th><th className="p-3">Unidade</th><th className="p-3 text-right">Preço</th><th className="p-3 text-center">Ações</th></tr></thead>
                    <tbody>
                        {services.map(srv => (<tr key={srv.id} className="border-b"><td className="p-3">{srv.name}</td><td className="p-3 uppercase">{srv.unit}</td><td className="p-3 text-right">{srv.price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td><td className="p-3 text-center space-x-2"><Button size="sm" variant="ghost" onClick={() => handleEdit(srv)}>Editar</Button><Button size="sm" variant="destructive" onClick={() => setDeletingId(srv.id)}>Excluir</Button></td></tr>))}
                    </tbody>
                </table>
            </CardContent>
        </Card>
    );
};

// --- Product Management ---
const ProductDetailModal: FC<{ product: Product; isOpen: boolean; onClose: () => void }> = ({ product, isOpen, onClose }) => {
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
            <html><head><title>Etiqueta de Produto</title>
            <style>
                body { font-family: sans-serif; text-align: center; padding: 24px; color: #0f172a; }
                .qr-img { margin: 16px auto; width: 180px; height: 180px; }
                @media print { body { margin: 0; } }
            </style>
            </head><body>
            <h2>${product.name}</h2>
            <p>ID: <strong>${product.id}</strong></p>
            <img id="print-qr" src="${dataUrl}" alt="QR code do produto ${product.id}" class="qr-img" />
            <p>Preço: R$ ${product.price.toFixed(2)}</p>
            <p>Estoque: ${product.stock}</p>
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
        <Modal isOpen={isOpen} onClose={onClose} title={`Detalhes do Produto: ${product.name}`} className="max-w-4xl">
            <div className="flex flex-col md:flex-row gap-6">
                <div className="md:w-1/2">
                    <div className="bg-slate-100 dark:bg-dark p-4 rounded-lg text-center">
                        <h4 className="font-semibold mb-2">QR Code de Identificação</h4>
                        <div className="flex justify-center">
                            <QRCode
                                ref={qrCodeRef}
                                value={`marmoraria://asset/product/${product.id}`}
                                size={180}
                                includeMargin
                                aria-label={`QR code para ${product.name}`}
                                style={{ width: 180, height: 180 }}
                            />
                        </div>
                        <Button onClick={handlePrint} className="mt-4" size="sm">Imprimir Etiqueta</Button>
                    </div>
                </div>
                <div className="md:w-1/2 bg-slate-50 dark:bg-slate-700/50 p-6 rounded-lg">
                    <h3 className="text-2xl font-bold text-text-primary dark:text-slate-100 mb-1">{product.name}</h3>
                    
                    <div className="space-y-3 text-text-secondary dark:text-slate-300">
                        <p><strong>ID:</strong> <span className="font-mono text-text-primary dark:text-slate-100">{product.id}</span></p>
                        <div className="grid grid-cols-1 gap-2 text-sm text-text-secondary dark:text-slate-400 sm:grid-cols-3">
                            <div>
                                <span className="font-semibold text-text-primary dark:text-slate-100">Custo</span>
                                <p>R$ {product.cost.toFixed(2)}</p>
                            </div>
                            <div>
                                <span className="font-semibold text-text-primary dark:text-slate-100">Preço</span>
                                <p>R$ {product.price.toFixed(2)}</p>
                            </div>
                            <div>
                                <span className="font-semibold text-text-primary dark:text-slate-100">Estoque</span>
                                <p>{product.stock}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </Modal>
    );
};

const ProductManagement = () => {
    // Similar to MaterialManagement but for Products
    const { products, saveProduct, deleteProduct } = useData();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);
    const [viewingProduct, setViewingProduct] = useState<Product | null>(null);
    const [deletingId, setDeletingId] = useState<string | null>(null);

    const handleNew = () => {
        setEditingProduct({ id: 'new-prd', name: '', cost: 0, price: 0, stock: 0 });
        setIsModalOpen(true);
    };
    
    const handleEdit = (product: Product) => {
        setEditingProduct(JSON.parse(JSON.stringify(product)));
        setIsModalOpen(true);
    };

    const handleSave = (product: Product) => {
        saveProduct(product);
        setIsModalOpen(false);
    };
    
    const handleDelete = () => {
        if(deletingId) {
            deleteProduct(deletingId);
            setDeletingId(null);
        }
    };
    
    return (
        <Card className="p-0">
            {viewingProduct && (
                <ProductDetailModal
                    product={viewingProduct}
                    isOpen={!!viewingProduct}
                    onClose={() => setViewingProduct(null)}
                />
            )}
            {editingProduct && <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Editar Produto">
                <div className="space-y-4">
                    <Input label="Nome do Produto" value={editingProduct.name} onChange={e => setEditingProduct({...editingProduct, name: e.target.value})} />
                     <div className="grid grid-cols-2 gap-4">
                        <Input label="Custo (R$)" type="number" value={editingProduct.cost} onChange={e => setEditingProduct({...editingProduct, cost: parseFloat(e.target.value) || 0})} />
                        <Input label="Preço de Venda (R$)" type="number" value={editingProduct.price} onChange={e => setEditingProduct({...editingProduct, price: parseFloat(e.target.value) || 0})} />
                    </div>
                    <Input label="Estoque Atual" type="number" value={editingProduct.stock} onChange={e => setEditingProduct({...editingProduct, stock: parseInt(e.target.value, 10) || 0})} />
                </div>
                <div className="flex justify-end mt-6 space-x-3">
                    <Button variant="ghost" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
                    <Button onClick={() => handleSave(editingProduct)}>Salvar</Button>
                </div>
            </Modal>}
            <ConfirmationModal isOpen={!!deletingId} onClose={() => setDeletingId(null)} onConfirm={handleDelete} title="Confirmar Exclusão" message="Tem certeza que deseja excluir este produto?" />
            <CardHeader>
                <div className="flex justify-between items-center">
                    <h2 className="text-xl font-semibold">Gestão de Produtos (Revenda)</h2>
                    <Button onClick={handleNew}>Novo Produto</Button>
                </div>
            </CardHeader>
            <CardContent>
                 <table className="w-full text-left">
                    <thead><tr className="border-b"><th className="p-3">Nome</th><th className="p-3 text-right">Custo</th><th className="p-3 text-right">Preço Venda</th><th className="p-3 text-center">Estoque</th><th className="p-3 text-center">Ações</th></tr></thead>
                    <tbody>
                        {products.map(prd => (<tr key={prd.id} className="border-b"><td className="p-3">{prd.name}</td><td className="p-3 text-right">{prd.cost.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td><td className="p-3 text-right">{prd.price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td><td className="p-3 text-center">{prd.stock}</td><td className="p-3 text-center space-x-2"><Button size="sm" variant="secondary" onClick={() => setViewingProduct(prd)}>Ver QR Code</Button><Button size="sm" variant="ghost" onClick={() => handleEdit(prd)}>Editar</Button><Button size="sm" variant="destructive" onClick={() => setDeletingId(prd.id)}>Excluir</Button></td></tr>))}
                    </tbody>
                </table>
            </CardContent>
        </Card>
    );
};

// --- Main Page Component ---
const CatalogPage: React.FC = () => {
    const [view, setView] = useState<CatalogView>('materials');

    const renderView = () => {
        switch (view) {
            case 'materials': return <MaterialManagement />;
            case 'services': return <ServiceManagement />;
            case 'products': return <ProductManagement />;
            default: return <MaterialManagement />;
        }
    };

    return (
        <div>
            <h1 className="text-3xl font-bold text-text-primary dark:text-slate-100">Catálogo</h1>
            <p className="mt-2 text-text-secondary dark:text-slate-400 mb-6">Gerencie os materiais, serviços e produtos oferecidos pela empresa.</p>

            <Tabs
                tabs={[
                    { id: 'materials', label: 'Materiais' },
                    { id: 'services', label: 'Serviços' },
                    { id: 'products', label: 'Produtos' },
                ]}
                activeTab={view}
                onTabClick={(tabId) => setView(tabId as CatalogView)}
            />

            {renderView()}
        </div>
    );
};

export default CatalogPage;
