const ActivityLog = require('../models/ActivityLog');
const Equipment = require('../models/Equipment');
const Product = require('../models/Product');
const StockItem = require('../models/StockItem');
const CutPiece = require('../models/CutPiece');

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
    statusField: null, // Product não tem campo de status gerenciado desta forma
    locationField: null, // Product não tem campo de localização gerenciado desta forma
    allowedStatuses: null,
    logLabel: 'produto',
  },
  cut_piece: {
    aliases: ['cut_piece', 'cutpiece', 'peca_cortada', 'peca'],
    model: CutPiece,
    statusField: 'status',
    locationField: 'location',
    allowedStatuses: ['pending_cut', 'cut', 'finishing', 'assembly', 'quality_check', 'ready_for_delivery', 'delivered', 'installed', 'defective', 'rework'],
    logLabel: 'peça cortada',
    idField: 'pieceId',
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

// Função auxiliar para buscar asset usando o campo correto
const findAssetById = async (config, id) => {
  if (config.idField && config.idField !== '_id') {
    // Para CutPiece, usar pieceId em vez de _id
    return await config.model.findOne({ [config.idField]: id });
  } else {
    // Para outros assets, usar _id padrão
    return await config.model.findById(id);
  }
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

    const asset = await findAssetById(config, parsed.id);

    if (!asset) {
      return res.status(404).json({
        success: false,
        message: 'Asset não encontrado para o QR Code informado',
      });
    }

    const assetData = asset.toObject({ virtuals: true });

    // Obter status e localização de forma genérica usando os campos configurados
    const currentStatus = config.statusField && assetData.hasOwnProperty(config.statusField) 
      ? assetData[config.statusField] 
      : undefined;
    const currentLocation = config.locationField && assetData.hasOwnProperty(config.locationField) 
      ? assetData[config.locationField] 
      : undefined;

    await ActivityLog.create(
      buildAssetLogPayload({
        action: 'asset_scanned',
        asset,
        config,
        description: `Leitura de ${config.logLabel} via QR Code`,
        previousStatus: currentStatus,
        newStatus: currentStatus,
        previousLocation: currentLocation,
        newLocation: currentLocation,
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

    const asset = await findAssetById(config, id);

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

    // Acessar campo de status de forma genérica
    const previousStatus = asset[config.statusField] || null;

    if (previousStatus === status) {
      return res.status(400).json({
        success: false,
        message: 'O status informado é igual ao status atual do asset',
      });
    }

    // Atualizar status de forma genérica usando o campo configurado
    asset[config.statusField] = status;
    await asset.save();

    const updated = asset.toObject({ virtuals: true });

    // Obter localização de forma genérica após atualização
    const currentLocation = config.locationField && updated.hasOwnProperty(config.locationField) 
      ? updated[config.locationField] 
      : undefined;

    await ActivityLog.create(
      buildAssetLogPayload({
        action: 'asset_status_updated',
        asset,
        config,
        description: `Status do ${config.logLabel} atualizado de ${previousStatus || 'indefinido'} para ${status}`,
        previousStatus,
        newStatus: status,
        previousLocation: currentLocation,
        newLocation: currentLocation,
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

    const asset = await findAssetById(config, id);

    if (!asset) {
      return res.status(404).json({
        success: false,
        message: 'Asset não encontrado',
      });
    }

    // Acessar campo de localização de forma genérica usando o campo configurado
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

    // Atualizar localização de forma genérica usando o campo configurado
    asset[config.locationField] = trimmedLocation;
    await asset.save();

    const updated = asset.toObject({ virtuals: true });

    // Obter status de forma genérica após atualização
    const currentStatus = config.statusField && updated.hasOwnProperty(config.statusField) 
      ? updated[config.statusField] 
      : undefined;

    await ActivityLog.create(
      buildAssetLogPayload({
        action: 'asset_location_updated',
        asset,
        config,
        description: `Localização do ${config.logLabel} atualizada de ${previousLocation || 'indefinido'} para ${trimmedLocation}`,
        previousStatus: currentStatus,
        newStatus: currentStatus,
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

exports.createRetalhoFromSlab = async (req, res) => {
  try {
    const originalSlabId = req.params.id;
    const { shape, width_cm, height_cm, shapePoints, location } = req.body || {};

    const originalSlab = await StockItem.findById(originalSlabId);

    if (!originalSlab) {
      return res.status(404).json({
        success: false,
        message: 'Chapa original não encontrada',
      });
    }

    const statusEnum = (StockItem.schema && StockItem.schema.path('status') && StockItem.schema.path('status').enumValues) || [];
    const consumedStatus = statusEnum.includes('consumed')
      ? 'consumed'
      : statusEnum.includes('consumida')
      ? 'consumida'
      : 'consumed';
    const availableStatus = statusEnum.includes('available')
      ? 'available'
      : statusEnum.includes('disponivel')
      ? 'disponivel'
      : 'available';
    const partialStatus = statusEnum.includes('partial')
      ? 'partial'
      : statusEnum.includes('retalho')
      ? 'retalho'
      : 'partial';

    const originalPreviousStatus = originalSlab.status || null;
    originalSlab.status = consumedStatus;
    await originalSlab.save();

    const baseInternalId = originalSlab.internalId || originalSlab._id.toString();
    const existingRetalhosCount = await StockItem.countDocuments({ parentSlabId: originalSlab._id });
    const newRetalhoIndex = existingRetalhosCount + 1;
    const newInternalId = `${baseInternalId}-R${newRetalhoIndex}`;
    const qrCodeValue = `marmoraria://asset/stock_item/${newInternalId}`;

    const newRetalho = new StockItem({
      materialId: originalSlab.materialId,
      photoUrl: originalSlab.photoUrl,
      width: typeof width_cm === 'number' ? width_cm / 100 : originalSlab.width,
      height: typeof height_cm === 'number' ? height_cm / 100 : originalSlab.height,
      thickness: originalSlab.thickness,
      location: location || originalSlab.location,
      status: partialStatus,
      parentSlabId: originalSlab._id,
      internalId: newInternalId,
      qrCodeValue,
      shape,
      width_cm,
      height_cm,
      shapePoints,
    });

    await newRetalho.save();

    await ActivityLog.create({
      action: 'stock_status_updated',
      description: `Retalho ${newInternalId} criado a partir da chapa ${baseInternalId}`,
      relatedEntityType: 'stock_item',
      relatedEntityId: newRetalho._id.toString(),
      previousStatus: null,
      newStatus: availableStatus,
      metadata: {
        originalSlabId: originalSlab._id.toString(),
        newRetalhoId: newRetalho._id.toString(),
        internalId: newInternalId,
        originalPreviousStatus,
        consumedStatus,
      },
      user: buildUserSnapshot(req.user),
    });

    return res.status(201).json({
      success: true,
      data: newRetalho,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Erro ao criar retalho a partir da chapa',
      error: error.message,
    });
  }
};
