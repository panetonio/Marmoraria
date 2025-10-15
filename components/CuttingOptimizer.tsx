import React, { useState, useMemo } from 'react';
import type { QuoteItem, Material } from '../types';
import { mockMaterials } from '../data/mockData';
import Modal from './ui/Modal';
import Button from './ui/Button';

interface CuttingOptimizerProps {
    items: QuoteItem[];
    onClose: () => void;
    onComplete: (updatedItems: QuoteItem[], wastePercentage: number) => void;
}

const packRects = (slabWidth: number, slabHeight: number, items: QuoteItem[]) => {
    // We only work with items that have width and height
    const itemsToPack = items.filter(item => item.width && item.height);

    // Sort items by height, descending. This is a common heuristic for better packing.
    const sortedItems = [...itemsToPack].sort((a, b) => b.height! - a.height!);

    const packedItems: QuoteItem[] = [];
    let currentX = 0;
    let currentY = 0;
    let shelfHeight = 0;

    for (const item of sortedItems) {
        const itemWidth = item.width!;
        const itemHeight = item.height!;

        // Move to a new shelf if it doesn't fit horizontally
        if (currentX + itemWidth > slabWidth) {
            currentY += shelfHeight;
            currentX = 0;
            shelfHeight = 0;
        }

        // If the new shelf would be outside the slab vertically, the item doesn't fit
        if (currentY + itemHeight > slabHeight) {
            packedItems.push({ ...item, placement: { x: 0, y: 0, fit: false } });
            continue;
        }

        // Place the item
        packedItems.push({ ...item, placement: { x: currentX, y: currentY, fit: true } });

        // Update shelf position and height for the next item
        currentX += itemWidth;
        shelfHeight = Math.max(shelfHeight, itemHeight);
    }
    
    // Return all items, including those that couldn't be packed
    const packedIds = new Set(packedItems.map(i => i.id));
    const unpackedItems = items.filter(i => !packedIds.has(i.id));

    return [...packedItems, ...unpackedItems];
};


