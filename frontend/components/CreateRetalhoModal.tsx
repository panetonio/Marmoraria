import React, { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import Modal from './ui/Modal';
import Button from './ui/Button';
import Input from './ui/Input';
import ShapeDesigner from './ShapeDesigner';
import type { StockItem } from '../types';
import { api } from '../utils/api';

interface CreateRetalhoModalProps {
  isOpen: boolean;
  onClose: () => void;
  originalSlab: StockItem;
  onSave: (newSlab: StockItem) => void;
}

type ShapePoint = { x: number; y: number };

interface ShapeData {
  shape: 'rectangle' | 'custom';
  width: number;
  height: number;
  shapePoints: ShapePoint[];
}

const CreateRetalhoModal: React.FC<CreateRetalhoModalProps> = ({ isOpen, onClose, originalSlab, onSave }) => {
  const [shapeData, setShapeData] = useState<ShapeData>({
    shape: 'rectangle',
    width: 0,
    height: 0,
    shapePoints: [],
  });
  const [location, setLocation] = useState(originalSlab.location || '');
  const [isSaving, setIsSaving] = useState(false);
  const [isShapeDesignerOpen, setIsShapeDesignerOpen] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setLocation(originalSlab.location || '');
      setShapeData({
        shape: 'rectangle',
        width: 0,
        height: 0,
        shapePoints: [],
      });
    }
  }, [isOpen, originalSlab]);

  const handleDimensionChange = useCallback((field: 'width' | 'height', value: string) => {
    const parsed = Number(value);
    setShapeData(prev => ({
      ...prev,
      [field]: Number.isFinite(parsed) ? parsed : 0,
    }));
  }, []);

  const handleShapeDesignerComplete = useCallback((data: { area: number; points: ShapePoint[] }) => {
    if (!data || !Array.isArray(data.points) || data.points.length === 0) {
      setIsShapeDesignerOpen(false);
      return;
    }

    const xs = data.points.map(point => point.x);
    const ys = data.points.map(point => point.y);
    const widthMeters = Math.max(...xs) - Math.min(...xs);
    const heightMeters = Math.max(...ys) - Math.min(...ys);
    const convertedPoints = data.points.map(point => ({
      x: Number((point.x * 100).toFixed(2)),
      y: Number((point.y * 100).toFixed(2)),
    }));

    setShapeData({
      shape: 'custom',
      width: Number((widthMeters * 100).toFixed(2)),
      height: Number((heightMeters * 100).toFixed(2)),
      shapePoints: convertedPoints,
    });
    setIsShapeDesignerOpen(false);
  }, []);

  const handleSave = useCallback(async () => {
    if (isSaving) return;

    const trimmedLocation = location.trim();
    if (!trimmedLocation) {
      toast.error('Informe uma nova localização para o retalho.');
      return;
    }

    if (shapeData.width <= 0 || shapeData.height <= 0) {
      toast.error('Defina largura e altura válidas para o retalho.');
      return;
    }

    setIsSaving(true);
    const retalhoData = {
      ...shapeData,
      width_cm: shapeData.width,
      height_cm: shapeData.height,
      location: trimmedLocation,
    };

    const createPromise = api
      .createRetalhoFromSlab(originalSlab.id, retalhoData)
      .then(result => {
        if (!result?.success || !result.data) {
          throw new Error(result?.message || 'Erro ao salvar retalho.');
        }
        return result.data as StockItem;
      });

    toast.promise(
      createPromise,
      {
        loading: 'Salvando retalho...',
        success: () => 'Retalho registrado com novo QR Code!',
        error: (err) => err.message || 'Erro ao salvar retalho.',
      }
    );

    try {
      const newSlab = await createPromise;
      onSave(newSlab);
      onClose();
    } catch (error) {
      console.error('Erro ao salvar retalho:', error);
    } finally {
      setIsSaving(false);
    }
  }, [isSaving, location, onClose, onSave, originalSlab.id, shapeData]);

  const ShapeDesignerTrigger = useMemo(() => (
    <div className="space-y-2">
      <Button
        type="button"
        variant="secondary"
        onClick={() => setIsShapeDesignerOpen(true)}
      >
        Desenhar forma personalizada
      </Button>
      <p className="text-xs text-text-secondary dark:text-slate-400">
        Utilize o designer para desenhar um formato não retangular e calcular automaticamente as dimensões do retalho.
      </p>
    </div>
  ), []);

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title="Registrar Retalho (Resto de Chapa)"
        className="max-w-xl"
      >
        <div className="space-y-4">
          <Input
            label="Nova Localização"
            value={location}
            onChange={event => setLocation(event.target.value)}
            placeholder="Ex.: Pátio B - Rack 2"
          />

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Input
              label="Largura (cm)"
              type="number"
              min="0"
              value={shapeData.width || ''}
              onChange={event => handleDimensionChange('width', event.target.value)}
            />
            <Input
              label="Altura (cm)"
              type="number"
              min="0"
              value={shapeData.height || ''}
              onChange={event => handleDimensionChange('height', event.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsShapeDesignerOpen(true)}
            >
              Desenhar forma personalizada
            </Button>
            <p className="text-xs text-text-secondary dark:text-slate-400">
              Utilize o designer para desenhar um formato não retangular e calcular automaticamente as dimensões do retalho.
            </p>
          </div>

          <div className="rounded-md border border-dashed border-border bg-slate-50 p-3 text-sm dark:border-slate-700 dark:bg-slate-800/40">
            <p className="font-semibold text-text-primary dark:text-slate-100">Resumo do Retalho</p>
            <p className="text-text-secondary dark:text-slate-400">
              Dimensões: {shapeData.width || 0}cm x {shapeData.height || 0}cm
            </p>
            {shapeData.shape === 'custom' && shapeData.shapePoints.length > 0 && (
              <p className="text-xs text-text-secondary dark:text-slate-500 mt-1">
                Forma customizada com {shapeData.shapePoints.length} pontos.
              </p>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={onClose} disabled={isSaving}>
              Cancelar
            </Button>
            <Button type="button" onClick={handleSave} disabled={isSaving}>
              {isSaving ? 'Salvando...' : 'Salvar Retalho'}
            </Button>
          </div>
        </div>
      </Modal>

      <ShapeDesigner
        isOpen={isShapeDesignerOpen}
        onClose={() => setIsShapeDesignerOpen(false)}
        onComplete={handleShapeDesignerComplete}
      />
    </>
  );
};

export default CreateRetalhoModal;
