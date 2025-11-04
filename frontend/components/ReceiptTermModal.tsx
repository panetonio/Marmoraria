import React, { useState } from 'react';
import type { ServiceOrder } from '../types';
import Modal from './ui/Modal';
import Button from './ui/Button';
import Input from './ui/Input';
import ReceiptTermContent from './ReceiptTermContent';
import SignaturePad from './SignaturePad';
import { api } from '../utils/api';

declare const html2canvas: any;
declare const jspdf: any;

interface ReceiptTermModalProps {
    order: ServiceOrder;
    isOpen: boolean;
    onClose: () => void;
}

const ReceiptTermModal: React.FC<ReceiptTermModalProps> = ({ order, isOpen, onClose }) => {
    const [isGenerating, setIsGenerating] = useState(false);
    const [signatoryName, setSignatoryName] = useState('');
    const [signatoryDocument, setSignatoryDocument] = useState('');
    const [signatureDataUrl, setSignatureDataUrl] = useState<string | null>(null);

    const handleGeneratePdf = async () => {
        // Validações obrigatórias
        if (!signatoryName.trim()) {
            alert('Por favor, preencha o nome do responsável pela conferência.');
            return;
        }

        if (!signatoryDocument.trim()) {
            alert('Por favor, preencha o documento (RG ou CPF) do responsável.');
            return;
        }

        if (!signatureDataUrl) {
            alert('Por favor, colete a assinatura do responsável.');
            return;
        }

        const printableArea = document.getElementById('receipt-term-printable-area');
        if (!printableArea || isGenerating) return;

        setIsGenerating(true);

        try {
            // Salvar dados do termo no backend (opcional)
            try {
                const termData = {
                    signatoryName: signatoryName.trim(),
                    signatoryDocument: signatoryDocument.trim(),
                    signatureDataUrl: signatureDataUrl
                };
                
                // Aqui você pode implementar uma chamada para salvar os dados do termo
                // await api.updateServiceOrderTermDetails(order.id, termData);
                console.log('Dados do termo de recebimento:', termData);
            } catch (saveError) {
                console.warn('Erro ao salvar dados do termo:', saveError);
                // Continue com a geração do PDF mesmo se o salvamento falhar
            }

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
            pdf.save(`termo-recebimento-${order.id}.pdf`);
        } catch (err) {
            console.error("Error generating PDF:", err);
            alert("Ocorreu um erro ao gerar o PDF. Verifique o console para mais detalhes.");
        } finally {
            setIsGenerating(false);
            onClose(); // Close modal after generation attempt
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Gerar Termo de Recebimento: ${order.id}`} className="max-w-4xl">
            {/* Campos de entrada para dados do signatário */}
            <div className="mb-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                        label="Nome do Responsável pela Conferência"
                        value={signatoryName}
                        onChange={(e) => setSignatoryName(e.target.value)}
                        placeholder="Digite o nome completo"
                        required
                    />
                    <Input
                        label="Documento (RG ou CPF)"
                        value={signatoryDocument}
                        onChange={(e) => setSignatoryDocument(e.target.value)}
                        placeholder="Digite RG ou CPF"
                        required
                    />
                </div>
                
                <div>
                    <label className="block text-sm font-medium text-text-secondary dark:text-slate-400 mb-2">
                        Assinatura do Responsável
                    </label>
                    <SignaturePad onSave={(dataUrl) => setSignatureDataUrl(dataUrl)} />
                    {signatureDataUrl && (
                        <p className="text-sm text-green-600 dark:text-green-400 mt-2">
                            ✅ Assinatura coletada com sucesso
                        </p>
                    )}
                </div>
            </div>

            <div className="flex justify-end mb-4">
                <Button onClick={handleGeneratePdf} disabled={isGenerating}>
                    {isGenerating ? 'Gerando PDF...' : 'Salvar e Gerar PDF'}
                </Button>
            </div>
            
            <div className="bg-slate-200 dark:bg-slate-900 p-4 rounded-lg overflow-y-auto max-h-[60vh]">
                <div className="bg-white">
                     <ReceiptTermContent 
                        order={order} 
                        signatoryName={signatoryName}
                        signatoryDocument={signatoryDocument}
                        signatureDataUrl={signatureDataUrl}
                    />
                </div>
            </div>

            {/* Hidden printable area for better quality capture */}
            <div className="absolute -left-[9999px] top-0 w-[210mm]">
                <div id="receipt-term-printable-area">
                    <ReceiptTermContent 
                        order={order} 
                        signatoryName={signatoryName}
                        signatoryDocument={signatoryDocument}
                        signatureDataUrl={signatureDataUrl}
                    />
                </div>
            </div>
        </Modal>
    );
};

export default ReceiptTermModal;
