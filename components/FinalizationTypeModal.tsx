import React, { FC, useState } from 'react';
import type { FinalizationType } from '../types';
import Modal from './ui/Modal';
import Button from './ui/Button';

interface FinalizationTypeModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (type: FinalizationType) => void;
}

const FinalizationTypeModal: FC<FinalizationTypeModalProps> = ({ isOpen, onClose, onConfirm }) => {
    const [selectedType, setSelectedType] = useState<FinalizationType | null>(null);

    const handleConfirm = () => {
        if (selectedType) {
            onConfirm(selectedType);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Finalizar Produção">
            <div className="space-y-6">
                <div>
                    <h4 className="text-md font-semibold text-text-primary dark:text-slate-100 mb-2">Qual o próximo passo para esta Ordem de Serviço?</h4>
                    <p className="text-sm text-text-secondary dark:text-slate-400">Sua escolha definirá se a OS irá para a Logística ou aguardará a retirada pelo cliente.</p>
                </div>
                <div className="flex flex-col space-y-3">
                     <Button
                        variant={selectedType === 'pickup' ? 'primary' : 'ghost'}
                        onClick={() => setSelectedType('pickup')}
                        className="w-full justify-start text-left p-4 h-auto"
                    >
                        <div className="flex items-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>
                            <div>
                                <p className="font-semibold">Retirada pelo Cliente</p>
                                <p className="text-xs font-normal">A OS será movida para "Aguardando Retirada" e não entrará no fluxo de logística.</p>
                            </div>
                        </div>
                    </Button>
                     <Button
                        variant={selectedType === 'delivery_only' ? 'primary' : 'ghost'}
                        onClick={() => setSelectedType('delivery_only')}
                        className="w-full justify-start text-left p-4 h-auto"
                    >
                         <div className="flex items-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17H6v-6l7-4h5v6h-2" /></svg>
                            <div>
                                <p className="font-semibold">Apenas Entrega</p>
                                <p className="text-xs font-normal">A OS será enviada para o painel de Logística para agendamento da entrega.</p>
                            </div>
                        </div>
                    </Button>
                     <Button
                        variant={selectedType === 'delivery_installation' ? 'primary' : 'ghost'}
                        onClick={() => setSelectedType('delivery_installation')}
                        className="w-full justify-start text-left p-4 h-auto"
                    >
                         <div className="flex items-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                            <div>
                                <p className="font-semibold">Entrega e Instalação</p>
                                <p className="text-xs font-normal">A OS será enviada para a Logística para agendamento de entrega e instalação.</p>
                            </div>
                        </div>
                    </Button>
                </div>
            </div>
            <div className="flex justify-end mt-8 pt-4 border-t border-border dark:border-slate-700 space-x-3">
                <Button variant="ghost" onClick={onClose}>Cancelar</Button>
                <Button onClick={handleConfirm} disabled={!selectedType}>Confirmar e Mover</Button>
            </div>
        </Modal>
    );
};

export default FinalizationTypeModal;
