import React, { useRef, useState } from 'react';
import type { CutPiece } from '../types';
import { useData } from '../context/DataContext';
import Card, { CardHeader, CardContent } from './ui/Card';
import Button from './ui/Button';
import StatusBadge from './ui/StatusBadge';
import { cutPieceStatusMap } from '../config/statusMaps';
import { QRCode } from '../lib/qrcode-react';

interface CutPieceLabelPrinterProps {
  serviceOrderId: string;
  onClose?: () => void;
}

const CutPieceLabelPrinter: React.FC<CutPieceLabelPrinterProps> = ({ 
  serviceOrderId, 
  onClose 
}) => {
  const { cutPieces, materials, loadCutPiecesForOS } = useData();
  const [selectedPieces, setSelectedPieces] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const qrCodeRefs = useRef<Map<string, HTMLCanvasElement>>(new Map());

  // Filtrar peças da OS específica
  const osCutPieces = cutPieces.filter(piece => piece.serviceOrderId === serviceOrderId);

  // Carregar peças se não estiverem carregadas
  React.useEffect(() => {
    if (osCutPieces.length === 0) {
      loadCutPiecesForOS(serviceOrderId);
    }
  }, [serviceOrderId, osCutPieces.length, loadCutPiecesForOS]);

  const togglePieceSelection = (pieceId: string) => {
    setSelectedPieces(prev => {
      const newSet = new Set(prev);
      if (newSet.has(pieceId)) {
        newSet.delete(pieceId);
      } else {
        newSet.add(pieceId);
      }
      return newSet;
    });
  };

  const selectAllPieces = () => {
    setSelectedPieces(new Set(osCutPieces.map(piece => piece.id)));
  };

  const clearSelection = () => {
    setSelectedPieces(new Set());
  };

  const handlePrintSingle = (piece: CutPiece) => {
    const canvas = qrCodeRefs.current.get(piece.id);
    if (!canvas) {
      console.warn(`QR code ainda não foi renderizado para a peça ${piece.id}.`);
      return;
    }

    const material = materials.find(m => m.id === piece.materialId);
    const dataUrl = canvas.toDataURL('image/png');
    
    if (!dataUrl) {
      console.warn('Não foi possível gerar a imagem do QR code.');
      return;
    }

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Etiqueta de Peça Cortada</title>
          <style>
            body { 
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
              text-align: center; 
              padding: 24px; 
              color: #0f172a; 
              margin: 0;
            }
            .label-container {
              border: 2px solid #000;
              padding: 16px;
              max-width: 300px;
              margin: 0 auto;
            }
            .qr-img { 
              margin: 16px auto; 
              width: 180px; 
              height: 180px; 
              border: 1px solid #ccc;
            }
            .piece-info {
              margin: 8px 0;
              font-size: 14px;
            }
            .piece-id {
              font-weight: bold;
              font-size: 16px;
              margin: 8px 0;
            }
            .dimensions {
              font-family: monospace;
              background: #f5f5f5;
              padding: 4px 8px;
              border-radius: 4px;
              display: inline-block;
            }
            @media print { 
              body { margin: 0; }
              .label-container {
                border: none;
                padding: 0;
              }
            }
          </style>
        </head>
        <body>
          <div class="label-container">
            <h2>${material?.name ?? 'Peça Cortada'}</h2>
            <div class="piece-id">ID: ${piece.pieceId}</div>
            <div class="piece-info">
              <div class="dimensions">
                ${piece.dimensions}
              </div>
            </div>
            <img id="print-qr" src="${dataUrl}" alt="QR code da peça ${piece.id}" class="qr-img" />
            <div class="piece-info">
              <p><strong>OS:</strong> ${piece.serviceOrderId}</p>
              <p><strong>Local:</strong> ${piece.location}</p>
              ${piece.description ? `<p><strong>Descrição:</strong> ${piece.description}</p>` : ''}
            </div>
          </div>
          <script>
            const img = document.getElementById('print-qr');
            if (img && img.complete) {
              window.focus();
              window.print();
            } else if (img) {
              img.addEventListener('load', () => {
                window.focus();
                window.print();
              });
            }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handlePrintSelected = () => {
    if (selectedPieces.size === 0) {
      alert('Selecione pelo menos uma peça para imprimir.');
      return;
    }

    const selectedPiecesData = osCutPieces.filter(piece => selectedPieces.has(piece.id));
    
    // Para múltiplas peças, imprimir uma por vez com pequeno delay
    selectedPiecesData.forEach((piece, index) => {
      setTimeout(() => {
        handlePrintSingle(piece);
      }, index * 1000); // 1 segundo de delay entre cada impressão
    });
  };

  const setQrCodeRef = (pieceId: string) => (canvas: HTMLCanvasElement | null) => {
    if (canvas) {
      qrCodeRefs.current.set(pieceId, canvas);
    }
  };

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-text-secondary">Carregando peças cortadas...</p>
        </div>
      </Card>
    );
  }

  if (osCutPieces.length === 0) {
    return (
      <Card className="p-6">
        <div className="text-center">
          <p className="text-text-secondary">Nenhuma peça cortada encontrada para esta OS.</p>
          <Button 
            onClick={() => loadCutPiecesForOS(serviceOrderId)} 
            className="mt-4"
            variant="outline"
          >
            Recarregar Peças
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <CardHeader>
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold">Impressão de Etiquetas - Peças Cortadas</h3>
          {onClose && (
            <Button onClick={onClose} variant="outline" size="sm">
              Fechar
            </Button>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Controles de seleção */}
        <div className="flex gap-2 mb-4">
          <Button 
            onClick={selectAllPieces} 
            variant="outline" 
            size="sm"
            disabled={osCutPieces.length === 0}
          >
            Selecionar Todas ({osCutPieces.length})
          </Button>
          <Button 
            onClick={clearSelection} 
            variant="outline" 
            size="sm"
            disabled={selectedPieces.size === 0}
          >
            Limpar Seleção
          </Button>
          <Button 
            onClick={handlePrintSelected} 
            variant="primary" 
            size="sm"
            disabled={selectedPieces.size === 0}
          >
            Imprimir Selecionadas ({selectedPieces.size})
          </Button>
        </div>

        {/* Lista de peças */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {osCutPieces.map(piece => {
            const material = materials.find(m => m.id === piece.materialId);
            const isSelected = selectedPieces.has(piece.id);
            
            return (
              <Card 
                key={piece.id} 
                className={`p-4 cursor-pointer transition-all ${
                  isSelected ? 'ring-2 ring-primary bg-primary/5' : 'hover:shadow-md'
                }`}
                onClick={() => togglePieceSelection(piece.id)}
              >
                <div className="space-y-3">
                  {/* Header com ID e Status */}
                  <div className="flex justify-between items-start">
                    <div className="font-mono text-sm font-bold">{piece.pieceId}</div>
                    <StatusBadge status={piece.status} statusMap={cutPieceStatusMap} />
                  </div>

                  {/* Material e Descrição */}
                  <div>
                    <p className="font-semibold text-sm">{material?.name}</p>
                    {piece.description && (
                      <p className="text-xs text-text-secondary">{piece.description}</p>
                    )}
                  </div>

                  {/* Dimensões */}
                  <div className="bg-gray-50 dark:bg-gray-800 p-2 rounded text-xs font-mono">
                    {piece.dimensions}
                  </div>

                  {/* QR Code */}
                  <div className="flex justify-center">
                    <QRCode
                      ref={setQrCodeRef(piece.id)}
                      value={piece.qrCodeValue}
                      size={120}
                      level="M"
                      includeMargin={true}
                    />
                  </div>

                  {/* Localização */}
                  <div className="text-xs text-text-secondary">
                    <strong>Local:</strong> {piece.location}
                  </div>

                  {/* Botão de impressão individual */}
                  <Button 
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePrintSingle(piece);
                    }}
                    variant="outline" 
                    size="sm"
                    className="w-full"
                  >
                    Imprimir Etiqueta
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export default CutPieceLabelPrinter;
