import React, { useState, useEffect } from 'react';
import type { Quote, Order, PaymentMethod, OrderAddendum } from '../types';
import { mockUsers } from '../data/mockData';
import Modal from './ui/Modal';
import Button from './ui/Button';
import { useData } from '../context/DataContext';


declare const html2canvas: any;
declare const jspdf: any;

interface DocumentPreviewProps {
    document: Quote | Order;
    onClose: () => void;
}

const DocumentPreview: React.FC<DocumentPreviewProps> = ({ document, onClose }) => {
    const [isGenerating, setIsGenerating] = useState(false);
    const [addendums, setAddendums] = useState<OrderAddendum[]>([]);
    const [isLoadingAddendums, setIsLoadingAddendums] = useState(false);
    
    const { loadOrderAddendums, orderAddendums } = useData();
    
    // Carregar adendos se o documento for um Order
    useEffect(() => {
        const isOrder = 'originalQuoteId' in document;
        if (isOrder) {
            setIsLoadingAddendums(true);
            loadOrderAddendums(document.id)
                .then(() => {
                    // Os adendos serão carregados no DataContext
                    // Aqui precisamos acessar os adendos do contexto
                    setIsLoadingAddendums(false);
                })
                .catch((error) => {
                    console.error('Erro ao carregar adendos:', error);
                    setIsLoadingAddendums(false);
                });
        }
    }, [document.id, loadOrderAddendums]);
    
    const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
        pix: 'PIX',
        cartao_credito: 'Cartão de Crédito',
        boleto: 'Boleto Bancário',
        dinheiro: 'Dinheiro',
    };

    const handleGeneratePdf = async () => {
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
            
            // Add page numbers
            const pageCount = pdf.internal.getNumberOfPages();
            for (let i = 1; i <= pageCount; i++) {
                pdf.setPage(i);
                pdf.setFontSize(10);
                pdf.setTextColor(150);
                pdf.text(
                    `Página ${i} de ${pageCount}`,
                    pdf.internal.pageSize.getWidth() / 2,
                    pdf.internal.pageSize.getHeight() - 10,
                    { align: 'center' }
                );
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
    
    const deliveryAddress = document.deliveryAddress;
    const deliveryAddressLine1 = `${deliveryAddress.address}, ${deliveryAddress.number}${deliveryAddress.complement ? ` - ${deliveryAddress.complement}` : ''}`;
    const deliveryAddressLine2 = `${deliveryAddress.neighborhood} - ${deliveryAddress.city}, ${deliveryAddress.uf}`;
    
    const itemSubtotal = document.items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
    const itemDiscounts = document.items.reduce((sum, item) => sum + (item.discount || 0), 0);
    
    // Filtrar adendos aprovados para este pedido
    const approvedAddendums = isOrder ? orderAddendums.filter(addendum => 
        addendum.orderId === document.id && addendum.status === 'approved'
    ) : [];
    
    // Calcular total final considerando adendos
    const addendumsTotalAdjustment = approvedAddendums.reduce((sum, addendum) => {
        const addedItemsTotal = addendum.addedItems.reduce((sum, item) => sum + item.totalPrice, 0);
        const removedItemsTotal = addendum.removedItemIds.reduce((sum, itemId) => {
            const originalItem = document.items.find(item => item.id === itemId);
            return sum + (originalItem ? originalItem.totalPrice : 0);
        }, 0);
        const changedItemsTotal = addendum.changedItems.reduce((sum, change) => {
            const originalItem = document.items.find(item => item.id === change.originalItemId);
            const originalTotal = originalItem ? originalItem.totalPrice : 0;
            return sum + (change.updatedItem.totalPrice - originalTotal);
        }, 0);
        
        return sum + addedItemsTotal - removedItemsTotal + changedItemsTotal + addendum.priceAdjustment;
    }, 0);
    
    const finalTotal = document.total + addendumsTotalAdjustment;

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
                        <img src="https://via.placeholder.com/180x60?text=Sua+Logo+Aqui" alt="Logo da Empresa" className="h-16 mb-2" />
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
                            {deliveryAddress.cep && <p className="text-dark">CEP: {deliveryAddress.cep}</p>}
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
                
                {/* Seção de Adendos Aprovados */}
                {isOrder && approvedAddendums.length > 0 && (
                    <section className="mt-8">
                        <h3 className="text-lg font-semibold text-slate-800 mb-4">Adendos Aprovados</h3>
                        {approvedAddendums.map((addendum, index) => (
                            <div key={addendum.id} className="mb-6 p-4 border border-slate-300 rounded-lg bg-slate-50">
                                <div className="flex justify-between items-start mb-3">
                                    <div>
                                        <h4 className="font-semibold text-slate-800">Adendo #{addendum.addendumNumber}</h4>
                                        <p className="text-sm text-slate-600">
                                            Aprovado em: {new Date(addendum.approvedAt || addendum.createdAt).toLocaleDateString('pt-BR')}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm text-slate-600">Motivo:</p>
                                        <p className="font-medium text-slate-800">{addendum.reason}</p>
                                    </div>
                                </div>
                                
                                {/* Itens Adicionados */}
                                {addendum.addedItems.length > 0 && (
                                    <div className="mb-3">
                                        <h5 className="font-medium text-green-700 mb-2">Itens Adicionados:</h5>
                                        <div className="ml-4 space-y-1">
                                            {addendum.addedItems.map((item, itemIndex) => (
                                                <div key={itemIndex} className="text-sm text-green-600">
                                                    + {item.description} - {item.quantity} x {item.unitPrice.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} = {item.totalPrice.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                
                                {/* Itens Removidos */}
                                {addendum.removedItemIds.length > 0 && (
                                    <div className="mb-3">
                                        <h5 className="font-medium text-red-700 mb-2">Itens Removidos:</h5>
                                        <div className="ml-4 space-y-1">
                                            {addendum.removedItemIds.map((itemId, itemIndex) => {
                                                const originalItem = document.items.find(item => item.id === itemId);
                                                return originalItem ? (
                                                    <div key={itemIndex} className="text-sm text-red-600">
                                                        - {originalItem.description} - {originalItem.totalPrice.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                                    </div>
                                                ) : null;
                                            })}
                                        </div>
                                    </div>
                                )}
                                
                                {/* Itens Modificados */}
                                {addendum.changedItems.length > 0 && (
                                    <div className="mb-3">
                                        <h5 className="font-medium text-yellow-700 mb-2">Itens Modificados:</h5>
                                        <div className="ml-4 space-y-2">
                                            {addendum.changedItems.map((change, itemIndex) => {
                                                const originalItem = document.items.find(item => item.id === change.originalItemId);
                                                return (
                                                    <div key={itemIndex} className="text-sm">
                                                        <div className="text-yellow-600">
                                                            {change.updatedItem.description}
                                                        </div>
                                                        <div className="ml-4 text-xs text-slate-500">
                                                            {originalItem ? `De: ${originalItem.quantity} x ${originalItem.unitPrice.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} = ${originalItem.totalPrice.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}` : ''}
                                                        </div>
                                                        <div className="ml-4 text-xs text-slate-500">
                                                            Para: {change.updatedItem.quantity} x {change.updatedItem.unitPrice.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} = {change.updatedItem.totalPrice.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}
                                
                                {/* Ajuste de Preço */}
                                {addendum.priceAdjustment !== 0 && (
                                    <div className="mb-3">
                                        <h5 className="font-medium text-blue-700 mb-2">Ajuste de Preço:</h5>
                                        <div className="ml-4 text-sm">
                                            <span className={addendum.priceAdjustment > 0 ? 'text-green-600' : 'text-red-600'}>
                                                {addendum.priceAdjustment > 0 ? '+' : ''}{addendum.priceAdjustment.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                            </span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </section>
                )}
                
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
                        {isOrder && addendumsTotalAdjustment !== 0 && (
                            <div className="flex justify-between text-blue-600">
                                <span>Ajuste por Adendos:</span>
                                <span>{addendumsTotalAdjustment > 0 ? '+' : ''}{addendumsTotalAdjustment.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                            </div>
                        )}
                        <div className="flex justify-between font-bold text-xl mt-2 pt-2 border-t-2 border-black text-dark">
                            <span>{isOrder && addendumsTotalAdjustment !== 0 ? 'TOTAL FINAL:' : 'TOTAL:'}</span>
                            <span className="text-primary">{finalTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                        </div>
                    </div>
                </section>
                
                <footer className="mt-12 pt-6 border-t border-border text-left text-xs text-text-secondary">
                    {document.paymentMethod && (
                        <div className="mb-4">
                            <h4 className="font-semibold text-sm text-dark">Condições de Pagamento:</h4>
                            <p className="text-sm text-slate-800">
                                {PAYMENT_METHOD_LABELS[document.paymentMethod]}
                                {document.paymentMethod === 'cartao_credito' && document.installments && ` em ${document.installments}x`}
                            </p>
                        </div>
                    )}
                    <p><strong>Condições Gerais:</strong> Validade da proposta: 15 dias. Prazo de entrega a combinar.</p>
                    <p>Agradecemos a sua preferência!</p>
                </footer>
            </div>
        </Modal>
    );
};

export default DocumentPreview;