import React, { useState, useMemo } from 'react';
import type { Supplier } from '../types';
import Modal from './ui/Modal';
import Button from './ui/Button';
import ReceiptContent from './ReceiptContent';
import Input from './ui/Input';
import Textarea from './ui/Textarea';

declare const html2canvas: any;
declare const jspdf: any;

interface CreateReceiptModalProps {
    supplier: Supplier;
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: { amount: number, description: string }) => void;
}

const CreateReceiptModal: React.FC<CreateReceiptModalProps> = ({ supplier, isOpen, onClose, onSave }) => {
    const [amount, setAmount] = useState(''); // Store as string of digits, e.g. "12550" for 125.50
    const [description, setDescription] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [error, setError] = useState('');

    const receiptId = useMemo(() => {
        const now = new Date();
        const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
        const timeStr = now.toTimeString().slice(0, 8).replace(/:/g, '');
        return `REC-${dateStr}-${timeStr}-${supplier.id.replace('sup-', '')}`;
    }, [supplier.id]);

    const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value.replace(/\D/g, '');
        setAmount(value);
    };

    const formatAmountForDisplay = (digits: string) => {
        if (!digits) return '';
        const padded = digits.padStart(3, '0');
        const integer = padded.slice(0, -2);
        const decimal = padded.slice(-2);
        const formattedInteger = parseInt(integer, 10).toLocaleString('pt-BR');
        return `${formattedInteger},${decimal}`;
    };

    const parsedAmount = useMemo(() => {
        if (!amount) return 0;
        return parseInt(amount, 10) / 100;
    }, [amount]);

    const handleGeneratePdf = async () => {
        if (!amount || !description.trim()) {
            setError('O valor e a descrição são obrigatórios.');
            return;
        }
        setError('');
        const printableArea = document.getElementById('receipt-printable-area');
        if (!printableArea || isGenerating) return;

        setIsGenerating(true);

        try {
            // First, save the data
            onSave({ amount: parsedAmount, description });

            // Then, generate the PDF
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
            pdf.save(`recibo-${receiptId}.pdf`);
        } catch (err) {
            console.error("Error generating PDF:", err);
            alert("Ocorreu um erro ao gerar o PDF. Verifique o console para mais detalhes.");
        } finally {
            setIsGenerating(false);
            onClose();
        }
    };
    
    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Gerar Recibo para ${supplier.name}`} className="max-w-2xl">
            <div className="space-y-4">
                <Input
                    label="Valor (R$)"
                    id="receipt-amount"
                    type="text"
                    placeholder="0,00"
                    value={formatAmountForDisplay(amount)}
                    onChange={handleAmountChange}
                    error={error && !amount ? 'Campo obrigatório' : ''}
                />
                <Textarea
                    label="Referente a"
                    id="receipt-description"
                    rows={3}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Ex: Pagamento de chapa de granito"
                    error={error && !description ? 'Campo obrigatório' : ''}
                />
                {error && <p className="text-error text-center text-sm">{error}</p>}
            </div>

            <div className="flex justify-end mt-6 space-x-3">
                <Button variant="ghost" onClick={onClose}>Cancelar</Button>
                <Button onClick={handleGeneratePdf} disabled={isGenerating}>
                    {isGenerating ? 'Gerando...' : 'Salvar e Gerar PDF'}
                </Button>
            </div>

            {/* Hidden printable area */}
            <div className="absolute -left-[9999px] top-0 w-[210mm]">
                 <div id="receipt-printable-area">
                    <ReceiptContent receipt={{
                        id: receiptId,
                        amount: parsedAmount,
                        description,
                        createdAt: new Date().toISOString(),
                        supplierName: supplier.name,
                        cpfCnpj: supplier.cpfCnpj
                    }} />
                </div>
            </div>
        </Modal>
    );
};

export default CreateReceiptModal;