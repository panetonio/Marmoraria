import React from 'react';
import type { ServiceOrder } from '../types';

interface ReceiptTermContentProps {
    order: ServiceOrder;
    signatoryName?: string;
    signatoryDocument?: string;
    signatureDataUrl?: string | null;
}

const ReceiptTermContent: React.FC<ReceiptTermContentProps> = ({ order, signatoryName, signatoryDocument, signatureDataUrl }) => {
    const itemCount = order.items.length;
    const orderId = order.orderId;
    const city = order.deliveryAddress.city;

    return (
        <div className="w-full bg-white mx-auto p-8 border border-border text-black font-sans text-base">
            <header className="border-b-2 border-black pb-4 text-center">
                <h1 className="text-3xl font-bold uppercase">Termo de Conferência de Entrega</h1>
            </header>
            
            <div className="mt-12 text-lg leading-relaxed text-justify">
                <p>
                    Eu ________________________________________, declaro que conferi o(s) produto(s) entregue(s),
                    tendo recebido um total de <strong>{itemCount}</strong> peça(s), referente ao pedido <strong>{orderId}</strong>,
                    estando em perfeitas condições e conforme solicitado por mim em tamanho, material e acabamento.
                    Nenhuma das peças possui: quebras, manchas oriundas de ferrugem, produto corrosivo, e qualquer
                    outra que não seja natural da pedra em si, pois mármores e granitos por sua própria natureza
                    estão sujeitos a variações de cores, tonalidades, desenhos e veios. Desse modo, recebo o
                    produto em excelente estado, estando sob minha responsabilidade.
                </p>
                
                <p className="mt-12 text-center">
                    {city}, ______/______/_______.
                </p>
            </div>
            
            <div className="mt-24 text-center">
                {signatureDataUrl ? (
                    <img src={signatureDataUrl} alt="Assinatura" style={{ width: '250px', height: 'auto', margin: '10px auto', borderBottom: '1px solid black' }} />
                ) : (
                    <p className="border-b border-black w-64 mx-auto pb-1">_________________________________________</p>
                )}
                <p className="mt-2 font-semibold">{signatoryName || '(Nome do Responsável)'}</p>
                {signatoryDocument && <p className="text-sm">{signatoryDocument}</p>}
                <p className="mt-2 text-xs">(Pessoa responsável pela conferência)</p>
            </div>

            <div className="mt-8 text-left text-sm space-y-2">
                <div>( ) Proprietário</div>
                <div>( ) Funcionário autorizado</div>
                <div>( ) Parente/Familiar</div>
                <div>( ) Outro:____________________________</div>
            </div>
        </div>
    );
};

export default ReceiptTermContent;
