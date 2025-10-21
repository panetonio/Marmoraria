import React, { useCallback, useMemo, useState } from 'react';
import Card, { CardContent, CardHeader } from './ui/Card';
import Input from './ui/Input';
import Button from './ui/Button';
import Select from './ui/Select';
import StatusBadge from './ui/StatusBadge';
import { stockStatusMap } from '../config/statusMaps';
import type { StockItem, StockItemStatus } from '../types';
import { useData } from '../context/DataContext';
import { api } from '../utils/api';
import { useActivityLogger } from '../hooks/useActivityLogger';

interface QrCodeScannerProps {
  className?: string;
}

type RawStockItem = Partial<StockItem> & { id: string; [key: string]: unknown };

const statusOptions: { value: StockItemStatus; label: string }[] = [
  { value: 'disponivel', label: stockStatusMap.disponivel.label },
  { value: 'reservada', label: stockStatusMap.reservada.label },
  { value: 'em_uso', label: stockStatusMap.em_uso.label },
  { value: 'consumida', label: stockStatusMap.consumida.label },
  { value: 'em_corte', label: stockStatusMap.em_corte.label },
  { value: 'em_acabamento', label: stockStatusMap.em_acabamento.label },
  { value: 'pronto_para_expedicao', label: stockStatusMap.pronto_para_expedicao.label },
];

const normalizeStockItem = (data: RawStockItem): StockItem => {
  const fallbackStatus: StockItemStatus = 'disponivel';
  const rawData = data as Record<string, any>;
  const parsedStatus = (data.status ?? rawData.currentStatus) as StockItemStatus | undefined;
  const width = typeof data.width === 'number' ? data.width : Number(data.width ?? 0);
  const height = typeof data.height === 'number' ? data.height : Number(data.height ?? 0);
  const thickness = typeof data.thickness === 'number' ? data.thickness : Number(data.thickness ?? 0);

  const statusCandidate = parsedStatus && statusOptions.some(option => option.value === parsedStatus)
    ? parsedStatus
    : fallbackStatus;

  return {
    id: data.id,
    materialId: data.materialId ?? rawData.material?.id ?? '',
    photoUrl: data.photoUrl ?? rawData.imageUrl ?? '',
    width,
    height,
    thickness,
    location: data.location ?? rawData.storageLocation ?? '',
    status: statusCandidate,
    createdAt: data.createdAt ?? new Date().toISOString(),
    parentSlabId: data.parentSlabId,
  };
};

