import React, { useState } from 'react';
import type { Receipt } from '../types';
import Modal from './ui/Modal';
import Button from './ui/Button';
import ReceiptContent from './ReceiptContent';

declare const html2canvas: any;
declare const jspdf: any;

interface ViewReceiptModalProps {
    receipt: Receipt;
    isOpen: boolean;
    onClose: () => void;
}

const ViewReceiptModal: React.FC<ViewReceiptModalProps> = ({ receipt, isOpen, onClose }) => {
    const [isGenerating, setIsGenerating] = useState(false);

    const handleGeneratePdf = async () => {
        const printableArea = document.getElementById('view-receipt-printable-area');
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
            pdf.save(`recibo-${receipt.id}.pdf`);
        } catch (err) {
            console.error("Error generating PDF:", err);
            alert("Ocorreu um erro ao gerar o PDF. Verifique o console para mais detalhes.");
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Visualizando Recibo: ${receipt.id}`} className="max-w-4xl">
            <div className="flex justify-end mb-4">
                <Button onClick={handleGeneratePdf} disabled={isGenerating}>
                    {isGenerating ? 'Gerando...' : 'Baixar PDF Novamente'}
                </Button>
            </div>
            
            <div className="bg-slate-200 dark:bg-slate-900 p-4 rounded-lg">
                <div className="transform scale-[0.5] origin-top">
                    <ReceiptContent receipt={receipt} />
                </div>
            </div>

            {/* Hidden printable area */}
            <div className="absolute -left-[9999px] top-0 w-[210mm]">
                <div id="view-receipt-printable-area">
                    <ReceiptContent receipt={receipt} />
                </div>
            </div>
        </Modal>
    );
};

export default ViewReceiptModal;