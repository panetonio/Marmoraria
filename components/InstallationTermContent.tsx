import React from 'react';
import type { ServiceOrder } from '../types';

interface InstallationTermContentProps {
    order: ServiceOrder;
}

const InstallationTermContent: React.FC<InstallationTermContentProps> = ({ order }) => {
    const city = order.deliveryAddress.city;

    return (
        <div className="w-full bg-white mx-auto p-8 border border-border text-black font-sans text-base">
            <header className="border-b-2 border-black pb-4 text-center">
                <h1 className="text-3xl font-bold uppercase">Termo de Conferência de Instalação</h1>
            </header>
            
            <div className="mt-12 text-lg leading-relaxed text-justify">
                <p>
                    Eu declaro que conferi o(s) produto(s) instalado(s), estando em perfeitas condições em toda sua extensão,
                    incluindo cuba(s) e outras peças auxiliares, como também averiguei a(s) parte(s) de pedra,
                    estando tamanho e o acabamento de acordo com o solicitado e instalação conforme desejado.
                    Não possuindo: quebras, manchas oriundas de ferrugem, produto corrosivo, e qualquer outra que não
                    seja natural da pedra em si, pois mármores e granitos por sua própria natureza estão sujeitos a
                    variações de cores, tonalidades, desenhos e veios. E ainda, afirmo que não houve dano em móveis,
                    porcelanatos, ou quaisquer objetos e aparelhos presentes no local da instalação. Desde modo,
                    recebo o produto montado em excelente estado, estando sob minha responsabilidade.
                </p>
                
                <p className="mt-12 text-center">
                    {city}, ______/______/_______.
                </p>
            </div>
            
            <div className="mt-24 text-center">
                <p>_________________________________________</p>
                <p className="mt-2 text-sm">(Pessoa responsável pela conferência)</p>
            </div>
        </div>
    );
};

export default InstallationTermContent;