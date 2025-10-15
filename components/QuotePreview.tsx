import React, { useState } from 'react';
import type { Quote } from '../types';
import { mockUsers } from '../data/mockData';
import Modal from './ui/Modal';
import Button from './ui/Button';


declare const html2canvas: any;
declare const jspdf: any;

interface QuotePreviewProps {
    quote: Quote;
    onClose: () => void;
}

const QuotePreview: React.FC<QuotePreviewProps> = ({ quote, onClose }) => {
    const [isGenerating, setIsGenerating] = useState(false);
    
    const handleGeneratePdf = async () => {
        const printableArea = document.getElementById('printable-area');
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
    
            pdf.save(`orcamento-${quote.id}.pdf`);
        } catch (error) {
            console.error("Error generating PDF:", error);
            alert("Ocorreu um erro ao gerar o PDF. Tente novamente.");
        } finally {
            setIsGenerating(false);
        }
    };
    
    return (
        <Modal isOpen={true} onClose={onClose} title="Pré-visualização do Orçamento" className="max-w-4xl">
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
                        <h2 className="text-2xl font-semibold text-gray-700">ORÇAMENTO</h2>
                        <p className="font-mono text-primary">{quote.id}</p>
                        <p className="text-text-secondary">Data: {new Date(quote.createdAt).toLocaleDateString()}</p>
                    </div>
                </header>
                
                <section className="mt-8 grid grid-cols-2 gap-4">
                    <div className="bg-slate-50 p-4 rounded-lg">
                        <h3 className="font-semibold text-text-secondary mb-2">CLIENTE:</h3>
                        <p className="font-bold text-dark">{quote.clientName}</p>
                        <p className="text-slate-800">{quote.clientEmail}</p>
                        <p className="text-slate-800">{quote.clientPhone}</p>
                    </div>
                     <div className="bg-slate-50 p-4 rounded-lg">
                        <h3 className="font-semibold text-text-secondary mb-2">VENDEDOR:</h3>
                        <p className="font-bold text-dark">{mockUsers.find(u => u.id === quote.salespersonId)?.name || 'N/A'}</p>
                    </div>
                    <div className="bg-slate-50 p-4 rounded-lg col-span-2">
                        <h3 className="font-semibold text-text-secondary mb-2">ENDEREÇO DE ENTREGA:</h3>
                        <p className="font-bold text-dark">{quote.deliveryAddress || 'A ser definido'}</p>
                    </div>
                </section>
                
                <section className="mt-8">
                    <h3 className="text-xl font-semibold text-dark mb-4 border-b border-border pb-2">Itens do Orçamento</h3>
                    <table className="w-full text-left text-sm">
                        <thead>
                            <tr className="bg-slate-100">
                                <th className="p-2 text-slate-800">Descrição</th>
                                <th className="p-2 text-center text-slate-800">Qtd.</th>
                                <th className="p-2 text-right text-slate-800">Preço Unit.</th>
                                <th className="p-2 text-right text-slate-800">Subtotal</th>
                            </tr>
                        </thead>
                        <tbody>
                            {quote.items.map(item => (
                                <tr key={item.id} className="border-b border-border">
                                    <td className="p-2 text-slate-800">{item.description}</td>
                                    <td className="p-2 text-center text-slate-800">{item.quantity.toFixed(2)}</td>
                                    <td className="p-2 text-right text-slate-800">{item.unitPrice.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                                    <td className="p-2 text-right font-semibold text-slate-800">{item.totalPrice.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </section>
                
                <section className="mt-8 flex justify-end">
                    <div className="w-full max-w-xs">
                        <div className="flex justify-between text-text-secondary">
                            <span>Subtotal:</span>
                            <span>{quote.subtotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                        </div>
                        <div className="flex justify-between font-bold text-xl mt-2 pt-2 border-t border-border text-dark">
                            <span>TOTAL:</span>
                            <span className="text-primary">{quote.total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
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

export default QuotePreview;