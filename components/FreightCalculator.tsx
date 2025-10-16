import React, { useState, useMemo } from 'react';
import Modal from './ui/Modal';
import Button from './ui/Button';
import Input from './ui/Input';

interface FreightCalculatorProps {
    isOpen: boolean;
    onClose: () => void;
    onApply: (freightCost: number) => void;
    costPerKm: number;
}

const FreightCalculator: React.FC<FreightCalculatorProps> = ({ isOpen, onClose, onApply, costPerKm }) => {
    const [distance, setDistance] = useState('');

    const totalFreight = useMemo(() => {
        const numericDistance = parseFloat(distance);
        if (isNaN(numericDistance) || numericDistance <= 0) {
            return 0;
        }
        return numericDistance * costPerKm;
    }, [distance, costPerKm]);

    const handleApply = () => {
        onApply(totalFreight);
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Calculadora de Frete">
            <div className="space-y-4">
                <Input
                    label="Distância (km)"
                    id="freight-distance"
                    type="number"
                    placeholder="Ex: 50"
                    value={distance}
                    onChange={(e) => setDistance(e.target.value)}
                />
                <div className="p-4 bg-slate-100 dark:bg-slate-800/50 rounded-lg text-center">
                    <p className="text-sm text-text-secondary dark:text-slate-400">
                        Custo por KM: {costPerKm.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </p>
                    <p className="text-2xl font-bold text-primary mt-2">
                        Total do Frete: {totalFreight.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </p>
                </div>
            </div>
            <div className="flex justify-end mt-6 space-x-3">
                <Button variant="ghost" onClick={onClose}>Cancelar</Button>
                <Button onClick={handleApply} disabled={totalFreight <= 0}>Aplicar Frete</Button>
            </div>
        </Modal>
    );
};

export default FreightCalculator;