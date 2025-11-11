import React, { useState, useMemo, useEffect } from 'react';
import type { QuoteItem, Material, StockItem } from '../types';
import { useData } from '../context/DataContext';
import Modal from './ui/Modal';
import Button from './ui/Button';

// External packer and mapper declarations (assumed to exist elsewhere)
declare class Packer {
    constructor(width: number, height: number);
    fit(items: any[]): void;
}

interface PackerItem {
    id: string;
    originalItemId: string;
    description: string;
    w: number;
    h: number;
    area: number;
    quantity: number;
    fit?: boolean;
    x?: number;
    y?: number;
    quoteItem: QuoteItem;
}

const mapQuoteItemToPackerItem = (item: QuoteItem, index: number): PackerItem => {
    const width = item.width ?? 0;
    const height = item.height ?? 0;

    return {
        id: `${item.id}-copy-${index}`, // ID único para cada cópia
        originalItemId: item.id,
        description: item.description,
        w: width,
        h: height,
        area: width * height,
        quantity: item.quantity ?? 1,
        fit: false,
        x: 0,
        y: 0,
        quoteItem: item,
    };
};

interface CuttingOptimizerProps {
    pieces: QuoteItem[];
    initialSlab: StockItem;
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


const CuttingOptimizer: React.FC<CuttingOptimizerProps> = ({ pieces, initialSlab, onClose, onComplete }) => {
    const { materials: mockMaterials } = useData();
    const items = pieces;
    const materialItems = useMemo(() => items.filter(i => i.type === 'material' && i.width && i.height), [items]);
    const uniqueMaterialIds = useMemo(() => [...new Set(materialItems.map(i => i.materialId!))], [materialItems]);
    
    const [selectedMaterialId, setSelectedMaterialId] = useState<string | null>(uniqueMaterialIds[0] || null);

    // New states for multi-slab workflow
    const [slabs, setSlabs] = useState<StockItem[]>([initialSlab]);
    const [unpackedItems, setUnpackedItems] = useState<any[]>([]);
    const [packedLayouts, setPackedLayouts] = useState<any[][]>([]);
    const [currentSlabIndex, setCurrentSlabIndex] = useState(0);
    const [isSlabSelectorOpen, setIsSlabSelectorOpen] = useState(false);

    // Multi-slab packing logic
    const packItems = () => {
        // 1. Map all pieces to packer format
        let itemsToPack: PackerItem[] = [];

        pieces.forEach(item => {
            // Garante que a quantidade seja pelo menos 1
            const quantity = item.quantity && item.quantity > 0 ? item.quantity : 1;

            // Adiciona o item 'quantity' vezes ao array de empacotamento
            for (let i = 0; i < quantity; i++) {
                // Passa o item e o índice 'i' para gerar IDs únicos
                itemsToPack.push(mapQuoteItemToPackerItem(item, i));
            }
        });

        let layouts: any[][] = [];
        let remainingItems = [...itemsToPack];

        // 2. Iterate over each available slab
        slabs.forEach((slab) => {
            const itemsForThisSlab = remainingItems.filter(item => !item.fit);
            if (itemsForThisSlab.length === 0) {
                layouts.push([]);
                return;
            }

            // 3. Run the packer for current slab
            const packer = new Packer((slab as any).width_cm, (slab as any).height_cm);
            packer.fit(itemsForThisSlab);

            // 4. Save result for this slab
            layouts.push(itemsForThisSlab);

            // 5. Update remaining items
            remainingItems = itemsForThisSlab.filter(item => !item.fit);
        });

        // 6. Update state
        setPackedLayouts(layouts);
        setUnpackedItems(remainingItems);
    };

    // Re-pack whenever slabs or pieces change
    useEffect(() => {
        packItems();
    }, [slabs, pieces]);

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

    }, [materialItems, selectedMaterialId, mockMaterials]);

    const scale = 150; // pixels per meter (legacy for meter-based view)
    const cmScale = 3; // pixels per centimeter for slab-based view

    return (
        <Modal isOpen={true} onClose={onClose} title="Otimizador de Corte" className="max-w-6xl">
            <div className="flex flex-col md:flex-row gap-4 h-full">
                {/* Visualization */}
                <div className="flex-1 bg-slate-100 dark:bg-slate-900 rounded p-4 overflow-auto">
                    <h4 className="font-semibold mb-2">Visualização da Chapa</h4>
                    <div className="flex items-center justify-center gap-4 my-4">
                        <Button
                            onClick={() => setCurrentSlabIndex(i => Math.max(0, i - 1))}
                            disabled={currentSlabIndex === 0}
                            variant="outline"
                        >
                            Anterior
                        </Button>
                        <span className="font-semibold">
                            Chapa {currentSlabIndex + 1} de {slabs.length}
                        </span>
                        <Button
                            onClick={() => setCurrentSlabIndex(i => Math.min(slabs.length - 1, i + 1))}
                            disabled={currentSlabIndex >= slabs.length - 1}
                            variant="outline"
                        >
                            Próxima
                        </Button>
                    </div>

                    {slabs[currentSlabIndex] && (packedLayouts[currentSlabIndex]?.length ?? 0) >= 0 ? (
                        (() => {
                            const currentSlab = slabs[currentSlabIndex];
                            const currentLayout = packedLayouts[currentSlabIndex] || [];
                            const itemsToDraw = currentLayout.filter((it: any) => it.fit === true);
                            return (
                                <div
                                    className="relative bg-slate-300 dark:bg-slate-600 border-2 border-slate-400 dark:border-slate-500"
                                    style={{ width: (currentSlab as any).width_cm * cmScale, height: (currentSlab as any).height_cm * cmScale }}
                                    title={`Chapa ${(currentSlab as any).width_cm}cm x ${(currentSlab as any).height_cm}cm`}
                                >
                                    {itemsToDraw.map((it: any, idx: number) => (
                                        <div
                                            key={idx}
                                            className="absolute bg-primary/80 border border-blue-800 text-white text-xs flex items-center justify-center p-1 overflow-hidden"
                                            style={{
                                                left: (it.x || 0) * cmScale,
                                                top: (it.y || 0) * cmScale,
                                                width: (it.w || 0) * cmScale,
                                                height: (it.h || 0) * cmScale,
                                            }}
                                            title={`${it.description || it.id || 'Peça'} (${it.w}x${it.h} cm)`}
                                        >
                                            <span className="truncate">{(it.description || it.id || 'Peça').toString()}</span>
                                        </div>
                                    ))}
                                </div>
                            );
                        })()
                    ) : (
                        <div className="flex items-center justify-center h-full text-text-secondary dark:text-slate-400">
                            <p>Nenhuma chapa ou layout disponível.</p>
                        </div>
                    )}

                    {unpackedItems.length > 0 && (
                        <div className="p-4 bg-yellow-100 border border-yellow-300 rounded-md text-center mt-4">
                            <p className="font-semibold text-yellow-800">
                                {unpackedItems.length} peça(s) não coube(ram) nas chapas selecionadas.
                            </p>
                            <Button 
                                variant="default" 
                                className="mt-2"
                                onClick={() => setIsSlabSelectorOpen(true)}
                            >
                                Adicionar Chapa
                            </Button>
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
                                className="p-2 border rounded w-full bg-slate-50 dark:bg-slate-700 border-border dark:border-slate-600"
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
            {/* Slab Selector Modal */}
            {isSlabSelectorOpen && (
                <Modal isOpen={isSlabSelectorOpen} onClose={() => setIsSlabSelectorOpen(false)} title="Selecionar Chapa">
                    <SlabSelector
                        initialSlab={initialSlab}
                        selectedSlabs={slabs}
                        onSelect={(slab) => {
                            setSlabs(prev => [...prev, slab]);
                            setIsSlabSelectorOpen(false);
                        }}
                        onClose={() => setIsSlabSelectorOpen(false)}
                    />
                </Modal>
            )}
        </Modal>
    );
};

const SlabSelector: React.FC<{ initialSlab: StockItem; selectedSlabs: StockItem[]; onSelect: (slab: StockItem) => void; onClose: () => void; }> = ({ initialSlab, selectedSlabs, onSelect, onClose }) => {
    const { stockItems } = useData();
    const alreadySelectedIds = new Set(selectedSlabs.map(s => s.id));
    const candidates = useMemo(() =>
        stockItems.filter(s => s.materialId === initialSlab.materialId && !alreadySelectedIds.has(s.id)),
        [stockItems, initialSlab.materialId, selectedSlabs]
    );

    return (
        <div className="space-y-3">
            {candidates.length === 0 ? (
                <p className="text-text-secondary dark:text-slate-400">Nenhuma chapa adicional disponível para este material.</p>
            ) : (
                <div className="max-h-80 overflow-auto border border-border dark:border-slate-700 rounded">
                    <table className="w-full text-left text-sm">
                        <thead>
                            <tr className="border-b border-border dark:border-slate-700">
                                <th className="p-2">ID</th>
                                <th className="p-2">Dimensões</th>
                                <th className="p-2">Local</th>
                                <th className="p-2 text-right">Ação</th>
                            </tr>
                        </thead>
                        <tbody>
                            {candidates.map(slab => (
                                <tr key={slab.id} className="border-b border-border dark:border-slate-700 last:border-b-0">
                                    <td className="p-2 font-mono">{slab.id}</td>
                                    <td className="p-2">{(slab as any).width_cm} x {(slab as any).height_cm} cm</td>
                                    <td className="p-2">{(slab as any).location || '-'}</td>
                                    <td className="p-2 text-right">
                                        <Button size="sm" onClick={() => onSelect(slab)}>Selecionar</Button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
            <div className="flex justify-end gap-2">
                <Button variant="ghost" onClick={onClose}>Fechar</Button>
            </div>
        </div>
    );
};

export default CuttingOptimizer;