const CuttingOptimizer: React.FC<CuttingOptimizerProps> = ({ items, onClose, onComplete }) => {
    const materialItems = useMemo(() => items.filter(i => i.type === 'material' && i.width && i.height), [items]);
    const uniqueMaterialIds = useMemo(() => [...new Set(materialItems.map(i => i.materialId!))], [materialItems]);
    
    const [selectedMaterialId, setSelectedMaterialId] = useState<string | null>(uniqueMaterialIds[0] || null);

    const { packedItems, wastePercentage, material } = useMemo(() => {
        if (!selectedMaterialId) return { packedItems: [], wastePercentage: 100, material: null };
        
        const material = mockMaterials.find(m => m.id === selectedMaterialId)!;
        const itemsForMaterial = materialItems.filter(i => i.materialId === selectedMaterialId);
        
        const packed = packRects(material.slabWidth, material.slabHeight, itemsForMaterial);
        
        const usedArea = packed.reduce((acc, item) => {
            return item.placement?.fit ? acc + (item.width! * item.height!) : acc;
        }, 0);
        
        const totalArea = material.slabWidth * material.slabHeight;
        const waste = totalArea > 0 ? 100 - (usedArea / totalArea) * 100 : 100;

        return { packedItems: packed, wastePercentage: waste, material };

    }, [materialItems, selectedMaterialId]);

    const scale = 150; // pixels per meter

    return (
        <Modal isOpen={true} onClose={onClose} title="Otimizador de Corte" className="max-w-6xl">
            <div className="flex flex-col md:flex-row gap-4 h-full">
                {/* Visualization */}
                <div className="flex-1 bg-slate-100 dark:bg-slate-900 rounded p-4 overflow-auto">
                    <h4 className="font-semibold mb-2">Visualização da Chapa</h4>
                    {material ? (
                        <div 
                            className="relative bg-slate-300 dark:bg-slate-600 border-2 border-slate-400 dark:border-slate-500"
                            style={{ width: material.slabWidth * scale, height: material.slabHeight * scale }}
                            title={`Chapa de ${material.slabWidth}m x ${material.slabHeight}m`}
                        >
                            {packedItems.map(item => item.placement?.fit && (
                                <div 
                                    key={item.id}
                                    className="absolute bg-primary/80 border border-blue-800 text-white text-xs flex items-center justify-center p-1 overflow-hidden"
                                    style={{
                                        left: item.placement.x * scale,
                                        top: item.placement.y * scale,
                                        width: item.width! * scale,
                                        height: item.height! * scale,
                                    }}
                                    title={`${item.description} (${item.width}m x ${item.height}m)`}
                                >
                                    <span className="truncate">{item.description.split(' - ')[0]}</span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="flex items-center justify-center h-full text-text-secondary dark:text-slate-400">
                           <p>Nenhum material selecionado ou itens válidos para otimizar.</p>
                        </div>
                    )}
                </div>
                
                {/* Details */}
                <div className="w-full md:w-1/3 flex flex-col gap-4">
                     {uniqueMaterialIds.length > 1 && (
                         <div className="bg-surface dark:bg-dark border border-border dark:border-slate-700 rounded-lg p-4">
                             <label htmlFor="material-select" className="block text-sm font-medium text-text-secondary dark:text-slate-400 mb-1">
                                Otimizar Material
                            </label>
                            <select
                                id="material-select"
                                value={selectedMaterialId || ''}
                                onChange={(e) => setSelectedMaterialId(e.target.value)}
                                className="p-2 border rounded w-full bg-surface dark:bg-slate-700 border-border dark:border-slate-600"
                            >
                                {uniqueMaterialIds.map(matId => {
                                    const mat = mockMaterials.find(m => m.id === matId);
                                    return <option key={matId} value={matId}>{mat?.name || matId}</option>
                                })}
                            </select>
                         </div>
                     )}
                     <div className="bg-surface dark:bg-dark border border-border dark:border-slate-700 rounded-lg p-4">
                        <h4 className="font-semibold mb-2">Resultados para <span className="text-primary">{material?.name}</span></h4>
                        <p className="text-sm text-text-secondary dark:text-slate-400">Dimensões da chapa: {material?.slabWidth}m x {material?.slabHeight}m</p>
                        <div className="mt-4">
                            <div className="text-2xl font-bold text-error">
                                {wastePercentage.toFixed(2)}% de Perda
                            </div>
                             <div className="text-lg font-semibold text-success mt-1">
                                {(100 - wastePercentage).toFixed(2)}% de Aproveitamento
                            </div>
                             <p className="text-sm mt-2 text-text-secondary dark:text-slate-400">
                                {packedItems.filter(i => !i.placement?.fit).length} peça(s) não coube(ram) na chapa.
                             </p>
                        </div>
                    </div>
                    <div className="bg-surface dark:bg-dark border border-border dark:border-slate-700 rounded-lg p-4 flex-1 overflow-y-auto">
                         <h4 className="font-semibold mb-2">Lista de Peças</h4>
                         <ul className="space-y-1">
                             {packedItems.map(item => (
                                 <li key={item.id} className={`flex justify-between items-center text-sm p-1 rounded ${item.placement?.fit ? 'bg-green-100 dark:bg-green-900/50' : 'bg-red-100 dark:bg-red-900/50'}`}>
                                     <span>{item.description} ({item.width}x{item.height})</span>
                                     <span className="font-semibold">{item.placement?.fit ? 'OK' : 'Não Coube'}</span>
                                 </li>
                             ))}
                         </ul>
                    </div>
                    <Button 
                        onClick={() => onComplete(packedItems, wastePercentage)} 
                        className="w-full mt-auto"
                    >
                        Confirmar Otimização
                    </Button>
                </div>
            </div>
        </Modal>
    );
};

export default CuttingOptimizer;
