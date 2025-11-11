import React, { useState, useMemo, useEffect } from 'react';
import type { QuoteItem, Material, StockItem } from '../types';
import { useData } from '../context/DataContext';
import Modal from './ui/Modal';
import Button from './ui/Button';
import Badge from './ui/Badge';
import { calculateArea } from '../utils/helpers';

// External packer and mapper declarations (assumed to exist elsewhere)
declare class Packer {
    constructor(width: number, height: number);
    fit(items: any[]): void;
}

const CM_PER_M = 100;

const normalizeDimensionToCm = (value?: number | null): number => {
    if (value === undefined || value === null) return 0;
    const numeric = Number(value);
    if (!Number.isFinite(numeric) || numeric <= 0) return 0;
    return numeric > 10 ? numeric : numeric * CM_PER_M;
};

const getSlabDimensions = (slab: StockItem) => {
    const rawWidth = (slab as any).width_cm;
    const rawHeight = (slab as any).height_cm;
    const widthCm = typeof rawWidth === 'number' && !Number.isNaN(rawWidth) && rawWidth > 0
        ? rawWidth
        : normalizeDimensionToCm(slab.width);
    const heightCm = typeof rawHeight === 'number' && !Number.isNaN(rawHeight) && rawHeight > 0
        ? rawHeight
        : normalizeDimensionToCm(slab.height);
    return { widthCm, heightCm };
};

interface PackingZone {
    id: 'A' | 'B' | 'FULL';
    x: number;
    y: number;
    width: number;
    height: number;
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
    origW: number;
    origH: number;
    renderW: number;
    renderH: number;
    rotated?: boolean;
    zoneId?: 'A' | 'B' | 'FULL';
}

const mapQuoteItemToPackerItem = (item: QuoteItem, index: number): PackerItem => {
    const widthCm = normalizeDimensionToCm(item.width);
    const heightCm = normalizeDimensionToCm(item.height);

    return {
        id: `${item.id}-copy-${index}`, // ID único para cada cópia
        originalItemId: item.id,
        description: item.description,
        w: widthCm,
        h: heightCm,
        area: widthCm * heightCm,
        quantity: item.quantity ?? 1,
        fit: false,
        x: 0,
        y: 0,
        quoteItem: item,
        origW: widthCm,
        origH: heightCm,
        renderW: widthCm,
        renderH: heightCm,
        rotated: false,
        zoneId: undefined,
    };
};

interface Rect {
    x: number;
    y: number;
    width: number;
    height: number;
}

const rectArea = (rect: Rect) => Math.max(rect.width, 0) * Math.max(rect.height, 0);

const rectIntersectionArea = (a: Rect, b: Rect) => {
    const xOverlap = Math.max(0, Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x));
    const yOverlap = Math.max(0, Math.min(a.y + a.height, b.y + b.height) - Math.max(a.y, b.y));
    return xOverlap * yOverlap;
};

const toNumericPoints = (shapePoints: any[]): { x: number; y: number }[] =>
    shapePoints
        .map(point => ({
            x: Number((point || {}).x),
            y: Number((point || {}).y),
        }))
        .filter(point => Number.isFinite(point.x) && Number.isFinite(point.y));

const computeZonesForSlab = (slab: StockItem, slabDimensions: { widthCm: number; heightCm: number }): PackingZone[] | null => {
    const rawPoints = (slab as any).shapePoints;
    if (!Array.isArray(rawPoints) || rawPoints.length < 6) {
        return null;
    }

    const points = toNumericPoints(rawPoints);
    if (points.length < 6) {
        return null;
    }

    const uniqueX = Array.from(new Set(points.map(p => p.x))).sort((a, b) => a - b);
    const uniqueY = Array.from(new Set(points.map(p => p.y))).sort((a, b) => a - b);

    if (uniqueX.length !== 3 || uniqueY.length !== 3) {
        return null;
    }

    const [minX, midX, maxX] = uniqueX;
    const [minY, midY, maxY] = uniqueY;

    const combos: Array<{ rectA: Rect; rectB: Rect }> = [
        {
            rectA: { x: minX, y: minY, width: midX - minX, height: maxY - minY },
            rectB: { x: midX, y: midY, width: maxX - midX, height: maxY - midY },
        },
        {
            rectA: { x: midX, y: minY, width: maxX - midX, height: maxY - minY },
            rectB: { x: minX, y: midY, width: midX - minX, height: maxY - midY },
        },
        {
            rectA: { x: minX, y: minY, width: maxX - minX, height: midY - minY },
            rectB: { x: midX, y: midY, width: maxX - midX, height: maxY - midY },
        },
        {
            rectA: { x: minX, y: midY, width: maxX - minX, height: maxY - midY },
            rectB: { x: minX, y: minY, width: midX - minX, height: midY - minY },
        },
    ];

    const polygonArea = calculateArea(points);
    const tolerance = Math.max(1, polygonArea * 0.05);

    const isValidRect = (rect: Rect) =>
        rect.width > 0 &&
        rect.height > 0 &&
        rect.x >= 0 &&
        rect.y >= 0 &&
        rect.x + rect.width <= slabDimensions.widthCm + 0.01 &&
        rect.y + rect.height <= slabDimensions.heightCm + 0.01;

    let bestCombo: { rectA: Rect; rectB: Rect; diff: number } | null = null;

    combos.forEach(combo => {
        if (!isValidRect(combo.rectA) || !isValidRect(combo.rectB)) {
            return;
        }

        const unionArea = rectArea(combo.rectA) + rectArea(combo.rectB) - rectIntersectionArea(combo.rectA, combo.rectB);
        const diff = Math.abs(unionArea - polygonArea);

        if (!bestCombo || diff < bestCombo.diff) {
            bestCombo = { rectA: combo.rectA, rectB: combo.rectB, diff };
        }
    });

    if (!bestCombo || bestCombo.diff > tolerance) {
        return null;
    }

    return [
        { id: 'A', ...bestCombo.rectA },
        { id: 'B', ...bestCombo.rectB },
    ];
};

