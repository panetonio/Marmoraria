const ActivityLog = require('../models/ActivityLog');
const Equipment = require('../models/Equipment');
const Product = require('../models/Product');
const StockItem = require('../models/StockItem');

const buildUserSnapshot = (user) => {
  if (!user) {
    return undefined;
  }

  return {
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
  };
};

const assetTypeConfigs = {
  stock_item: {
    aliases: ['stock', 'stock-item', 'stockitem', 'stock_item'],
    model: StockItem,
    statusField: 'status',
    locationField: 'location',
    allowedStatuses: [
      'disponivel',
      'reservada',
      'em_uso',
      'consumida',
      'em_corte',
      'em_acabamento',
      'pronto_para_expedicao',
    ],
    logLabel: 'item de estoque',
  },
  equipment: {
    aliases: ['equipment', 'equipamento'],
    model: Equipment,
    statusField: 'status',
    locationField: 'currentLocation',
    allowedStatuses: ['operacional', 'em_manutencao', 'desativado'],
    logLabel: 'equipamento',
  },
  product: {
    aliases: ['product', 'produto'],
    model: Product,
    statusField: null,
    locationField: null,
    allowedStatuses: null,
    logLabel: 'produto',
  },
};

const normalizeAssetType = (type) => {
  if (!type) {
    return null;
  }

  const lowered = String(type).toLowerCase();

  for (const [normalized, config] of Object.entries(assetTypeConfigs)) {
    if (config.aliases.includes(lowered)) {
      return { normalized, config };
    }
  }

  return null;
};

const getAssetConfig = (type) => {
  const normalized = normalizeAssetType(type);
  return normalized ? { ...normalized.config, normalizedType: normalized.normalized } : null;
};

const parseAssetUri = (rawValue) => {
  if (typeof rawValue !== 'string') {
    return null;
  }

  const prefix = 'marmoraria://asset/';

  if (!rawValue.startsWith(prefix)) {
    return null;
  }

  const withoutPrefix = rawValue.slice(prefix.length);
  const [rawType, ...idParts] = withoutPrefix.split('/').filter(Boolean);
  const id = idParts.join('/');

  if (!rawType || !id) {
    return null;
  }

  return { type: rawType, id };
};

const buildAssetLogPayload = ({
  action,
  asset,
  config,
  description,
  previousStatus,
  newStatus,
  previousLocation,
  newLocation,
  user,
  metadata = {},
}) => {
  return {
    action,
    description,
    relatedEntityType: config.normalizedType,
    relatedEntityId: asset._id.toString(),
    previousStatus,
    newStatus,
    previousLocation,
    newLocation,
    metadata: {
      assetType: config.normalizedType,
      assetId: asset._id.toString(),
      ...metadata,
    },
    user: buildUserSnapshot(user),
  };
};

exports.parseAssetUri = parseAssetUri;
exports.getAssetConfig = getAssetConfig;

exports.scanByQrData = async (req, res) => {
  try {
    const { data } = req.query;

    const parsed = parseAssetUri(data);

    if (!parsed) {
      return res.status(400).json({
        success: false,
        message: 'Formato de QR Code inválido. Utilize marmoraria://asset/<tipo>/<id>',
      });
    }

    const config = getAssetConfig(parsed.type);

    if (!config) {
      return res.status(400).json({
        success: false,
        message: 'Tipo de asset não suportado para escaneamento',
      });
    }

    const asset = await config.model.findById(parsed.id);

    if (!asset) {
      return res.status(404).json({
        success: false,
        message: 'Asset não encontrado para o QR Code informado',
      });
    }

    const assetData = asset.toObject({ virtuals: true });

    await ActivityLog.create(
      buildAssetLogPayload({
        action: 'asset_scanned',
        asset,
        config,
        description: `Leitura de ${config.logLabel} via QR Code`,
        previousStatus: config.statusField ? assetData[config.statusField] : undefined,
        newStatus: config.statusField ? assetData[config.statusField] : undefined,
        previousLocation: config.locationField ? assetData[config.locationField] : undefined,
        newLocation: config.locationField ? assetData[config.locationField] : undefined,
        user: req.user,
        metadata: {
          qrData: data,
        },
      })
    );

    return res.json({
      success: true,
      data: {
        type: config.normalizedType,
        data: assetData,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Erro ao processar QR Code do asset',
      error: error.message,
    });
  }
};

exports.updateAssetStatus = async (req, res) => {
  try {
    const { type, id } = req.params;
    const { status } = req.body;

    const config = getAssetConfig(type);

    if (!config || !config.statusField) {
      return res.status(400).json({
        success: false,
        message: 'Atualização de status não é suportada para este tipo de asset',
      });
    }

    const asset = await config.model.findById(id);

    if (!asset) {
      return res.status(404).json({
        success: false,
        message: 'Asset não encontrado',
      });
    }

    if (config.allowedStatuses && !config.allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Status inválido para este asset',
      });
    }

    const previousStatus = asset[config.statusField];

    if (previousStatus === status) {
      return res.status(400).json({
        success: false,
        message: 'O status informado é igual ao status atual do asset',
      });
    }

    asset[config.statusField] = status;
    await asset.save();

    const updated = asset.toObject({ virtuals: true });

    await ActivityLog.create(
      buildAssetLogPayload({
        action: 'asset_status_updated',
        asset,
        config,
        description: `Status do ${config.logLabel} atualizado de ${previousStatus || 'indefinido'} para ${status}`,
        previousStatus,
        newStatus: status,
        previousLocation: config.locationField ? updated[config.locationField] : undefined,
        newLocation: config.locationField ? updated[config.locationField] : undefined,
        user: req.user,
      })
    );

    return res.json({
      success: true,
      message: 'Status do asset atualizado com sucesso',
      data: {
        type: config.normalizedType,
        data: updated,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Erro ao atualizar status do asset',
      error: error.message,
    });
  }
};

exports.updateAssetLocation = async (req, res) => {
  try {
    const { type, id } = req.params;
    const { location } = req.body;

    const config = getAssetConfig(type);

    if (!config || !config.locationField) {
      return res.status(400).json({
        success: false,
        message: 'Atualização de localização não é suportada para este tipo de asset',
      });
    }

    const asset = await config.model.findById(id);

    if (!asset) {
      return res.status(404).json({
        success: false,
        message: 'Asset não encontrado',
      });
    }

    const previousLocation = asset[config.locationField] || '';
    const trimmedLocation = typeof location === 'string' ? location.trim() : '';

    if (!trimmedLocation) {
      return res.status(400).json({
        success: false,
        message: 'Localização é obrigatória',
      });
    }

    if (previousLocation === trimmedLocation) {
      return res.status(400).json({
        success: false,
        message: 'A localização informada é igual à localização atual do asset',
      });
    }

    asset[config.locationField] = trimmedLocation;
    await asset.save();

    const updated = asset.toObject({ virtuals: true });

    await ActivityLog.create(
      buildAssetLogPayload({
        action: 'asset_location_updated',
        asset,
        config,
        description: `Localização do ${config.logLabel} atualizada de ${previousLocation || 'indefinido'} para ${trimmedLocation}`,
        previousStatus: config.statusField ? updated[config.statusField] : undefined,
        newStatus: config.statusField ? updated[config.statusField] : undefined,
        previousLocation,
        newLocation: trimmedLocation,
        user: req.user,
      })
    );

    return res.json({
      success: true,
      message: 'Localização do asset atualizada com sucesso',
      data: {
        type: config.normalizedType,
        data: updated,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Erro ao atualizar localização do asset',
      error: error.message,
    });
  }
};
