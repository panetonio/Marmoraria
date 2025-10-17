import React, { useState } from 'react';
import type { ServiceOrder } from '../types';
import Modal from './ui/Modal';
import Button from './ui/Button';
import InstallationTermContent from './InstallationTermContent';

declare const html2canvas: any;
declare const jspdf: any;

interface InstallationTermModalProps {
    order: ServiceOrder;
    isOpen: boolean;
    onClose: () => void;
}

const InstallationTermModal: React.FC<InstallationTermModalProps> = ({ order, isOpen, onClose }) => {
    const [isGenerating, setIsGenerating] = useState(false);

    const handleGeneratePdf = async () => {
        const printableArea = document.getElementById('install-term-printable-area');
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
            pdf.save(`termo-instalacao-${order.id}.pdf`);
        } catch (err) {
            console.error("Error generating PDF:", err);
            alert("Ocorreu um erro ao gerar o PDF. Verifique o console para mais detalhes.");
        } finally {
            setIsGenerating(false);
            onClose(); // Close modal after generation attempt
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Gerar Termo de Instalação: ${order.id}`} className="max-w-4xl">
            <div className="flex justify-end mb-4">
                <Button onClick={handleGeneratePdf} disabled={isGenerating}>
                    {isGenerating ? 'Gerando PDF...' : 'Salvar e Gerar PDF'}
                </Button>
            </div>
            
            <div className="bg-slate-200 dark:bg-slate-900 p-4 rounded-lg overflow-y-auto max-h-[60vh]">
                <div className="bg-white">
                     <InstallationTermContent order={order} />
                </div>
            </div>

            {/* Hidden printable area for better quality capture */}
            <div className="absolute -left-[9999px] top-0 w-[210mm]">
                <div id="install-term-printable-area">
                    <InstallationTermContent order={order} />
                </div>
            </div>
        </Modal>
    );
};

export default InstallationTermModal;