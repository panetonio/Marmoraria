import React from 'react';

interface ReceiptContentProps {
    receipt: {
        id: string;
        amount: number;
        description: string;
        createdAt: string;
        supplierName: string;
        cpfCnpj: string;
    };
}

const ReceiptContent: React.FC<ReceiptContentProps> = ({ receipt }) => {
    return (
        <div className="w-full bg-white mx-auto p-8 border border-border text-black font-sans text-base">
            <header className="border-b-2 border-black pb-4 text-center">
                <h1 className="text-3xl font-bold">RECIBO DE PAGAMENTO</h1>
            </header>
            <div className="flex justify-between items-center mt-4 text-sm">
                <span className="font-mono">ID: {receipt.id}</span>
                <span className="font-semibold">Valor: {receipt.amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                <span>Data: {new Date(receipt.createdAt).toLocaleDateString('pt-BR')}</span>
            </div>
            <div className="mt-12 text-lg leading-relaxed">
                <p>
                    Eu, <strong>{receipt.supplierName}</strong>, inscrito(a) no CPF/CNPJ sob o nº <strong>{receipt.cpfCnpj}</strong>, declaro para os devidos fins que recebi da empresa <strong>Marmoraria ERP</strong> a quantia de <strong>{receipt.amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</strong>.
                </p>
                <p className="mt-6">
                    Este valor é referente ao pagamento de:
                </p>
                <p className="mt-2 p-4 border border-dashed border-gray-400 bg-gray-50">
                    {receipt.description}
                </p>
                <p className="mt-8">
                    Dou plena, rasa e geral quitação do referido valor, para nada mais reclamar, seja a que título for.
                </p>
            </div>
            <div className="mt-24 text-center">
                <p>_________________________________________</p>
                <p className="mt-2 font-semibold">{receipt.supplierName}</p>
                <p>{receipt.cpfCnpj}</p>
            </div>
        </div>
    );
};

export default ReceiptContent;