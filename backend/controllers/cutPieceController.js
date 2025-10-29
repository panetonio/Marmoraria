const mongoose = require('mongoose');
const CutPiece = require('../models/CutPiece');
const ServiceOrder = require('../models/ServiceOrder');
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

// Buscar todas as CutPieces de uma ServiceOrder
exports.getCutPiecesByServiceOrder = async (req, res) => {
  try {
    const { serviceOrderId } = req.params;

    // Verificar se a ServiceOrder existe
    const serviceOrder = await ServiceOrder.findOne({ id: serviceOrderId });
    if (!serviceOrder) {
      return res.status(404).json({
        success: false,
        message: 'ServiceOrder não encontrada'
      });
    }

    // Buscar todas as CutPieces associadas à ServiceOrder
    const cutPieces = await CutPiece.find({ serviceOrderId: serviceOrder._id })
      .populate('originalStockItemId', 'id description')
      .populate('materialId', 'name type')
      .sort({ createdAt: 1 });

    // Registrar no ActivityLog
    await ActivityLog.create({
      action: 'cut_pieces_listed',
      description: `Listagem de peças cortadas para ServiceOrder ${serviceOrderId}`,
      relatedEntityType: 'service_order',
      relatedEntityId: serviceOrder._id,
      metadata: {
        serviceOrderId,
        cutPiecesCount: cutPieces.length
      },
      user: buildUserSnapshot(req.user)
    });

    return res.json({
      success: true,
      message: `${cutPieces.length} peças cortadas encontradas`,
      data: {
        serviceOrderId,
        serviceOrder: {
          id: serviceOrder.id,
          clientName: serviceOrder.clientName,
          status: serviceOrder.status
        },
        cutPieces: cutPieces.map(cutPiece => ({
          id: cutPiece._id,
          pieceId: cutPiece.pieceId,
          description: cutPiece.description,
          category: cutPiece.category,
          dimensions: cutPiece.dimensions,
          status: cutPiece.status,
          location: cutPiece.location,
          qrCodeValue: cutPiece.qrCodeValue,
          originalStockItemId: cutPiece.originalStockItemId,
          materialId: cutPiece.materialId,
          createdAt: cutPiece.createdAt,
          updatedAt: cutPiece.updatedAt
        }))
      }
    });

  } catch (error) {
    console.error('Erro ao buscar CutPieces por ServiceOrder:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro interno ao buscar peças cortadas',
      error: error.message
    });
  }
};

// Buscar uma CutPiece pelo pieceId
exports.getCutPieceById = async (req, res) => {
  try {
    const { pieceId } = req.params;

    // Buscar CutPiece pelo pieceId
    const cutPiece = await CutPiece.findOne({ pieceId })
      .populate('serviceOrderId', 'id clientName status')
      .populate('originalStockItemId', 'id description')
      .populate('materialId', 'name type');

    if (!cutPiece) {
      return res.status(404).json({
        success: false,
        message: 'Peça cortada não encontrada'
      });
    }

    // Registrar no ActivityLog
    await ActivityLog.create({
      action: 'cut_piece_viewed',
      description: `Visualização da peça cortada ${pieceId}`,
      relatedEntityType: 'cut_piece',
      relatedEntityId: cutPiece._id,
      metadata: {
        pieceId,
        serviceOrderId: cutPiece.serviceOrderId?.id,
        status: cutPiece.status
      },
      user: buildUserSnapshot(req.user)
    });

    return res.json({
      success: true,
      message: 'Peça cortada encontrada',
      data: {
        id: cutPiece._id,
        pieceId: cutPiece.pieceId,
        serviceOrder: {
          id: cutPiece.serviceOrderId?.id,
          clientName: cutPiece.serviceOrderId?.clientName,
          status: cutPiece.serviceOrderId?.status
        },
        originalQuoteItemId: cutPiece.originalQuoteItemId,
        originalStockItemId: cutPiece.originalStockItemId,
        materialId: cutPiece.materialId,
        description: cutPiece.description,
        category: cutPiece.category,
        dimensions: cutPiece.dimensions,
        status: cutPiece.status,
        location: cutPiece.location,
        qrCodeValue: cutPiece.qrCodeValue,
        createdAt: cutPiece.createdAt,
        updatedAt: cutPiece.updatedAt
      }
    });

  } catch (error) {
    console.error('Erro ao buscar CutPiece por ID:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro interno ao buscar peça cortada',
      error: error.message
    });
  }
};

