import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import Card, { CardContent, CardHeader } from './ui/Card';
import Input from './ui/Input';
import Button from './ui/Button';
import Select from './ui/Select';
import StatusBadge from './ui/StatusBadge';
import { equipmentStatusMap, stockStatusMap } from '../config/statusMaps';
import type {
  ActivityType,
  Equipment,
  EquipmentStatus,
  Product,
  StockItem,
  StockItemStatus,
} from '../types';
import { useData } from '../context/DataContext';
import { api } from '../utils/api';
import { useActivityLogger } from '../hooks/useActivityLogger';

type AssetType = 'stock_item' | 'equipment' | 'product';

type AssetPayload =
  | { type: 'stock_item'; data: StockItem }
  | { type: 'equipment'; data: Equipment }
  | { type: 'product'; data: Product };

interface QrCodeScannerProps {
  className?: string;
}

type RawStockItem = Partial<StockItem> & { id?: string; _id?: string; [key: string]: unknown };
type RawEquipment = Partial<Equipment> & { id?: string; _id?: string; [key: string]: unknown };
type RawProduct = Partial<Product> & { id?: string; _id?: string; [key: string]: unknown };

declare global {
  interface Window {
    BarcodeDetector?: new (options?: { formats?: string[] }) => BarcodeDetector;
  }

  interface BarcodeDetector {
    detect: (source: CanvasImageSource) => Promise<Array<{ rawValue?: string }>>;
  }
}

const assetTypeLabels: Record<AssetType, string> = {
  stock_item: 'Item de estoque',
  equipment: 'Equipamento',
  product: 'Produto',
};

const stockStatusOptions: { value: StockItemStatus; label: string }[] = [
  { value: 'disponivel', label: stockStatusMap.disponivel.label },
  { value: 'reservada', label: stockStatusMap.reservada.label },
  { value: 'em_uso', label: stockStatusMap.em_uso.label },
  { value: 'consumida', label: stockStatusMap.consumida.label },
  { value: 'em_corte', label: stockStatusMap.em_corte.label },
  { value: 'em_acabamento', label: stockStatusMap.em_acabamento.label },
  { value: 'pronto_para_expedicao', label: stockStatusMap.pronto_para_expedicao.label },
];

const equipmentStatusOptions: { value: EquipmentStatus; label: string }[] = [
  { value: 'operacional', label: equipmentStatusMap.operacional.label },
  { value: 'em_manutencao', label: equipmentStatusMap.em_manutencao.label },
  { value: 'desativado', label: equipmentStatusMap.desativado.label },
];

