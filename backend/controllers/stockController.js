const StockItem = require('../models/StockItem');
const ActivityLog = require('../models/ActivityLog');

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

exports.getStockItemById = async (req, res) => {
  try {
    const { id } = req.params;

    const stockItem = await StockItem.findById(id)
      .populate('materialId', 'name sku supplier photoUrl');

    if (!stockItem) {
      return res.status(404).json({
        success: false,
        message: 'Item de estoque não encontrado',
      });
    }

    await ActivityLog.create({
      stockItem: stockItem._id,
      action: 'read',
      description: 'Consulta de item de estoque via QR Code',
      previousStatus: stockItem.status,
      newStatus: stockItem.status,
      previousLocation: stockItem.location,
      newLocation: stockItem.location,
      user: buildUserSnapshot(req.user),
    });

    return res.json({
      success: true,
      data: stockItem,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Erro ao buscar item de estoque',
      error: error.message,
    });
  }
};

exports.updateStockItemStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, location, note } = req.body;

    const stockItem = await StockItem.findById(id);

    if (!stockItem) {
      return res.status(404).json({
        success: false,
        message: 'Item de estoque não encontrado',
      });
    }

    const previousStatus = stockItem.status;
    const previousLocation = stockItem.location;

    let statusChanged = false;
    let locationChanged = false;

    if (typeof status === 'string' && status !== stockItem.status) {
      stockItem.status = status;
      statusChanged = true;
    }

    if (typeof location === 'string' && location !== stockItem.location) {
      stockItem.location = location;
      locationChanged = true;
    }

    if (!statusChanged && !locationChanged) {
      return res.status(400).json({
        success: false,
        message: 'Nenhuma alteração de status ou localização foi informada',
      });
    }

    await stockItem.save();

    const action = statusChanged && locationChanged
      ? 'status_location_update'
      : statusChanged
        ? 'status_update'
        : 'location_update';

    const descriptionParts = [];

    if (statusChanged) {
      descriptionParts.push(`Status: ${previousStatus} -> ${stockItem.status}`);
    }

    if (locationChanged) {
      descriptionParts.push(`Localização: ${previousLocation} -> ${stockItem.location}`);
    }

    if (note) {
      descriptionParts.push(`Observação: ${note}`);
    }

    await ActivityLog.create({
      stockItem: stockItem._id,
      action,
      description: descriptionParts.join(' | ') || 'Atualização de item de estoque',
      previousStatus: statusChanged ? previousStatus : undefined,
      newStatus: statusChanged ? stockItem.status : undefined,
      previousLocation: locationChanged ? previousLocation : undefined,
      newLocation: locationChanged ? stockItem.location : undefined,
      user: buildUserSnapshot(req.user),
    });

    return res.json({
      success: true,
      message: 'Item de estoque atualizado com sucesso',
      data: stockItem,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Erro ao atualizar item de estoque',
      error: error.message,
    });
  }
};
