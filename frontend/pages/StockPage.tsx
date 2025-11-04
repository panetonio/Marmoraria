import React, { useState, useMemo, FC, useRef } from 'react';
import type { StockItem, StockItemStatus } from '../types';
import { useData } from '../context/DataContext';
import Card, { CardHeader, CardContent } from '../components/ui/Card';
import Modal from '../components/ui/Modal';
import Button from '../components/ui/Button';
import StatusBadge from '../components/ui/StatusBadge';
import { stockStatusMap } from '../config/statusMaps';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import { QRCode } from 'qrcode.react';

const StockAlerts: FC<{ lowStockMaterials: {name: string, current: number, min: number}[] }> = ({ lowStockMaterials }) => {
    if (lowStockMaterials.length === 0) return null;

    return (
        <div className="bg-red-50 dark:bg-red-900/20 border border-error dark:border-red-500/30 p-4 rounded-lg mb-6">
            <div className="flex items-center">
                 <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-error mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <h3 className="text-lg font-semibold text-red-800 dark:text-red-200">Alerta de Estoque Mínimo</h3>
            </div>
            <ul className="mt-2 list-disc list-inside text-red-700 dark:text-red-300 text-sm">
                {lowStockMaterials.map(material => (
                    <li key={material.name}>
                        <strong>{material.name}:</strong> {material.current.toFixed(2)}m² em estoque (mínimo: {material.min}m²)
                    </li>
                ))}
            </ul>
        </div>
    );
};

const StockItemCard: FC<{ item: StockItem, onSelect: (item: StockItem) => void }> = ({ item, onSelect }) => {
    const { materials } = useData();
    const material = materials.find(m => m.id === item.materialId);
    return (
        <Card onClick={() => onSelect(item)} className="p-0 overflow-hidden cursor-pointer hover:shadow-xl transition-shadow duration-300 flex flex-col">
            <img src={item.photoUrl} alt={material?.name} className="w-full h-32 object-cover" />
            <div className="p-4 flex flex-col flex-grow">
                <div className="flex justify-between items-start">
                    <h4 className="font-bold text-text-primary dark:text-slate-100">{material?.name}</h4>
                    <StatusBadge status={item.status} statusMap={stockStatusMap} />
                </div>
                <p className="font-mono text-xs text-text-secondary dark:text-slate-400 mt-1">{item.id}</p>
                <div className="mt-2 text-sm text-gray-700 dark:text-slate-300 space-y-1">
                    <p><strong>Dimensões:</strong> {item.width}m x {item.height}m</p>
                    <p><strong>Local:</strong> {item.location}</p>
                </div>
                {item.parentSlabId && <p className="text-xs text-slate-400 dark:text-slate-500 mt-2">Origem: {item.parentSlabId}</p>}
            </div>
        </Card>
    );
};

const StockDetailModal: FC<{ item: StockItem, isOpen: boolean, onClose: () => void }> = ({ item, isOpen, onClose }) => {
     const { materials } = useData();
     const material = materials.find(m => m.id === item.materialId);
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
            <html><head><title>Etiqueta de Chapa</title>
            <style>
                body { font-family: sans-serif; text-align: center; padding: 24px; color: #0f172a; }
                .qr-img { margin: 16px auto; width: 180px; height: 180px; }
                @media print { body { margin: 0; } }
            </style>
            </head><body>
            <h2>${material?.name ?? 'Chapa'}</h2>
            <p>ID: <strong>${item.id}</strong></p>
            <p>${item.width}m x ${item.height}m x ${item.thickness}cm</p>
            <img id="print-qr" src="${dataUrl}" alt="QR code do item ${item.id}" class="qr-img" />
            <p>Local: ${item.location}</p>
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
        <Modal isOpen={isOpen} onClose={onClose} title={`Detalhes da Chapa: ${item.id}`} className="max-w-4xl">
            <div className="flex flex-col md:flex-row gap-6">
                <div className="md:w-1/2">
                    <img src={item.photoUrl} alt={material?.name} className="w-full rounded-lg shadow-lg aspect-video object-cover" />
                     <div className="mt-6 bg-slate-100 dark:bg-dark p-4 rounded-lg text-center">
                        <h4 className="font-semibold mb-2">QR Code de Identificação</h4>
                        <div className="flex justify-center">
                            <QRCode
                                ref={qrCodeRef}
                                value={`marmoraria://asset/stock_item/${item.id}`}
                                size={180}
                                includeMargin
                                aria-label={`QR code para ${item.id}`}
                                style={{ width: 180, height: 180 }}
                            />
                        </div>
                        <Button onClick={handlePrint} className="mt-4" size="sm">Imprimir Etiqueta</Button>
                    </div>
                </div>
                <div className="md:w-1/2 bg-slate-50 dark:bg-slate-700/50 p-6 rounded-lg">
                    <h3 className="text-2xl font-bold text-text-primary dark:text-slate-100 mb-1">{material?.name}</h3>
                    <div className="mb-4"><StatusBadge status={item.status} statusMap={stockStatusMap} /></div>
                    
                    <div className="space-y-3 text-text-secondary dark:text-slate-300">
                        <p><strong>ID:</strong> <span className="font-mono text-text-primary dark:text-slate-100">{item.id}</span></p>
                        <p><strong>Dimensões:</strong> {item.width}m (largura) x {item.height}m (altura)</p>
                        <p><strong>Espessura:</strong> {item.thickness}cm</p>
                        <p><strong>Área:</strong> {(item.width * item.height).toFixed(2)}m²</p>
                        <p><strong>Localização:</strong> {item.location}</p>
                        <p><strong>Data de Entrada:</strong> {new Date(item.createdAt).toLocaleDateString()}</p>
                        {item.parentSlabId && <p><strong>Origem (Retalho):</strong> <span className="font-mono">{item.parentSlabId}</span></p>}
                    </div>
                </div>
            </div>
        </Modal>
     )
};

