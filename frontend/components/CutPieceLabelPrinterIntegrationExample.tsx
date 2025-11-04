// Exemplo de integração do CutPieceLabelPrinter ao ServiceOrderDetailModal
// Este código deve ser adicionado ao ServiceOrderDetailModal existente

import React, { useState } from 'react';
import CutPieceLabelPrinter from '../components/CutPieceLabelPrinter';
import Button from '../components/ui/Button';

// Adicione este estado ao componente ServiceOrderDetailModal:
const [showCutPiecePrinter, setShowCutPiecePrinter] = useState(false);

// Adicione este botão na seção de ações do modal:
<Button 
  onClick={() => setShowCutPiecePrinter(true)}
  variant="outline"
  size="sm"
>
  Imprimir Etiquetas das Peças
</Button>

// Adicione este modal no final do JSX do ServiceOrderDetailModal:
{showCutPiecePrinter && (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div className="bg-white dark:bg-gray-800 rounded-lg max-w-6xl max-h-[90vh] overflow-y-auto m-4">
      <CutPieceLabelPrinter 
        serviceOrderId={order.id}
        onClose={() => setShowCutPiecePrinter(false)}
      />
    </div>
  </div>
)}

// Alternativamente, você pode usar o Modal component existente:
import Modal from '../components/ui/Modal';

<Modal 
  isOpen={showCutPiecePrinter}
  onClose={() => setShowCutPiecePrinter(false)}
  title="Impressão de Etiquetas - Peças Cortadas"
  size="xl"
>
  <CutPieceLabelPrinter 
    serviceOrderId={order.id}
    onClose={() => setShowCutPiecePrinter(false)}
  />
</Modal>
