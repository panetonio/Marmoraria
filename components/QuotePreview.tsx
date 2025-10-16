import React, { useState } from 'react';
import type { Quote, Order } from '../types';
import { mockUsers } from '../data/mockData';
import Modal from './ui/Modal';
import Button from './ui/Button';


declare const html2canvas: any;
declare const jspdf: any;

interface DocumentPreviewProps {
    document: Quote | Order;
    onClose: () => void;
}

const DocumentPreview: React.FC<DocumentPreviewProps> = ({ document, onClose }) => {
    const [isGenerating, setIsGenerating] = useState(false);
    
    const handleGeneratePdf = async () => {
        // FIX: Explicitly use `window.document` to avoid conflict with the component's `document` prop.
        const printableArea = window.document.getElementById('printable-area');
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
    
            const imgWidth = pdfWidth;
            const imgHeight = canvas.height * imgWidth / canvas.width;
    
            let heightLeft = imgHeight;
            let position = 0;
    
            pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
            heightLeft -= pdfHeight;
    
            while (heightLeft > 0) {
                position -= pdfHeight;
                pdf.addPage();
                pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
                heightLeft -= pdfHeight;
            }
            
            const docType = 'originalQuoteId' in document ? 'pedido' : 'orcamento';
            pdf.save(`${docType}-${document.id}.pdf`);
        } catch (error) {
            console.error("Error generating PDF:", error);
            alert("Ocorreu um erro ao gerar o PDF. Tente novamente.");
        } finally {
            setIsGenerating(false);
        }
    };

    const isOrder = 'originalQuoteId' in document;
    const docTypeLabel = isOrder ? 'PEDIDO' : 'ORÇAMENTO';
    const docDate = isOrder ? (document as Order).approvalDate : document.createdAt;
    
    const clientInfo = {
        name: document.clientName,
        email: 'clientEmail' in document ? document.clientEmail : 'N/A',
        phone: 'clientPhone' in document ? document.clientPhone : 'N/A',
    };
    
    const deliveryAddressLine1 = `${document.deliveryAddress}, ${document.deliveryNumber}${document.deliveryComplement ? ` - ${document.deliveryComplement}` : ''}`;
    const deliveryAddressLine2 = `${document.deliveryNeighborhood} - ${document.deliveryCity}, ${document.deliveryUf}`;
    
    const itemSubtotal = document.items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
    const itemDiscounts = document.items.reduce((sum, item) => sum + (item.discount || 0), 0);

    return (
        <Modal isOpen={true} onClose={onClose} title={`Pré-visualização do ${docTypeLabel}`} className="max-w-4xl">
             <div className="flex justify-end mb-4">
                <Button 
                    onClick={handleGeneratePdf} 
                    disabled={isGenerating} 
                >
                    {isGenerating ? 'Gerando PDF...' : 'Salvar PDF'}
                </Button>
            </div>
            <div className="w-full bg-white mx-auto p-8 border border-border" id="printable-area">
                <header className="flex justify-between items-center pb-6 border-b border-border">
                    <div>
                        <h1 className="text-3xl font-bold text-dark">Marmoraria ERP</h1>
                        <p className="text-text-secondary">Rua das Pedras, 123 - Cidade, Estado</p>
                        <p className="text-text-secondary">contato@marmorariaerp.com | (11) 5555-4444</p>
                    </div>
                    <div className="text-right">
                        <h2 className="text-2xl font-semibold text-gray-700">{docTypeLabel}</h2>
                        <p className="font-mono text-primary">{document.id}</p>
                        <p className="text-text-secondary">Data: {new Date(docDate).toLocaleDateString()}</p>
                        {isOrder && <p className="text-text-secondary text-xs">Orçamento Original: {(document as Order).originalQuoteId}</p>}
                    </div>
                </header>
                
                <section className="mt-8 grid grid-cols-2 gap-4">
                    <div className="bg-slate-50 p-4 rounded-lg">
                        <h3 className="font-semibold text-text-secondary mb-2">CLIENTE:</h3>
                        <p className="font-bold text-dark">{clientInfo.name}</p>
                        <p className="text-slate-800">{clientInfo.email}</p>
                        <p className="text-slate-800">{clientInfo.phone}</p>
                    </div>
                     <div className="bg-slate-50 p-4 rounded-lg">
                        <h3 className="font-semibold text-text-secondary mb-2">VENDEDOR:</h3>
                        <p className="font-bold text-dark">{mockUsers.find(u => u.id === document.salespersonId)?.name || 'N/A'}</p>
                    </div>
                    {document.deliveryAddress && (
                        <div className="bg-slate-50 p-4 rounded-lg col-span-2">
                            <h3 className="font-semibold text-text-secondary mb-2">ENDEREÇO DE ENTREGA:</h3>
                            <p className="font-bold text-dark">{deliveryAddressLine1}</p>
                            <p className="text-dark">{deliveryAddressLine2}</p>
                            {document.deliveryCep && <p className="text-dark">CEP: {document.deliveryCep}</p>}
                        </div>
                    )}
                </section>
                
                <section className="mt-8">
                    <h3 className="text-xl font-semibold text-dark mb-4 border-b border-border pb-2">Itens do {docTypeLabel}</h3>
                    <table className="w-full text-left text-sm">
                        <thead>
                            <tr className="bg-slate-100">
                                <th className="p-2 text-slate-800">Descrição</th>
                                <th className="p-2 text-center text-slate-800">Qtd.</th>
                                <th className="p-2 text-right text-slate-800">Preço Unit.</th>
                                <th className="p-2 text-right text-slate-800">Desconto</th>
                                <th className="p-2 text-right text-slate-800">Subtotal</th>
                            </tr>
                        </thead>
                        <tbody>
                            {document.items.map(item => (
                                <tr key={item.id} className="border-b border-border">
                                    <td className="p-2 text-slate-800">{item.description}</td>
                                    <td className="p-2 text-center text-slate-800">{item.quantity.toFixed(2)}</td>
                                    <td className="p-2 text-right text-slate-800">{item.unitPrice.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                                    <td className="p-2 text-right text-red-600">{item.discount ? `- ${item.discount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}` : '-'}</td>
                                    <td className="p-2 text-right font-semibold text-slate-800">{item.totalPrice.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </section>
                
                <section className="mt-8 flex justify-end">
                    <div className="w-full max-w-sm text-slate-800 space-y-1">
                        <div className="flex justify-between">
                            <span>Subtotal dos Itens:</span>
                            <span>{itemSubtotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                        </div>
                        {itemDiscounts > 0 && (
                             <div className="flex justify-between text-red-600">
                                <span>Descontos nos Itens:</span>
                                <span>- {itemDiscounts.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                            </div>
                        )}
                        <div className="flex justify-between font-semibold border-t border-border pt-1">
                            <span>Subtotal:</span>
                            <span>{document.subtotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                        </div>
                        {document.discount && document.discount > 0 && (
                            <div className="flex justify-between text-red-600">
                                <span>Desconto Geral:</span>
                                <span>- {document.discount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                            </div>
                        )}
                        {document.freight && document.freight > 0 && (
                            <div className="flex justify-between">
                                <span>Frete:</span>
                                <span>+ {document.freight.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                            </div>
                        )}
                        <div className="flex justify-between font-bold text-xl mt-2 pt-2 border-t-2 border-black text-dark">
                            <span>TOTAL:</span>
                            <span className="text-primary">{document.total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                        </div>
                    </div>
                </section>
                
                <footer className="mt-12 pt-6 border-t border-border text-center text-xs text-text-secondary">
                    <p><strong>Condições Gerais:</strong> Validade da proposta: 15 dias. Prazo de entrega a combinar.</p>
                    <p>Agradecemos a sua preferência!</p>
                </footer>
            </div>
        </Modal>
    );
};

export default DocumentPreview;