// Main page component
const StockPage: React.FC = () => {
  const { stockItems, materials, freightCostPerKm, setFreightCostPerKm } = useData();
  const [viewingItem, setViewingItem] = useState<StockItem | null>(null);
  const [materialFilter, setMaterialFilter] = useState<string>('');
  
  const lowStockMaterials = useMemo(() => {
    const levels = new Map<string, { current: number; min: number; name: string }>();
    materials.forEach(m => {
        if (m.minStockSqM) {
             levels.set(m.id, { current: 0, min: m.minStockSqM, name: m.name });
        }
    });
    stockItems.forEach(item => {
        if (item.status === 'disponivel' || item.status === 'reservada') {
            const level = levels.get(item.materialId);
            if (level) {
                level.current += item.width * item.height;
            }
        }
    });
    return Array.from(levels.values()).filter(l => l.current < l.min && l.min > 0);
  }, [stockItems, materials]);

  const filteredItems = useMemo(() => {
    return stockItems.filter(item => {
        const materialMatch = materialFilter ? item.materialId === materialFilter : true;
        return materialMatch;
    }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [stockItems, materialFilter]);


  return (
    <div>
      {viewingItem && <StockDetailModal item={viewingItem} isOpen={!!viewingItem} onClose={() => setViewingItem(null)} />}

      <div className="flex justify-between items-center mb-4">
        <div>
            <h1 className="text-3xl font-bold text-text-primary dark:text-slate-100">Controle de Estoque Inteligente</h1>
            <p className="mt-2 text-text-secondary dark:text-slate-400">Gerencie chapas, retalhos e insumos individualmente.</p>
        </div>
        <Button>+ Adicionar Chapa</Button>
      </div>

      <StockAlerts lowStockMaterials={lowStockMaterials} />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card className="p-4 md:col-span-2">
            <div className="flex items-center space-x-4">
                <label htmlFor="material-filter" className="font-semibold text-text-primary dark:text-slate-100">Filtrar por Material:</label>
                <Select
                    id="material-filter"
                    value={materialFilter}
                    onChange={(e) => setMaterialFilter(e.target.value)}
                    className="w-full max-w-xs"
                    aria-label="Filtrar por material"
                >
                    <option value="">Todos os Materiais</option>
                    {materials.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                </Select>
            </div>
        </Card>
        <Card>
            <CardHeader>
                <h3 className="text-lg font-semibold">Configurações</h3>
            </CardHeader>
            <CardContent>
                <Input
                    label="Custo do Frete por KM (R$)"
                    id="freight-cost"
                    type="number"
                    value={freightCostPerKm}
                    onChange={(e) => setFreightCostPerKm(parseFloat(e.target.value) || 0)}
                />
            </CardContent>
        </Card>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredItems.map(item => (
            <StockItemCard key={item.id} item={item} onSelect={setViewingItem} />
        ))}
        {filteredItems.length === 0 && (
            <div className="col-span-full text-center p-10 bg-surface dark:bg-dark rounded-lg shadow-md">
                <p className="text-text-secondary dark:text-slate-400">Nenhum item de estoque encontrado com os filtros aplicados.</p>
            </div>
        )}
      </div>
    </div>
  );
};

export default StockPage;