const packZoneGreedy = (items: PackerItem[], zone: PackingZone, allowRotation = true) => {
    let currentX = 0;
    let currentY = 0;
    let shelfHeight = 0;

    const sortedItems = [...items].filter(item => !item.fit).sort((a, b) => {
        const aMax = Math.max(a.origW, a.origH);
        const bMax = Math.max(b.origW, b.origH);
        return bMax - aMax;
    });

    const attemptPlacement = (
        baseX: number,
        baseY: number,
        baseShelf: number,
        zoneWidth: number,
        zoneHeight: number,
        itemWidth: number,
        itemHeight: number
    ) => {
        let x = baseX;
        let y = baseY;
        let shelf = baseShelf;

        if (itemWidth <= 0 || itemHeight <= 0) {
            return null;
        }

        if (x > 0 && x + itemWidth > zoneWidth) {
            y = baseY + baseShelf;
            x = 0;
            shelf = 0;
        }

        if (itemWidth > zoneWidth || itemHeight > zoneHeight || y + itemHeight > zoneHeight) {
            return null;
        }

        return {
            x,
            y,
            nextX: x + itemWidth,
            nextY: y,
            nextShelfHeight: Math.max(shelf, itemHeight),
        };
    };

    sortedItems.forEach(item => {
        const baseWidth = item.origW;
        const baseHeight = item.origH;

        const orientations = allowRotation && Math.abs(baseWidth - baseHeight) > 0.01
            ? [
                { width: baseWidth, height: baseHeight, rotated: false },
                { width: baseHeight, height: baseWidth, rotated: true },
            ]
            : [
                { width: baseWidth, height: baseHeight, rotated: false },
            ];

        let placed = false;

        for (const orientation of orientations) {
            const placement = attemptPlacement(currentX, currentY, shelfHeight, zone.width, zone.height, orientation.width, orientation.height);
            if (placement) {
                item.fit = true;
                item.x = zone.x + placement.x;
                item.y = zone.y + placement.y;
                item.renderW = orientation.width;
                item.renderH = orientation.height;
                item.rotated = orientation.rotated;
                item.zoneId = zone.id;

                currentX = placement.nextX;
                currentY = placement.nextY;
                shelfHeight = placement.nextShelfHeight;
                placed = true;
                break;
            }
        }

        if (!placed) {
            item.fit = false;
            item.rotated = false;
            item.renderW = item.origW;
            item.renderH = item.origH;
        }
    });
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

    /**
     * Multi-slab packing routine
     * --------------------------
     * We no longer rely on the external `Packer` helper. Instead we use a simple
     * greedy "shelf" heuristic that sorts pieces by their largest edge, fills rows
     * from left-to-right, and opens a new shelf when the next piece would overflow.
     * Pieces can be rotated 90° whenever that helps them fit in the current shelf.
     *
     * When a slab defines `shapePoints` that outline an orthogonal "L", we split
     * the polygon into two axis-aligned rectangles (zones A and B) and pack them
     * sequentially: first we try zone A (the largest leg), then we re-run the
     * heuristic for the items that did not fit in zone B. Every placement keeps
     * track of its zone, rotation state and final width/height so the viewer can
     * render the real polygon rather than a bounding box.
     */
    const packItems = () => {
        // 1. Map all pieces to packer format, expanding by quantity
        const expandedItems: PackerItem[] = [];

        pieces.forEach(item => {
            const quantity = item.quantity && item.quantity > 0 ? item.quantity : 1;
            for (let i = 0; i < quantity; i++) {
                expandedItems.push(mapQuoteItemToPackerItem(item, i));
            }
        });

        // Prepare initial state with original dimensions preserved
        let remainingItems: PackerItem[] = expandedItems.map(item => ({
            ...item,
            fit: false,
            rotated: false,
            renderW: item.origW,
            renderH: item.origH,
            zoneId: undefined,
        }));

        const layouts: PackerItem[][] = [];

        // 2. Iterate over each available slab
        slabs.forEach((slab) => {
            if (remainingItems.length === 0) {
                layouts.push([]);
                return;
            }

            const slabDimensions = getSlabDimensions(slab);
            const candidateZones = computeZonesForSlab(slab, slabDimensions) ?? [
                { id: 'FULL', x: 0, y: 0, width: slabDimensions.widthCm, height: slabDimensions.heightCm },
            ];

            // Clone remaining items for this slab to avoid mutating the queue for subsequent slabs
            const itemsForThisSlab: PackerItem[] = remainingItems.map(item => ({
                ...item,
                fit: false,
                rotated: false,
                renderW: item.origW,
                renderH: item.origH,
                zoneId: undefined,
            }));

            candidateZones.forEach(zone => {
                packZoneGreedy(itemsForThisSlab, zone, true);
            });

            layouts.push(itemsForThisSlab.map(item => ({ ...item })));

            // Items that did not fit move on to the next slab
            remainingItems = itemsForThisSlab
                .filter(item => !item.fit)
                .map(item => ({
                    ...item,
                    fit: false,
                    rotated: false,
                    renderW: item.origW,
                    renderH: item.origH,
                    zoneId: undefined,
                }));
        });

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
                            const currentLayout = (packedLayouts[currentSlabIndex] || []) as PackerItem[];
                            const { widthCm, heightCm } = getSlabDimensions(currentSlab);
                            const renderWidthPx = widthCm * cmScale;
                            const renderHeightPx = heightCm * cmScale;

                            const polygonSource = Array.isArray((currentSlab as any).shapePoints) && (currentSlab as any).shapePoints.length >= 3
                                ? toNumericPoints((currentSlab as any).shapePoints)
                                : [
                                    { x: 0, y: 0 },
                                    { x: widthCm, y: 0 },
                                    { x: widthCm, y: heightCm },
                                    { x: 0, y: heightCm },
                                ];

                            const polygonPoints = polygonSource
                                .map(point => `${point.x * cmScale},${point.y * cmScale}`)
                                .join(' ');

                            const itemsToDraw = currentLayout.filter((it: PackerItem) => it.fit);

                            return (
                                <svg
                                    width={renderWidthPx}
                                    height={renderHeightPx}
                                    className="bg-slate-200 dark:bg-slate-700 border-2 border-slate-400 dark:border-slate-500 rounded"
                                    role="img"
                                    aria-label="Disposição das peças na chapa selecionada"
                                >
                                    <polygon
                                        points={polygonPoints}
                                        fill="#e2e8f0"
                                        stroke="#94a3b8"
                                        strokeWidth={1.5}
                                    />

                                    {itemsToDraw.map((item) => {
                                        const itemWidth = item.renderW ?? item.w ?? 0;
                                        const itemHeight = item.renderH ?? item.h ?? 0;
                                        if (itemWidth <= 0 || itemHeight <= 0) {
                                            return null;
                                        }

                                        const xPx = (item.x ?? 0) * cmScale;
                                        const yPx = (item.y ?? 0) * cmScale;
                                        const widthPx = itemWidth * cmScale;
                                        const heightPx = itemHeight * cmScale;
                                        const fillColor = item.rotated ? 'rgba(34,197,94,0.75)' : 'rgba(59,130,246,0.75)';
                                        const strokeDasharray = item.rotated ? '6 4' : undefined;
                                        const zoneLabel = item.zoneId ? `Zona ${item.zoneId}` : 'Zona';

                                        return (
                                            <g key={item.id}>
                                                <rect
                                                    x={xPx}
                                                    y={yPx}
                                                    width={widthPx}
                                                    height={heightPx}
                                                    fill={fillColor}
                                                    stroke="#1e3a8a"
                                                    strokeWidth={1.5}
                                                    strokeDasharray={strokeDasharray}
                                                    rx={3}
                                                    ry={3}
                                                />
                                                <title>{`${item.description ?? item.id} | ${zoneLabel}${item.rotated ? ' (rotacionada)' : ''}`}</title>
                                                <text
                                                    x={xPx + widthPx / 2}
                                                    y={yPx + heightPx / 2}
                                                    textAnchor="middle"
                                                    dominantBaseline="middle"
                                                    fill="#ffffff"
                                                    fontSize={Math.max(10, Math.min(widthPx, heightPx) / 4)}
                                                    pointerEvents="none"
                                                >
                                                    {(item.description || item.id || 'Peça').toString().slice(0, 20)}
                                                    {item.rotated ? ' (R)' : ''}
                                                </text>
                                            </g>
                                        );
                                    })}
                                </svg>
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
                        items={pieces}
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

const SlabSelector: React.FC<{ initialSlab: StockItem; selectedSlabs: StockItem[]; items: QuoteItem[]; onSelect: (slab: StockItem) => void; onClose: () => void; }> = ({ initialSlab, selectedSlabs, items, onSelect, onClose }) => {
    const { stockItems } = useData();
    const alreadySelectedIds = new Set(selectedSlabs.map(s => s.id));
    const candidates = useMemo(() =>
        stockItems.filter(s => s.materialId === initialSlab.materialId && !alreadySelectedIds.has(s.id)),
        [stockItems, initialSlab.materialId, selectedSlabs]
    );

    const materialItems = useMemo(
        () => (Array.isArray(items) ? items.filter(item => item.type === 'material') : []),
        [items]
    );

    const smallPieceCategories = useMemo(() => new Set(['soleira', 'peitoril']), []);

    const isSmallPieceOrder = useMemo(() => {
        if (materialItems.length === 0) return false;
        const smallCount = materialItems.filter(item => smallPieceCategories.has(String(item.category ?? '').toLowerCase())).length;
        if (smallCount === 0) return false;
        return smallCount === materialItems.length || smallCount / materialItems.length >= 0.6;
    }, [materialItems, smallPieceCategories]);

    const retalhoScore = (slab: StockItem) => (slab.status === 'partial' || Boolean(slab.parentSlabId) ? 1 : 0);

    const sortedCandidates = useMemo(() => {
        if (!isSmallPieceOrder) return candidates;
        return [...candidates].sort((a, b) => retalhoScore(b) - retalhoScore(a));
    }, [candidates, isSmallPieceOrder]);

    const formatDimensions = (slab: StockItem) => {
        const rawWidthCm = (slab as any).width_cm;
        const rawHeightCm = (slab as any).height_cm;
        const widthCm = typeof rawWidthCm === 'number' && !Number.isNaN(rawWidthCm) && rawWidthCm > 0
            ? rawWidthCm
            : Math.round((slab.width ?? 0) * 100);
        const heightCm = typeof rawHeightCm === 'number' && !Number.isNaN(rawHeightCm) && rawHeightCm > 0
            ? rawHeightCm
            : Math.round((slab.height ?? 0) * 100);
        if (widthCm <= 0 || heightCm <= 0) {
            return '—';
        }
        return `${widthCm} x ${heightCm} cm`;
    };

    return (
        <div className="space-y-3">
            {sortedCandidates.length === 0 ? (
                <p className="text-text-secondary dark:text-slate-400">Nenhuma chapa adicional disponível para este material.</p>
            ) : (
                <div className="max-h-80 overflow-auto border border-border dark:border-slate-700 rounded">
                    {isSmallPieceOrder && (
                        <div className="px-3 py-2 bg-amber-50 dark:bg-amber-900/20 border-b border-border dark:border-slate-700 text-sm text-amber-800 dark:text-amber-200">
                            Sugestão: Para Soleiras e Peitoris, verifique os retalhos disponíveis primeiro.
                        </div>
                    )}
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
                            {sortedCandidates.map(slab => {
                                const isRetalho = slab.status === 'partial' || Boolean(slab.parentSlabId);
                                return (
                                <tr key={slab.id} className="border-b border-border dark:border-slate-700 last:border-b-0">
                                    <td className="p-2 font-mono">
                                        <div className="flex items-center gap-2">
                                            <span>{slab.id}</span>
                                            {isRetalho && <Badge variant="warning">Retalho</Badge>}
                                        </div>
                                    </td>
                                    <td className="p-2">{formatDimensions(slab)}</td>
                                    <td className="p-2">{(slab as any).location || '-'}</td>
                                    <td className="p-2 text-right">
                                        <Button size="sm" onClick={() => onSelect(slab)}>Selecionar</Button>
                                    </td>
                                </tr>
                                );
                            })}
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