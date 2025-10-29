const CutPiece = require('../models/CutPiece');
const ServiceOrder = require('../models/ServiceOrder');

/**
 * Cria registros CutPiece para uma ServiceOrder quando ela entra na fase de corte
 * @param {string} serviceOrderId - ID da ServiceOrder
 * @param {string} allocatedSlabId - ID da chapa alocada (originalStockItemId)
 * @returns {Promise<Array>} Array de CutPieces criadas
 */
const createCutPiecesForServiceOrder = async (serviceOrderId, allocatedSlabId) => {
  try {
    // Buscar a ServiceOrder
    const serviceOrder = await ServiceOrder.findOne({ id: serviceOrderId });
    if (!serviceOrder) {
      throw new Error(`ServiceOrder com ID ${serviceOrderId} não encontrada`);
    }

    // Verificar se já existem CutPieces para esta ServiceOrder
    const existingCutPieces = await CutPiece.find({ serviceOrderId: serviceOrder._id });
    if (existingCutPieces.length > 0) {
      console.log(`⚠️ CutPieces já existem para ServiceOrder ${serviceOrderId}. Pulando criação.`);
      return existingCutPieces;
    }

    // Filtrar apenas itens de material
    const materialItems = serviceOrder.items.filter(item => item.type === 'material');
    
    if (materialItems.length === 0) {
      console.log(`ℹ️ ServiceOrder ${serviceOrderId} não possui itens de material. Nenhuma CutPiece será criada.`);
      return [];
    }

    const cutPieces = [];
    const cutPieceIds = [];

    // Criar uma CutPiece para cada item de material
    for (let i = 0; i < materialItems.length; i++) {
      const item = materialItems[i];
      
      // Gerar ID único e legível para a peça
      const pieceId = `${serviceOrderId}-${item.id || `ITEM-${i + 1}`}-P${i + 1}`;
      
      // Gerar valor do QR code
      const qrCodeValue = `marmoraria://asset/cut_piece/${pieceId}`;
      
      // Formatar dimensões
      let dimensions = '';
      if (item.width && item.height) {
        dimensions = `${item.width.toFixed(2)} x ${item.height.toFixed(2)} m`;
      } else if (item.shapePoints && item.shapePoints.length > 0) {
        // Para peças com formato customizado, usar informações dos shapePoints
        dimensions = 'Formato customizado';
      }

      // Criar CutPiece
      const cutPieceData = {
        pieceId,
        serviceOrderId: serviceOrder._id,
        originalQuoteItemId: item.id || `ITEM-${i + 1}`,
        originalStockItemId: allocatedSlabId,
        materialId: item.materialId,
        description: item.description || 'Peça sem descrição',
        category: item.category || undefined,
        dimensions: dimensions || undefined,
        status: 'pending_cut',
        qrCodeValue
      };

      const cutPiece = await CutPiece.create(cutPieceData);
      cutPieces.push(cutPiece);
      cutPieceIds.push(cutPiece._id);
      
      console.log(`✅ CutPiece criada: ${pieceId} para item ${item.description}`);
    }

    // Atualizar ServiceOrder com os IDs das CutPieces
    await ServiceOrder.findByIdAndUpdate(serviceOrder._id, {
      $push: { cutPieceIds: { $each: cutPieceIds } }
    });

    console.log(`🎉 ${cutPieces.length} CutPieces criadas para ServiceOrder ${serviceOrderId}`);
    return cutPieces;

  } catch (error) {
    console.error(`❌ Erro ao criar CutPieces para ServiceOrder ${serviceOrderId}:`, error);
    throw error;
  }
};

/**
 * Verifica se uma ServiceOrder deve ter CutPieces criadas
 * @param {Object} serviceOrder - ServiceOrder object
 * @param {string} newStatus - Novo status da ServiceOrder
 * @returns {boolean} True se CutPieces devem ser criadas
 */
const shouldCreateCutPieces = (serviceOrder, newStatus) => {
  // Criar CutPieces quando:
  // 1. Status muda para 'cutting' E allocatedSlabId está definido
  // 2. ServiceOrder é criada com status 'cutting' E allocatedSlabId está definido
  return Boolean(
    (newStatus === 'cutting' || serviceOrder.status === 'cutting') &&
    serviceOrder.allocatedSlabId &&
    serviceOrder.allocatedSlabId.trim() !== ''
  );
};

module.exports = {
  createCutPiecesForServiceOrder,
  shouldCreateCutPieces
};
