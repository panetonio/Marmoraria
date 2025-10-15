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
    const sortedItems = [...items].sort((a, b) => Math.max(b.height!, b.width!) - Math.max(a.height!, a.width!));
    
    let currentX = 0;
    let currentY = 0;
    let shelfHeight = 0;
    
    const packedItems = sortedItems.map(item => {
        const itemWidth = item.width!;
        const itemHeight = item.height!;
        
        if (currentX + itemWidth > slabWidth) {
            currentY += shelfHeight;
            currentX = 0;
            shelfHeight = 0;
        }
        
        if (currentY + itemHeight <= slabHeight) {
            const placement = { x: currentX, y: currentY, fit: true };
            currentX += itemWidth;
            shelfHeight = Math.max(shelfHeight, itemHeight);
            return { ...item, placement };
        }
        
        return { ...item, placement: { x: 0, y: 0, fit: false } };
    });

    return packedItems;
};

const CuttingOptimizer: React.FC<CuttingOptimizerProps> = ({ items, onClose, onComplete }) => {
    const [selectedMaterialId, setSelectedMaterialId] = useState<string | null>(items[0]?.materialId || null);

    const { packedItems, wastePercentage, material } = useMemo(() => {
        if (!selectedMaterialId) return { packedItems: [], wastePercentage: 100, material: null };
        
        const material = mockMaterials.find(m => m.id === selectedMaterialId)!;
        const itemsForMaterial = items.filter(i => i.materialId === selectedMaterialId);
        
        const packed = packRects(material.slabWidth, material.slabHeight, itemsForMaterial);
        
        const usedArea = packed.reduce((acc, item) => {
            return item.placement.fit ? acc + (item.width! * item.height!) : acc;
        }, 0);
        
        const totalArea = material.slabWidth * material.slabHeight;
        const waste = totalArea > 0 ? 100 - (usedArea / totalArea) * 100 : 100;

        return { packedItems: packed, wastePercentage: waste, material };

    }, [items, selectedMaterialId]);

    const scale = 150; // pixels per meter

    return (
        <Modal isOpen={true} onClose={onClose} title="Otimizador de Corte" className="max-w-6xl">
            <div className="flex flex-col md:flex-row gap-4 h-full">
                {/* Visualization */}
                <div className="flex-1 bg-slate-100 dark:bg-slate-900 rounded p-4 overflow-auto">
                    <h4 className="font-semibold mb-2">Visualização da Chapa</h4>
                    {material && (
                        <div 
                            className="relative bg-slate-300 dark:bg-slate-600 border-2 border-slate-400 dark:border-slate-500"
                            style={{ width: material.slabWidth * scale, height: material.slabHeight * scale }}
                        >
                            {packedItems.map(item => item.placement.fit && (
                                <div 
                                    key={item.id}
                                    className="absolute bg-blue-500 border border-blue-800 text-white text-xs flex items-center justify-center p-1"
                                    style={{
                                        left: item.placement.x * scale,
                                        top: item.placement.y * scale,
                                        width: item.width! * scale,
                                        height: item.height! * scale,
                                    }}
                                >
                                    <span>{item.description.split(' - ')[0]}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
                
                {/* Details */}
                <div className="w-full md:w-1/3 flex flex-col gap-4">
                    <div className="bg-surface dark:bg-dark border border-border dark:border-slate-700 rounded-lg p-4">
                        <h4 className="font-semibold mb-2">Material</h4>
                        <p>{material?.name || 'N/A'}</p>
                        <p className="text-sm text-text-secondary dark:text-slate-400">Dimensões da chapa: {material?.slabWidth}m x {material?.slabHeight}m</p>
                    </div>
                     <div className="bg-surface dark:bg-dark border border-border dark:border-slate-700 rounded-lg p-4">
                        <h4 className="font-semibold mb-2">Resultados</h4>
                        <div className="text-2xl font-bold text-error">
                            {wastePercentage.toFixed(2)}% de Perda
                        </div>
                         <div className="text-lg font-semibold text-success mt-1">
                            {(100 - wastePercentage).toFixed(2)}% de Aproveitamento
                        </div>
                         <p className="text-sm mt-2 text-text-secondary dark:text-slate-400">
                            {packedItems.filter(i => !i.placement.fit).length} peça(s) não coube(ram) na chapa.
                         </p>
                    </div>
                    <div className="bg-surface dark:bg-dark border border-border dark:border-slate-700 rounded-lg p-4 flex-1 overflow-y-auto">
                         <h4 className="font-semibold mb-2">Lista de Peças</h4>
                         <ul>
                             {packedItems.map(item => (
                                 <li key={item.id} className={`flex justify-between items-center text-sm p-1 rounded ${item.placement.fit ? 'bg-green-100 dark:bg-green-900/50' : 'bg-red-100 dark:bg-red-900/50'}`}>
                                     <span>{item.description} ({item.width}x{item.height})</span>
                                     <span>{item.placement.fit ? 'OK' : 'Não Coube'}</span>
                                 </li>
                             ))}
                         </ul>
                    </div>
                    <Button 
                        onClick={() => onComplete(packedItems, wastePercentage)} 
                        className="w-full"
                    >
                        Confirmar e Aplicar
                    </Button>
                </div>
            </div>
        </Modal>
    );
};

export default CuttingOptimizer;