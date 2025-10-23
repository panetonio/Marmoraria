import React, { useState, useEffect } from 'react';
import Card, { CardHeader, CardContent } from './ui/Card';
import Button from './ui/Button';
import SignaturePad from './SignaturePad';
import PhotoCapture from './PhotoCapture';

interface ChecklistItem {
  id: string;
  text: string;
  checked: boolean;
}

interface Photo {
  id: string;
  dataUrl: string;
  description?: string;
}

interface InteractiveChecklistProps {
  title: string;
  items: ChecklistItem[];
  onChecklistComplete: (data: {
    items: ChecklistItem[];
    photos: Photo[];
    signature: string | null;
  }) => void;
  onCancel?: () => void;
  requireSignature?: boolean;
  requirePhotos?: boolean;
  minPhotos?: number;
  tabletMode?: boolean;
}

const InteractiveChecklist: React.FC<InteractiveChecklistProps> = ({
  title,
  items: initialItems,
  onChecklistComplete,
  onCancel,
  requireSignature = true,
  requirePhotos = false,
  minPhotos = 1,
  tabletMode = false
}) => {
  const [items, setItems] = useState<ChecklistItem[]>(initialItems);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [signature, setSignature] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState<'checklist' | 'photos' | 'signature'>('checklist');
  const [showSignaturePad, setShowSignaturePad] = useState(false);

  const allItemsChecked = items.every(item => item.checked);
  const hasMinPhotos = !requirePhotos || photos.length >= minPhotos;
  const hasSignature = !requireSignature || signature !== null;
  const canComplete = allItemsChecked && hasMinPhotos && hasSignature;

  const toggleItem = (itemId: string) => {
    setItems(prev => prev.map(item =>
      item.id === itemId ? { ...item, checked: !item.checked } : item
    ));
  };

  const toggleAll = (checked: boolean) => {
    setItems(prev => prev.map(item => ({ ...item, checked })));
  };

  const handleSignatureSave = (signatureDataUrl: string) => {
    setSignature(signatureDataUrl);
    setShowSignaturePad(false);
  };

  const handleComplete = () => {
    if (!canComplete) return;

    onChecklistComplete({
      items,
      photos,
      signature
    });
  };

  // Classes para modo tablet
  const buttonSize = tabletMode ? 'text-lg px-6 py-4' : '';
  const checkboxSize = tabletMode ? 'h-6 w-6' : 'h-5 w-5';
  const textSize = tabletMode ? 'text-lg' : 'text-sm';

  return (
    <div className={`space-y-6 ${tabletMode ? 'max-w-4xl mx-auto' : ''}`}>
      <Card>
        <CardHeader>
          <h2 className={`${tabletMode ? 'text-3xl' : 'text-2xl'} font-bold text-text-primary dark:text-slate-100`}>
            {title}
          </h2>
        </CardHeader>
        <CardContent>
          {/* Navegação de steps */}
          <div className="flex justify-center mb-6">
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setCurrentStep('checklist')}
                className={`px-4 py-2 rounded-lg font-medium ${
                  currentStep === 'checklist'
                    ? 'bg-primary text-white'
                    : 'bg-slate-200 dark:bg-slate-700 text-text-secondary dark:text-slate-400'
                } ${tabletMode ? 'text-lg px-6 py-3' : ''}`}
              >
                1. Checklist
              </button>
              <span className="text-text-secondary dark:text-slate-400">→</span>
              <button
                onClick={() => setCurrentStep('photos')}
                className={`px-4 py-2 rounded-lg font-medium ${
                  currentStep === 'photos'
                    ? 'bg-primary text-white'
                    : 'bg-slate-200 dark:bg-slate-700 text-text-secondary dark:text-slate-400'
                } ${tabletMode ? 'text-lg px-6 py-3' : ''}`}
              >
                2. Fotos
              </button>
              <span className="text-text-secondary dark:text-slate-400">→</span>
              <button
                onClick={() => setCurrentStep('signature')}
                className={`px-4 py-2 rounded-lg font-medium ${
                  currentStep === 'signature'
                    ? 'bg-primary text-white'
                    : 'bg-slate-200 dark:bg-slate-700 text-text-secondary dark:text-slate-400'
                } ${tabletMode ? 'text-lg px-6 py-3' : ''}`}
              >
                3. Assinatura
              </button>
            </div>
          </div>

          {/* Step 1: Checklist */}
          {currentStep === 'checklist' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <p className={`${textSize} text-text-secondary dark:text-slate-400`}>
                  {items.filter(i => i.checked).length} de {items.length} itens marcados
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size={tabletMode ? 'default' : 'sm'}
                    onClick={() => toggleAll(true)}
                    className={buttonSize}
                  >
                    Marcar Todos
                  </Button>
                  <Button
                    variant="ghost"
                    size={tabletMode ? 'default' : 'sm'}
                    onClick={() => toggleAll(false)}
                    className={buttonSize}
                  >
                    Desmarcar Todos
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                {items.map((item, index) => (
                  <label
                    key={item.id}
                    className={`flex items-center gap-3 p-3 rounded-lg border transition cursor-pointer ${
                      item.checked
                        ? 'border-green-400 bg-green-50 dark:bg-green-900/20'
                        : 'border-border dark:border-slate-700 hover:border-primary/50'
                    } ${tabletMode ? 'p-5' : ''}`}
                  >
                    <input
                      type="checkbox"
                      className={`${checkboxSize} rounded text-primary focus:ring-primary cursor-pointer`}
                      checked={item.checked}
                      onChange={() => toggleItem(item.id)}
                    />
                    <span className={`flex-1 ${textSize} text-text-primary dark:text-slate-100`}>
                      {index + 1}. {item.text}
                    </span>
                  </label>
                ))}
              </div>

              <div className="flex justify-end gap-3 mt-6">
                {onCancel && (
                  <Button variant="ghost" onClick={onCancel} className={buttonSize}>
                    Cancelar
                  </Button>
                )}
                <Button
                  onClick={() => setCurrentStep('photos')}
                  disabled={!allItemsChecked}
                  className={buttonSize}
                >
                  Próximo: Fotos →
                </Button>
              </div>
            </div>
          )}

          {/* Step 2: Fotos */}
          {currentStep === 'photos' && (
            <div className="space-y-4">
              {requirePhotos && (
                <p className={`${textSize} text-text-secondary dark:text-slate-400 text-center`}>
                  {photos.length >= minPhotos
                    ? `✓ Você adicionou ${photos.length} foto(s).`
                    : `Adicione pelo menos ${minPhotos} foto(s).`}
                </p>
              )}

              <PhotoCapture
                onPhotosChange={setPhotos}
                maxPhotos={10}
                initialPhotos={photos}
              />

              <div className="flex justify-between gap-3 mt-6">
                <Button
                  variant="ghost"
                  onClick={() => setCurrentStep('checklist')}
                  className={buttonSize}
                >
                  ← Voltar
                </Button>
                <Button
                  onClick={() => setCurrentStep('signature')}
                  disabled={requirePhotos && !hasMinPhotos}
                  className={buttonSize}
                >
                  Próximo: Assinatura →
                </Button>
              </div>
            </div>
          )}

          {/* Step 3: Assinatura */}
          {currentStep === 'signature' && (
            <div className="space-y-4">
              {requireSignature && (
                <p className={`${textSize} text-center mb-4 ${signature ? 'text-green-600' : 'text-text-secondary dark:text-slate-400'}`}>
                  {signature ? '✓ Assinatura capturada' : 'Capture a assinatura do cliente'}
                </p>
              )}

              {signature && !showSignaturePad ? (
                <div className="space-y-4">
                  <div className="border-2 border-green-400 rounded-lg p-4 bg-green-50 dark:bg-green-900/20">
                    <img
                      src={signature}
                      alt="Assinatura"
                      className="max-w-md mx-auto"
                    />
                  </div>
                  <div className="flex justify-center">
                    <Button
                      variant="ghost"
                      onClick={() => setShowSignaturePad(true)}
                      className={buttonSize}
                    >
                      ✏️ Refazer Assinatura
                    </Button>
                  </div>
                </div>
              ) : (
                <SignaturePad
                  onSave={handleSignatureSave}
                  onClear={() => setSignature(null)}
                  width={tabletMode ? 700 : 600}
                  height={tabletMode ? 400 : 300}
                />
              )}

              <div className="flex justify-between gap-3 mt-6">
                <Button
                  variant="ghost"
                  onClick={() => setCurrentStep('photos')}
                  className={buttonSize}
                >
                  ← Voltar
                </Button>
                <Button
                  onClick={handleComplete}
                  disabled={!canComplete}
                  className={`${buttonSize} ${canComplete ? 'bg-green-600 hover:bg-green-700' : ''}`}
                >
                  ✓ Concluir e Salvar
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Resumo do progresso */}
      <Card className="p-4 bg-slate-50 dark:bg-slate-800/50">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className={`font-bold ${allItemsChecked ? 'text-green-600' : 'text-text-primary dark:text-slate-100'}`}>
              {allItemsChecked ? '✓' : items.filter(i => i.checked).length + '/' + items.length}
            </div>
            <div className={`${tabletMode ? 'text-base' : 'text-xs'} text-text-secondary dark:text-slate-400`}>
              Checklist
            </div>
          </div>
          <div>
            <div className={`font-bold ${hasMinPhotos ? 'text-green-600' : 'text-text-primary dark:text-slate-100'}`}>
              {hasMinPhotos ? '✓' : photos.length + (requirePhotos ? `/${minPhotos}` : '')}
            </div>
            <div className={`${tabletMode ? 'text-base' : 'text-xs'} text-text-secondary dark:text-slate-400`}>
              Fotos
            </div>
          </div>
          <div>
            <div className={`font-bold ${hasSignature ? 'text-green-600' : 'text-text-primary dark:text-slate-100'}`}>
              {hasSignature ? '✓' : '✗'}
            </div>
            <div className={`${tabletMode ? 'text-base' : 'text-xs'} text-text-secondary dark:text-slate-400`}>
              Assinatura
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default InteractiveChecklist;