const normalizeStockItem = (data: RawStockItem): StockItem => {
  const fallbackStatus: StockItemStatus = 'disponivel';
  const rawData = data as Record<string, any>;
  const parsedStatus = (data.status ?? rawData.currentStatus) as StockItemStatus | undefined;
  const width = typeof data.width === 'number' ? data.width : Number(data.width ?? 0);
  const height = typeof data.height === 'number' ? data.height : Number(data.height ?? 0);
  const thickness = typeof data.thickness === 'number' ? data.thickness : Number(data.thickness ?? 0);

  const statusCandidate = parsedStatus && stockStatusOptions.some(option => option.value === parsedStatus)
    ? parsedStatus
    : fallbackStatus;

  return {
    id: data.id ?? (rawData._id as string) ?? '',
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

const normalizeEquipment = (data: RawEquipment): Equipment => {
  const raw = data as Record<string, any>;

  return {
    id: data.id ?? (raw._id as string) ?? '',
    name: data.name ?? '',
    serialNumber: data.serialNumber ?? '',
    category: (data.category as Equipment['category']) ?? 'maquina',
    purchaseDate: data.purchaseDate ?? new Date().toISOString(),
    warrantyEndDate: data.warrantyEndDate ?? new Date().toISOString(),
    purchaseInvoiceNumber:
      data.purchaseInvoiceNumber ?? raw.purchaseInvoiceId ?? raw.purchaseInvoiceNumber ?? '',
    supplierCnpj: data.supplierCnpj ?? raw.supplierCnpj ?? '',
    assignedTo: data.assignedTo ?? '',
    status: (data.status as EquipmentStatus) ?? 'operacional',
    currentLocation: data.currentLocation ?? raw.location ?? '',
    notes: data.notes ?? raw.notes ?? '',
    createdAt: data.createdAt ?? new Date().toISOString(),
    updatedAt: data.updatedAt ?? new Date().toISOString(),
  };
};

const normalizeProduct = (data: RawProduct): Product => {
  const raw = data as Record<string, any>;

  const toNumber = (value: unknown) => {
    const parsed = Number(value ?? 0);
    return Number.isNaN(parsed) ? 0 : parsed;
  };

  return {
    id: data.id ?? (raw._id as string) ?? '',
    name: data.name ?? '',
    cost: toNumber(data.cost ?? raw.cost),
    price: toNumber(data.price ?? raw.price),
    stock: toNumber(data.stock ?? raw.stock),
  };
};

const normalizeAssetPayload = (payload: { type: string; data: unknown }): AssetPayload | null => {
  switch (payload.type) {
    case 'stock_item':
      return { type: 'stock_item', data: normalizeStockItem(payload.data as RawStockItem) };
    case 'equipment':
      return { type: 'equipment', data: normalizeEquipment(payload.data as RawEquipment) };
    case 'product':
      return { type: 'product', data: normalizeProduct(payload.data as RawProduct) };
    default:
      return null;
  }
};

const getAssetDisplayName = (payload: AssetPayload): string => {
  if (payload.type === 'stock_item') {
    return `Chapa ${payload.data.id}`;
  }
  if (payload.type === 'equipment') {
    return payload.data.name || `Equipamento ${payload.data.id}`;
  }
  return payload.data.name || `Produto ${payload.data.id}`;
};

interface CameraQrReaderProps {
  onResult: (value: string) => void;
  onError: (error: Error) => void;
}

const CameraQrReader: React.FC<CameraQrReaderProps> = ({ onResult, onError }) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const detectionTimer = useRef<number | null>(null);
  const lastValueRef = useRef('');
  const reportedErrorRef = useRef(false);

  useEffect(() => {
    let cancelled = false;

    const startCamera = async () => {
      if (!navigator.mediaDevices?.getUserMedia) {
        if (!reportedErrorRef.current) {
          onError(new Error('Captura de mídia não é suportada neste dispositivo.'));
          reportedErrorRef.current = true;
        }
        return;
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
        if (cancelled) {
          stream.getTracks().forEach(track => track.stop());
          return;
        }

        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }

        if (typeof window.BarcodeDetector === 'function') {
          const detector = new window.BarcodeDetector({ formats: ['qr_code'] });

          const detect = async () => {
            if (cancelled || !videoRef.current) {
              return;
            }

            try {
              const codes = await detector.detect(videoRef.current);
              const match = codes.find(code => code.rawValue);
              if (match?.rawValue && match.rawValue !== lastValueRef.current) {
                lastValueRef.current = match.rawValue;
                onResult(match.rawValue);
              }
            } catch (detectionError) {
              if (!reportedErrorRef.current) {
                onError(detectionError as Error);
                reportedErrorRef.current = true;
              }
            }

            if (!cancelled) {
              detectionTimer.current = window.setTimeout(detect, 500);
            }
          };

          detect();
        } else if (!reportedErrorRef.current) {
          onError(new Error('Leitura de QR Code não é suportada neste navegador.'));
          reportedErrorRef.current = true;
        }
      } catch (cameraError) {
        if (!reportedErrorRef.current) {
          onError(cameraError as Error);
          reportedErrorRef.current = true;
        }
      }
    };

    void startCamera();

    return () => {
      cancelled = true;
      if (detectionTimer.current) {
        window.clearTimeout(detectionTimer.current);
        detectionTimer.current = null;
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
      lastValueRef.current = '';
    };
  }, [onError, onResult]);

  return (
    <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-black">
      <video ref={videoRef} className="h-full w-full object-cover" muted playsInline />
      <div className="pointer-events-none absolute inset-0 border-4 border-white/20" aria-hidden="true" />
    </div>
  );
};

const QrCodeScanner: React.FC<QrCodeScannerProps> = ({ className = '' }) => {
  const { stockItems, setStockItems, setEquipment } = useData();
  const { logActivity } = useActivityLogger();

  const manualInputRef = useRef<HTMLInputElement | null>(null);

  const [mode, setMode] = useState<'camera' | 'manual'>('manual');
  const [manualType, setManualType] = useState<AssetType>('stock_item');
  const [manualInput, setManualInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [cameraPermission, setCameraPermission] = useState<'unknown' | 'granted' | 'denied'>('unknown');
  const [cameraLoading, setCameraLoading] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [assetPayload, setAssetPayload] = useState<AssetPayload | null>(null);
  const [statusValue, setStatusValue] = useState('');
  const [locationValue, setLocationValue] = useState('');
  const [lastScan, setLastScan] = useState<{ data: string; timestamp: number } | null>(null);

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

  const updateLocalEquipment = useCallback((item: Equipment) => {
    setEquipment(prev => {
      const existingIndex = prev.findIndex(eq => eq.id === item.id);
      if (existingIndex >= 0) {
        const updated = [...prev];
        updated[existingIndex] = item;
        return updated;
      }
      return [item, ...prev];
    });
  }, [setEquipment]);

  const clearAssetData = useCallback(() => {
    setAssetPayload(null);
    setStatusValue('');
    setLocationValue('');
  }, []);

  const applyAssetPayload = useCallback((payload: AssetPayload) => {
    setAssetPayload(payload);

    if (payload.type === 'stock_item') {
      setStatusValue(payload.data.status);
      setLocationValue(payload.data.location ?? '');
      updateLocalStock(payload.data);
    } else if (payload.type === 'equipment') {
      setStatusValue(payload.data.status);
      setLocationValue(payload.data.currentLocation ?? '');
      updateLocalEquipment(payload.data);
    } else {
      setStatusValue('');
      setLocationValue('');
    }
  }, [updateLocalEquipment, updateLocalStock]);

  const requestCameraPermission = useCallback(async () => {
    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      setCameraPermission('denied');
      setCameraError('Este dispositivo não suporta captura de câmera no navegador. Utilize a entrada manual.');
      return;
    }

    setCameraLoading(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      setCameraPermission('granted');
      setCameraError('');
      stream.getTracks().forEach(track => track.stop());
    } catch (permissionError) {
      console.error('Erro ao solicitar permissão da câmera:', permissionError);
      setCameraPermission('denied');
      setCameraError('Permissão para acessar a câmera foi negada. Verifique as configurações do navegador.');
    } finally {
      setCameraLoading(false);
    }
  }, []);

  useEffect(() => {
    if (mode === 'manual') {
      manualInputRef.current?.focus();
    }
  }, [mode]);

  useEffect(() => {
    if (mode === 'camera' && cameraPermission === 'unknown') {
      void requestCameraPermission();
    }
  }, [mode, cameraPermission, requestCameraPermission]);

  const handleModeChange = (nextMode: 'camera' | 'manual') => {
    setMode(nextMode);
    setError('');
    if (nextMode === 'manual') {
      setCameraError('');
    }
  };

  const handleScanRequest = useCallback(async (qrData: string, source: 'camera' | 'manual') => {
    const trimmedData = qrData.trim();
    if (!trimmedData || isScanning) {
      return;
    }

    const now = Date.now();
    if (lastScan && lastScan.data === trimmedData && now - lastScan.timestamp < 3000) {
      return;
    }

    setLastScan({ data: trimmedData, timestamp: now });
    setIsScanning(true);
    if (source === 'manual') {
      setLoading(true);
    }

    setError('');
    setCameraError('');
    setSuccessMessage('');

    try {
      const result = await api.scanAssetQrCode(trimmedData);
      if (result?.success && result.data) {
        const normalized = normalizeAssetPayload(result.data);
        if (normalized) {
          applyAssetPayload(normalized);
          const assetLabel = assetTypeLabels[normalized.type];
          setSuccessMessage(`${assetLabel} localizado com sucesso!`);
          const details: Record<string, any> = { qrData: trimmedData };
          if (normalized.type === 'stock_item') {
            details.status = normalized.data.status;
            details.location = normalized.data.location;
          } else if (normalized.type === 'equipment') {
            details.status = normalized.data.status;
            details.location = normalized.data.currentLocation;
          }
          logActivity('asset_scanned', normalized.type, normalized.data.id, getAssetDisplayName(normalized), details);
        } else {
          clearAssetData();
          setError('Tipo de asset não suportado para o QR Code informado.');
        }
      } else {
        clearAssetData();
        setError(result?.message || 'Nenhum asset encontrado para o QR Code informado.');
      }
    } catch (fetchError) {
      console.error('Erro ao consultar QR Code:', fetchError);
      clearAssetData();
      setError('Não foi possível consultar o QR Code no momento.');
    } finally {
      if (source === 'manual') {
        setLoading(false);
      }
      setIsScanning(false);
    }
  }, [applyAssetPayload, clearAssetData, isScanning, lastScan, logActivity]);

  const handleCameraSuccess = useCallback((value: string) => {
    if (value) {
      void handleScanRequest(value, 'camera');
    }
  }, [handleScanRequest]);

  const handleCameraError = useCallback((cameraIssue: Error) => {
    console.warn('Camera QR reader error:', cameraIssue);
    setCameraError(previous => (previous && previous === cameraIssue.message ? previous : cameraIssue.message));
  }, []);

  const handleManualSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const trimmedId = manualInput.trim();
    if (!trimmedId) {
      setError('Informe o identificador do ativo ou utilize a leitura por câmera.');
      return;
    }

    const qrData = trimmedId.startsWith('marmoraria://asset/')
      ? trimmedId
      : `marmoraria://asset/${manualType}/${trimmedId}`;
    await handleScanRequest(qrData, 'manual');
  };

  const handleSimulateScan = () => {
    if (stockItems.length === 0) {
      setError('Nenhum item de estoque disponível para simulação.');
      return;
    }

    const randomItem = stockItems[Math.floor(Math.random() * stockItems.length)];
    setManualType('stock_item');
    setManualInput(randomItem.id);
    void handleScanRequest(`marmoraria://asset/stock_item/${randomItem.id}`, 'manual');
  };

  const supportsStatus = assetPayload?.type === 'stock_item' || assetPayload?.type === 'equipment';
  const supportsLocation = assetPayload?.type === 'stock_item' || assetPayload?.type === 'equipment';
  const showUpdateControls = Boolean(assetPayload && (supportsStatus || supportsLocation));

  const statusOptions = useMemo(() => {
    if (!assetPayload) {
      return [] as { value: string; label: string }[];
    }

    if (assetPayload.type === 'stock_item') {
      return stockStatusOptions;
    }

    if (assetPayload.type === 'equipment') {
      return equipmentStatusOptions;
    }

    return [];
  }, [assetPayload]);

  const currentLocation = useMemo(() => {
    if (!assetPayload || !supportsLocation) {
      return '';
    }

    if (assetPayload.type === 'stock_item') {
      return assetPayload.data.location ?? '';
    }

    if (assetPayload.type === 'equipment') {
      return assetPayload.data.currentLocation ?? '';
    }

    return '';
  }, [assetPayload, supportsLocation]);

  const handleAssetUpdate = async () => {
    if (!assetPayload) {
      setError('Localize um ativo antes de atualizar as informações.');
      return;
    }

    const trimmedLocation = locationValue.trim();
    const currentStatus = supportsStatus
      ? (assetPayload.type === 'stock_item'
        ? assetPayload.data.status
        : assetPayload.data.status)
      : '';

    const statusChanged = supportsStatus && statusValue && statusValue !== currentStatus;
    const locationChanged = supportsLocation && trimmedLocation !== currentLocation;

    if (!statusChanged && !locationChanged) {
      setSuccessMessage('Nenhuma alteração detectada para atualizar.');
      return;
    }

    if (supportsLocation && locationChanged && !trimmedLocation) {
      setError('Informe uma localização válida para atualizar o ativo.');
      return;
    }

    setUpdating(true);
    setError('');
    setSuccessMessage('');

    try {
      let latestPayload: AssetPayload | null = assetPayload;

      if (statusChanged) {
        const response = await api.updateAssetStatus(assetPayload.type, assetPayload.data.id, { status: statusValue });
        if (!response?.success || !response.data) {
          throw new Error(response?.message || 'Não foi possível atualizar o status do ativo.');
        }
        const normalized = normalizeAssetPayload(response.data);
        if (normalized) {
          applyAssetPayload(normalized);
          latestPayload = normalized;
        }
      }

      if (locationChanged) {
        const response = await api.updateAssetLocation(assetPayload.type, assetPayload.data.id, { location: trimmedLocation });
        if (!response?.success || !response.data) {
          throw new Error(response?.message || 'Não foi possível atualizar a localização do ativo.');
        }
        const normalized = normalizeAssetPayload(response.data);
        if (normalized) {
          applyAssetPayload(normalized);
          latestPayload = normalized;
        }
      }

      if (latestPayload) {
        if (latestPayload.type === 'stock_item') {
          setStatusValue(latestPayload.data.status);
          setLocationValue(latestPayload.data.location ?? '');
        } else if (latestPayload.type === 'equipment') {
          setStatusValue(latestPayload.data.status);
          setLocationValue(latestPayload.data.currentLocation ?? '');
        } else {
          setStatusValue('');
          setLocationValue('');
        }

        const activityType: ActivityType = statusChanged && locationChanged
          ? 'asset_status_location_updated'
          : statusChanged
            ? 'asset_status_updated'
            : 'asset_location_updated';

        const details: Record<string, any> = {};
        if (latestPayload.type === 'stock_item') {
          details.status = latestPayload.data.status;
          details.location = latestPayload.data.location;
        } else if (latestPayload.type === 'equipment') {
          details.status = latestPayload.data.status;
          details.location = latestPayload.data.currentLocation;
        }

        logActivity(activityType, latestPayload.type, latestPayload.data.id, getAssetDisplayName(latestPayload), details);
      }

      setSuccessMessage('Informações do ativo atualizadas com sucesso!');
    } catch (updateError) {
      console.error('Erro ao atualizar informações do ativo:', updateError);
      setError(updateError instanceof Error ? updateError.message : 'Ocorreu um erro ao atualizar as informações.');
    } finally {
      setUpdating(false);
    }
  };

  const manualTypeOptions: { value: AssetType; label: string }[] = useMemo(() => ([
    { value: 'stock_item', label: 'Item de estoque' },
    { value: 'equipment', label: 'Equipamento' },
    { value: 'product', label: 'Produto' },
  ]), []);

  return (
    <Card className={`p-0 ${className}`}>
      <CardHeader className="border-b border-border dark:border-slate-700">
        <div>
          <h2 className="text-xl font-semibold text-text-primary dark:text-slate-100">Scanner de QR Code</h2>
          <p className="mt-1 text-sm text-text-secondary dark:text-slate-400">
            Utilize a câmera do dispositivo ou informe manualmente o conteúdo do QR Code para localizar ativos e atualizar status ou localização.
          </p>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Modo de leitura do QR Code">
          <Button
            type="button"
            variant={mode === 'camera' ? 'primary' : 'ghost'}
            aria-pressed={mode === 'camera'}
            aria-controls="qr-camera-section"
            onClick={() => handleModeChange('camera')}
            disabled={cameraLoading}
          >
            {cameraPermission === 'granted' ? 'Usar câmera' : 'Ativar câmera'}
          </Button>
          <Button
            type="button"
            variant={mode === 'manual' ? 'primary' : 'ghost'}
            aria-pressed={mode === 'manual'}
            aria-controls="qr-manual-section"
            onClick={() => handleModeChange('manual')}
          >
            Entrada manual
          </Button>
        </div>

        {mode === 'camera' && (
          <section
            id="qr-camera-section"
            aria-live="polite"
            className="space-y-3"
          >
            {cameraLoading && (
              <div className="rounded-md border border-border bg-slate-50 p-3 text-sm text-text-secondary dark:border-slate-700 dark:bg-slate-800/40 dark:text-slate-300">
                Solicitando permissão para acessar a câmera...
              </div>
            )}
            {cameraPermission === 'denied' && !cameraLoading && (
              <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-600 dark:border-red-800 dark:bg-red-900/30 dark:text-red-300" role="alert">
                Não foi possível acessar a câmera. Autorize o uso da câmera nas configurações do navegador ou utilize a entrada manual.
              </div>
            )}
            {cameraPermission !== 'denied' && !cameraLoading && (
              <div className="overflow-hidden rounded-lg border border-dashed border-border dark:border-slate-700">
                <CameraQrReader onResult={handleCameraSuccess} onError={handleCameraError} />
              </div>
            )}
            {isScanning && (
              <p className="text-xs text-text-secondary dark:text-slate-400">Processando leitura do QR Code...</p>
            )}
            {cameraPermission === 'granted' && !cameraLoading && (
              <p className="text-xs text-text-secondary dark:text-slate-500">
                Aponte a câmera para o QR Code até que a leitura seja confirmada.
              </p>
            )}
          </section>
        )}

        {mode === 'manual' && (
          <form id="qr-manual-section" onSubmit={handleManualSubmit} className="space-y-3" aria-live="polite">
            <div className="flex flex-col gap-3 lg:flex-row">
              <Select
                id="qr-manual-type"
                label="Tipo de ativo"
                value={manualType}
                onChange={event => setManualType(event.target.value as AssetType)}
              >
                {manualTypeOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Select>
              <Input
                ref={manualInputRef}
                id="qr-code-input"
                label="Identificador ou QR Code"
                placeholder="Ex.: marmoraria://asset/stock_item/SLAB-00123"
                value={manualInput}
                onChange={event => setManualInput(event.target.value)}
                autoComplete="off"
                aria-describedby="qr-manual-hint"
              />
              <div className="flex items-end gap-2">
                <Button type="submit" disabled={loading || isScanning}>
                  {loading ? 'Consultando...' : 'Buscar QR Code'}
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={handleSimulateScan}
                  disabled={loading || isScanning || stockItems.length === 0}
                >
                  Simular leitura
                </Button>
              </div>
            </div>
            <p id="qr-manual-hint" className="text-xs text-text-secondary dark:text-slate-500">
              Você também pode colar o conteúdo completo do QR Code gerado pelo aplicativo móvel.
            </p>
          </form>
        )}

        {cameraError && (
          <div className="rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-700 dark:border-amber-700 dark:bg-amber-900/30 dark:text-amber-200" role="alert">
            {cameraError}
          </div>
        )}

        {error && (
          <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-600 dark:border-red-800 dark:bg-red-900/30 dark:text-red-300" role="alert">
            {error}
          </div>
        )}

        {successMessage && (
          <div className="rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-700 dark:border-green-700 dark:bg-green-900/30 dark:text-green-300" role="status" aria-live="polite">
            {successMessage}
          </div>
        )}

        {assetPayload && (
          <div className={`grid gap-4 ${showUpdateControls ? 'md:grid-cols-2' : ''}`}>
            <div className="space-y-3">
              <div>
                <p className="text-xs font-semibold uppercase text-text-secondary dark:text-slate-400">Identificador</p>
                <p className="text-lg font-mono text-text-primary dark:text-slate-100">{assetPayload.data.id}</p>
              </div>

              {assetPayload.type === 'stock_item' && (
                <>
                  <div>
                    <p className="text-xs font-semibold uppercase text-text-secondary dark:text-slate-400">Status Atual</p>
                    <StatusBadge status={assetPayload.data.status} statusMap={stockStatusMap} />
                  </div>
                  {assetPayload.data.photoUrl && (
                    <div>
                      <p className="text-xs font-semibold uppercase text-text-secondary dark:text-slate-400">Foto</p>
                      <img
                        src={assetPayload.data.photoUrl}
                        alt={`Chapa ${assetPayload.data.id}`}
                        className="mt-1 h-32 w-full rounded-md object-cover"
                      />
                    </div>
                  )}
                  <div>
                    <p className="text-xs font-semibold uppercase text-text-secondary dark:text-slate-400">Localização Atual</p>
                    <p className="text-sm text-text-primary dark:text-slate-100">{assetPayload.data.location || 'Não informado'}</p>
                  </div>
                  {(assetPayload.data.width || assetPayload.data.height || assetPayload.data.thickness) && (
                    <div className="grid grid-cols-3 gap-2 text-sm text-text-secondary dark:text-slate-400">
                      <div>
                        <span className="font-semibold text-text-primary dark:text-slate-100">Largura</span>
                        <p>{assetPayload.data.width} m</p>
                      </div>
                      <div>
                        <span className="font-semibold text-text-primary dark:text-slate-100">Altura</span>
                        <p>{assetPayload.data.height} m</p>
                      </div>
                      <div>
                        <span className="font-semibold text-text-primary dark:text-slate-100">Espessura</span>
                        <p>{assetPayload.data.thickness} cm</p>
                      </div>
                    </div>
                  )}
                </>
              )}

              {assetPayload.type === 'equipment' && (
                <>
                  <div>
                    <p className="text-xs font-semibold uppercase text-text-secondary dark:text-slate-400">Nome</p>
                    <p className="text-sm text-text-primary dark:text-slate-100">{assetPayload.data.name}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase text-text-secondary dark:text-slate-400">Status Atual</p>
                    <StatusBadge status={assetPayload.data.status} statusMap={equipmentStatusMap} />
                  </div>
                  <div className="grid grid-cols-1 gap-2 text-sm text-text-secondary dark:text-slate-400 sm:grid-cols-2">
                    <div>
                      <span className="font-semibold text-text-primary dark:text-slate-100">Número de Série</span>
                      <p>{assetPayload.data.serialNumber || 'Não informado'}</p>
                    </div>
                    <div>
                      <span className="font-semibold text-text-primary dark:text-slate-100">Categoria</span>
                      <p>{assetPayload.data.category}</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase text-text-secondary dark:text-slate-400">Localização Atual</p>
                    <p className="text-sm text-text-primary dark:text-slate-100">{assetPayload.data.currentLocation || 'Não informado'}</p>
                  </div>
                  <div className="grid grid-cols-1 gap-2 text-sm text-text-secondary dark:text-slate-400 sm:grid-cols-2">
                    <div>
                      <span className="font-semibold text-text-primary dark:text-slate-100">NF de Compra</span>
                      <p>{assetPayload.data.purchaseInvoiceNumber || 'Não informado'}</p>
                    </div>
                    <div>
                      <span className="font-semibold text-text-primary dark:text-slate-100">Fornecedor (CNPJ)</span>
                      <p>{assetPayload.data.supplierCnpj || 'Não informado'}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 gap-2 text-sm text-text-secondary dark:text-slate-400 sm:grid-cols-2">
                    <div>
                      <span className="font-semibold text-text-primary dark:text-slate-100">Data da Compra</span>
                      <p>{new Date(assetPayload.data.purchaseDate).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <span className="font-semibold text-text-primary dark:text-slate-100">Fim da Garantia</span>
                      <p>{new Date(assetPayload.data.warrantyEndDate).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase text-text-secondary dark:text-slate-400">Responsável</p>
                    <p className="text-sm text-text-primary dark:text-slate-100">{assetPayload.data.assignedTo || 'Não atribuído'}</p>
                  </div>
                  {assetPayload.data.notes && (
                    <div>
                      <p className="text-xs font-semibold uppercase text-text-secondary dark:text-slate-400">Observações</p>
                      <p className="text-sm text-text-primary dark:text-slate-100">{assetPayload.data.notes}</p>
                    </div>
                  )}
                </>
              )}

              {assetPayload.type === 'product' && (
                <>
                  <div>
                    <p className="text-xs font-semibold uppercase text-text-secondary dark:text-slate-400">Produto</p>
                    <p className="text-sm text-text-primary dark:text-slate-100">{assetPayload.data.name}</p>
                  </div>
                  <div className="grid grid-cols-1 gap-2 text-sm text-text-secondary dark:text-slate-400 sm:grid-cols-3">
                    <div>
                      <span className="font-semibold text-text-primary dark:text-slate-100">Custo</span>
                      <p>R$ {assetPayload.data.cost.toFixed(2)}</p>
                    </div>
                    <div>
                      <span className="font-semibold text-text-primary dark:text-slate-100">Preço</span>
                      <p>R$ {assetPayload.data.price.toFixed(2)}</p>
                    </div>
                    <div>
                      <span className="font-semibold text-text-primary dark:text-slate-100">Estoque</span>
                      <p>{assetPayload.data.stock}</p>
                    </div>
                  </div>
                </>
              )}
            </div>

            {showUpdateControls && (
              <div className="space-y-4">
                {supportsStatus && (
                  <Select
                    value={statusValue}
                    onChange={event => setStatusValue(event.target.value)}
                    label="Atualizar Status"
                  >
                    {statusOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </Select>
                )}
                {supportsLocation && (
                  <Input
                    id="asset-location-input"
                    label="Localização"
                    placeholder={assetPayload.type === 'equipment' ? 'Ex.: Galpão B - Estação 4' : 'Ex.: Pátio A - Rack 3'}
                    value={locationValue}
                    onChange={event => setLocationValue(event.target.value)}
                  />
                )}
                <Button type="button" onClick={handleAssetUpdate} disabled={updating}>
                  {updating ? 'Atualizando...' : 'Salvar alterações'}
                </Button>
                <p className="text-xs text-text-secondary dark:text-slate-500">
                  As alterações serão registradas automaticamente no histórico de atividades do ativo.
                </p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default QrCodeScanner;