// Atualizar status de uma CutPiece
exports.updateCutPieceStatus = async (req, res) => {
  try {
    const { pieceId } = req.params;
    const { status, reason } = req.body;

    // Validar status
    const allowedStatuses = ['pending_cut', 'cut', 'finishing', 'assembly', 'ready_for_delivery', 'delivered', 'installed'];
    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Status inválido para peça cortada',
        allowedStatuses
      });
    }

    // Buscar CutPiece
    const cutPiece = await CutPiece.findOne({ pieceId })
      .populate('serviceOrderId', 'id clientName');

    if (!cutPiece) {
      return res.status(404).json({
        success: false,
        message: 'Peça cortada não encontrada'
      });
    }

    const previousStatus = cutPiece.status;

    if (previousStatus === status) {
      return res.status(400).json({
        success: false,
        message: 'O status informado é igual ao status atual da peça'
      });
    }

    // Atualizar status
    cutPiece.status = status;
    await cutPiece.save();

    // Registrar no ActivityLog
    await ActivityLog.create({
      action: 'cut_piece_status_updated',
      description: `Status da peça ${pieceId} alterado de '${previousStatus}' para '${status}'`,
      relatedEntityType: 'cut_piece',
      relatedEntityId: cutPiece._id,
      previousStatus,
      newStatus: status,
      metadata: {
        pieceId,
        serviceOrderId: cutPiece.serviceOrderId?.id,
        reason: reason || undefined
      },
      user: buildUserSnapshot(req.user)
    });

    return res.json({
      success: true,
      message: 'Status da peça cortada atualizado com sucesso',
      data: {
        pieceId: cutPiece.pieceId,
        description: cutPiece.description,
        previousStatus,
        newStatus: status,
        serviceOrderId: cutPiece.serviceOrderId?.id,
        clientName: cutPiece.serviceOrderId?.clientName
      }
    });

  } catch (error) {
    console.error('Erro ao atualizar status da CutPiece:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro interno ao atualizar status da peça cortada',
      error: error.message
    });
  }
};

// Atualizar localização de uma CutPiece
exports.updateCutPieceLocation = async (req, res) => {
  try {
    const { pieceId } = req.params;
    const { location } = req.body;

    if (!location || typeof location !== 'string' || !location.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Localização é obrigatória'
      });
    }

    // Buscar CutPiece
    const cutPiece = await CutPiece.findOne({ pieceId })
      .populate('serviceOrderId', 'id clientName');

    if (!cutPiece) {
      return res.status(404).json({
        success: false,
        message: 'Peça cortada não encontrada'
      });
    }

    const previousLocation = cutPiece.location || '';
    const trimmedLocation = location.trim();

    if (previousLocation === trimmedLocation) {
      return res.status(400).json({
        success: false,
        message: 'A localização informada é igual à localização atual da peça'
      });
    }

    // Atualizar localização
    cutPiece.location = trimmedLocation;
    await cutPiece.save();

    // Registrar no ActivityLog
    await ActivityLog.create({
      action: 'cut_piece_location_updated',
      description: `Localização da peça ${pieceId} alterada de '${previousLocation || 'indefinido'}' para '${trimmedLocation}'`,
      relatedEntityType: 'cut_piece',
      relatedEntityId: cutPiece._id,
      previousLocation,
      newLocation: trimmedLocation,
      metadata: {
        pieceId,
        serviceOrderId: cutPiece.serviceOrderId?.id
      },
      user: buildUserSnapshot(req.user)
    });

    return res.json({
      success: true,
      message: 'Localização da peça cortada atualizada com sucesso',
      data: {
        pieceId: cutPiece.pieceId,
        description: cutPiece.description,
        previousLocation,
        newLocation: trimmedLocation,
        serviceOrderId: cutPiece.serviceOrderId?.id,
        clientName: cutPiece.serviceOrderId?.clientName
      }
    });

  } catch (error) {
    console.error('Erro ao atualizar localização da CutPiece:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro interno ao atualizar localização da peça cortada',
      error: error.message
    });
  }
};

