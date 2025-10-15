import React, { useState, useRef, MouseEvent, useMemo, useEffect } from 'react';
import Modal from './ui/Modal';
import Button from './ui/Button';
import Card, { CardContent } from './ui/Card';

interface Point {
    x: number;
    y: number;
}

interface ShapeDesignerProps {
    isOpen: boolean;
    onClose: () => void;
    onComplete: (data: { area: number; points: Point[] }) => void;
}

const GRID_SIZE = 20; // pixels per step
const GRID_STEP = 0.1; // meters per step
const SCALE = GRID_SIZE / GRID_STEP; // pixels per meter

const ShapeDesigner: React.FC<ShapeDesignerProps> = ({ isOpen, onClose, onComplete }) => {
    const [points, setPoints] = useState<Point[]>([]);
    const [cursorPos, setCursorPos] = useState<Point>({ x: 0, y: 0 });
    const svgRef = useRef<SVGSVGElement>(null);
    const isClosed = useMemo(() => {
        if (points.length < 3) return false;
        const first = points[0];
        const last = points[points.length - 1];
        return first.x === last.x && first.y === last.y;
    }, [points]);

    const calculateArea = (verts: Point[]): number => {
        if (verts.length < 3) return 0;
        let area = 0;
        for (let i = 0; i < verts.length; i++) {
            const p1 = verts[i];
            const p2 = verts[(i + 1) % verts.length];
            area += (p1.x * p2.y - p2.x * p1.y);
        }
        return Math.abs(area / 2);
    };

    const areaInMeters = useMemo(() => calculateArea(points) / (SCALE * SCALE), [points]);

    const snapToGrid = (val: number) => Math.round(val / GRID_SIZE) * GRID_SIZE;

    const getSVGPoint = (e: MouseEvent<SVGSVGElement>): Point => {
        if (!svgRef.current) return { x: 0, y: 0 };
        const pt = svgRef.current.createSVGPoint();
        pt.x = e.clientX;
        pt.y = e.clientY;
        const svgP = pt.matrixTransform(svgRef.current.getScreenCTM()?.inverse());
        return {
            x: snapToGrid(svgP.x),
            y: snapToGrid(svgP.y)
        };
    };

    const handleMouseMove = (e: MouseEvent<SVGSVGElement>) => {
        setCursorPos(getSVGPoint(e));
    };

    const handleClick = (e: MouseEvent<SVGSVGElement>) => {
        if (isClosed) return;
        const newPoint = getSVGPoint(e);

        if (points.length > 0 && newPoint.x === points[points.length - 1].x && newPoint.y === points[points.length - 1].y) {
            return; // Avoid adding a point at the same location as the previous one
        }

        if (points.length > 2 && Math.hypot(newPoint.x - points[0].x, newPoint.y - points[0].y) < GRID_SIZE / 2) {
            // Close the shape by snapping to the first point
            setPoints(prev => [...prev, points[0]]);
        } else {
            setPoints(prev => [...prev, newPoint]);
        }
    };

    const handleClear = () => {
        setPoints([]);
    };

    const handleUndo = () => {
        setPoints(prev => prev.slice(0, -1));
    };

    const handleComplete = () => {
        if (!isClosed || areaInMeters === 0) {
            alert("Por favor, desenhe uma forma fechada válida.");
            return;
        }
        const pointsInMeters = points.map(p => ({ x: p.x / SCALE, y: p.y / SCALE }));
        onComplete({ area: areaInMeters, points: pointsInMeters });
    };

    useEffect(() => {
        if (!isOpen) {
            setPoints([]);
        }
    }, [isOpen]);

    const renderDimension = (p1: Point, p2: Point, key: string) => {
        const midX = (p1.x + p2.x) / 2;
        const midY = (p1.y + p2.y) / 2;
        const lengthInMeters = Math.hypot(p2.x - p1.x, p2.y - p1.y) / SCALE;

        if (lengthInMeters < 0.01) return null;

        const angle = Math.atan2(p2.y - p1.y, p2.x - p1.x);
        const offsetX = -Math.sin(angle) * 15;
        const offsetY = Math.cos(angle) * 15;

        return (
            <text
                key={key}
                x={midX + offsetX}
                y={midY + offsetY}
                fontSize="10"
                textAnchor="middle"
                alignmentBaseline="middle"
                className="fill-text-primary dark:fill-slate-200 pointer-events-none font-sans"
            >
                {lengthInMeters.toFixed(2)}m
            </text>
        );
    }

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Designer de Peça Customizada" className="max-w-6xl h-[90vh]">
            <div className="flex flex-col md:flex-row gap-4 h-full">
                <div className="flex-1 bg-slate-100 dark:bg-slate-900 rounded p-4 overflow-auto">
                    <svg
                        ref={svgRef}
                        width="100%"
                        height="100%"
                        className="cursor-crosshair bg-white dark:bg-slate-800"
                        onClick={handleClick}
                        onMouseMove={handleMouseMove}
                    >
                        <defs>
                            <pattern id="grid" width={GRID_SIZE} height={GRID_SIZE} patternUnits="userSpaceOnUse">
                                <path d={`M ${GRID_SIZE} 0 L 0 0 0 ${GRID_SIZE}`} fill="none" stroke="rgba(200,200,200,0.5)" strokeWidth="0.5" />
                            </pattern>
                        </defs>
                        <rect width="100%" height="100%" fill="url(#grid)" />
                        
                        <polygon points={points.map(p => `${p.x},${p.y}`).join(' ')} fill={isClosed ? "rgba(30, 64, 175, 0.5)" : "none"} stroke="#1e40af" strokeWidth="2" />

                        {points.length > 0 && !isClosed && (
                            <line
                                x1={points[points.length - 1].x}
                                y1={points[points.length - 1].y}
                                x2={cursorPos.x}
                                y2={cursorPos.y}
                                stroke="#1e40af"
                                strokeWidth="1"
                                strokeDasharray="4"
                            />
                        )}

                        {points.map((p, i) => (
                            <circle key={i} cx={p.x} cy={p.y} r="3" fill={i === 0 ? "#dc2626" : "#1e40af"} className="pointer-events-none" />
                        ))}

                        {points.length > 2 && !isClosed && Math.hypot(cursorPos.x - points[0].x, cursorPos.y - points[0].y) < GRID_SIZE && (
                             <circle cx={points[0].x} cy={points[0].y} r="6" fill="rgba(220, 38, 38, 0.5)" className="pointer-events-none" />
                        )}

                        {/* Dimension Labels */}
                        {points.map((p1, i) => {
                            if (i === points.length - 1) return null;
                            const p2 = points[i + 1];
                            return renderDimension(p1, p2, `line-${i}`);
                        })}
                        {points.length > 0 && !isClosed && renderDimension(points[points.length-1], cursorPos, 'live-line')}


                    </svg>
                </div>
                 <div className="w-full md:w-80 flex flex-col gap-4">
                     <Card>
                        <CardContent>
                            <h4 className="font-semibold mb-2">Instruções</h4>
                            <ul className="list-disc list-inside text-sm text-text-secondary dark:text-slate-400 space-y-1">
                                <li>Clique na grade para adicionar pontos.</li>
                                <li>A grade representa {GRID_STEP}m por quadrado.</li>
                                <li>Clique no ponto inicial (vermelho) para fechar a forma.</li>
                                <li>Use 'Desfazer' para remover o último ponto.</li>
                            </ul>
                        </CardContent>
                    </Card>
                     <Card>
                        <CardContent>
                            <h4 className="font-semibold mb-2">Medidas</h4>
                            <p className="text-2xl font-bold text-primary">{areaInMeters.toFixed(3)} m²</p>
                            <p className="text-sm text-text-secondary dark:text-slate-400">Área Calculada</p>
                        </CardContent>
                    </Card>
                    <div className="mt-auto space-y-2">
                         <div className="grid grid-cols-2 gap-2">
                             <Button variant="ghost" onClick={handleUndo} disabled={points.length === 0}>Desfazer</Button>
                             <Button variant="secondary" onClick={handleClear} className="w-full">Limpar</Button>
                         </div>
                        <Button onClick={handleComplete} disabled={!isClosed} className="w-full">Confirmar Forma</Button>
                    </div>
                </div>
            </div>
        </Modal>
    );
};

export default ShapeDesigner;