const QrCodeScanner: React.FC<QrCodeScannerProps> = ({ className = '' }) => {
  const { stockItems, setStockItems } = useData();
  const { logActivity } = useActivityLogger();

  const [inputId, setInputId] = useState('');
  const [loading, setLoading] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [scannedItem, setScannedItem] = useState<StockItem | null>(null);
  const [status, setStatus] = useState<StockItemStatus>('disponivel');
  const [location, setLocation] = useState('');

  const selectedStatusLabel = useMemo(() => stockStatusMap[status]?.label ?? status, [status]);

  const updateLocalStock = useCallback((item: StockItem) => {
    setStockItems(prev => {
      const existingIndex = prev.findIndex(stock => stock.id === item.id);
      if (existingIndex >= 0) {
        const updated = [...prev];
        updated[existingIndex] = item;
        return updated;
      }
      return [item, ...prev];
    });
  }, [setStockItems]);

  const handleFetchItem = useCallback(async (id: string) => {
    const trimmedId = id.trim();
    if (!trimmedId) {
      setError('Informe o ID da chapa ou utilize a simulação de leitura.');
      return;
    }

    setLoading(true);
    setUpdating(false);
    setError('');
    setSuccessMessage('');

    try {
      const result = await api.getStockItemByQrCode(trimmedId);
      if (result?.success && result.data) {
        const normalized = normalizeStockItem({ ...result.data, id: result.data._id || result.data.id || trimmedId });
        setScannedItem(normalized);
        setStatus(normalized.status);
        setLocation(normalized.location ?? '');
        updateLocalStock(normalized);
        setSuccessMessage('Chapa localizada com sucesso!');
        logActivity('stock_scanned', 'stock_item', normalized.id, `Chapa ${normalized.id}`, {
          status: normalized.status,
          location: normalized.location,
        });
      } else {
        setScannedItem(null);
        setError(result?.message || 'Nenhuma chapa encontrada para o QR Code informado.');
      }
    } catch (fetchError) {
      console.error('Erro ao consultar QR Code:', fetchError);
      setError('Não foi possível consultar o QR Code no momento.');
      setScannedItem(null);
    } finally {
      setLoading(false);
    }
  }, [logActivity, updateLocalStock]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    await handleFetchItem(inputId);
  };

  const handleSimulateScan = () => {
    if (stockItems.length === 0) {
      setError('Nenhum item de estoque disponível para simulação.');
      return;
    }

    const randomItem = stockItems[Math.floor(Math.random() * stockItems.length)];
    setInputId(randomItem.id);
    void handleFetchItem(randomItem.id);
  };

  const handleUpdate = async () => {
    if (!scannedItem) {
      setError('Localize uma chapa antes de atualizar as informações.');
      return;
    }

    if (status === scannedItem.status && (location ?? '') === (scannedItem.location ?? '')) {
      setSuccessMessage('Nenhuma alteração detectada para atualizar.');
      return;
    }

    setUpdating(true);
    setError('');
    setSuccessMessage('');

    try {
      const result = await api.updateStockItemStatus(scannedItem.id, {
        status,
        location,
      });

      if (result?.success && result.data) {
        const normalized = normalizeStockItem({ ...result.data, id: result.data._id || result.data.id || scannedItem.id });
        setScannedItem(normalized);
        setStatus(normalized.status);
        setLocation(normalized.location ?? '');
        updateLocalStock(normalized);
        setSuccessMessage('Status e localização atualizados com sucesso!');
        logActivity('stock_status_updated', 'stock_item', normalized.id, `Chapa ${normalized.id}`, {
          status: normalized.status,
          location: normalized.location,
        });
      } else {
        setError(result?.message || 'Não foi possível atualizar as informações da chapa.');
      }
    } catch (updateError) {
      console.error('Erro ao atualizar status do estoque:', updateError);
      setError('Ocorreu um erro ao atualizar as informações.');
    } finally {
      setUpdating(false);
    }
  };

  return (
    <Card className={`p-0 ${className}`}>
      <CardHeader className="border-b border-border dark:border-slate-700">
        <div>
          <h2 className="text-xl font-semibold text-text-primary dark:text-slate-100">Scanner de QR Code</h2>
          <p className="mt-1 text-sm text-text-secondary dark:text-slate-400">
            Digite ou simule o escaneamento de um QR Code para localizar chapas e atualizar status e localização.
          </p>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex flex-col gap-3 lg:flex-row">
            <Input
              id="qr-code-input"
              label="ID do QR Code"
              placeholder="Ex.: SLAB-00123"
              value={inputId}
              onChange={event => setInputId(event.target.value)}
              autoComplete="off"
            />
            <div className="flex items-end gap-2">
              <Button type="submit" disabled={loading}>
                {loading ? 'Consultando...' : 'Buscar QR Code'}
              </Button>
              <Button type="button" variant="secondary" onClick={handleSimulateScan} disabled={loading}>
                Simular Escaneamento
              </Button>
            </div>
          </div>
        </form>

        {error && (
          <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-600 dark:border-red-800 dark:bg-red-900/20 dark:text-red-300">
            {error}
          </div>
        )}

        {successMessage && (
          <div className="rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-700 dark:border-green-700 dark:bg-green-900/30 dark:text-green-300">
            {successMessage}
          </div>
        )}

        {scannedItem && (
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-3">
              <div>
                <p className="text-xs font-semibold uppercase text-text-secondary dark:text-slate-400">Identificador</p>
                <p className="text-lg font-mono text-text-primary dark:text-slate-100">{scannedItem.id}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase text-text-secondary dark:text-slate-400">Status Atual</p>
                <StatusBadge status={scannedItem.status} statusMap={stockStatusMap} />
              </div>
              {scannedItem.photoUrl && (
                <div>
                  <p className="text-xs font-semibold uppercase text-text-secondary dark:text-slate-400">Foto</p>
                  <img
                    src={scannedItem.photoUrl}
                    alt={`Chapa ${scannedItem.id}`}
                    className="mt-1 h-32 w-full rounded-md object-cover"
                  />
                </div>
              )}
              <div>
                <p className="text-xs font-semibold uppercase text-text-secondary dark:text-slate-400">Localização Atual</p>
                <p className="text-sm text-text-primary dark:text-slate-100">{scannedItem.location || 'Não informado'}</p>
              </div>
              {(scannedItem.width || scannedItem.height) && (
                <div className="grid grid-cols-3 gap-2 text-sm text-text-secondary dark:text-slate-400">
                  <div>
                    <span className="font-semibold text-text-primary dark:text-slate-100">Largura</span>
                    <p>{scannedItem.width} m</p>
                  </div>
                  <div>
                    <span className="font-semibold text-text-primary dark:text-slate-100">Altura</span>
                    <p>{scannedItem.height} m</p>
                  </div>
                  <div>
                    <span className="font-semibold text-text-primary dark:text-slate-100">Espessura</span>
                    <p>{scannedItem.thickness} cm</p>
                  </div>
                </div>
              )}
            </div>
            <div className="space-y-4">
              <Select
                value={status}
                onChange={event => setStatus(event.target.value as StockItemStatus)}
                label="Atualizar Status"
              >
                {statusOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Select>
              <Input
                id="qr-code-location"
                label="Localização"
                placeholder="Ex.: Pátio A - Rack 3"
                value={location}
                onChange={event => setLocation(event.target.value)}
              />
              <Button type="button" onClick={handleUpdate} disabled={updating}>
                {updating ? 'Atualizando...' : `Salvar (${selectedStatusLabel})`}
              </Button>
              <p className="text-xs text-text-secondary dark:text-slate-500">
                As alterações serão refletidas automaticamente nas listagens que utilizam o estoque.
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default QrCodeScanner;
