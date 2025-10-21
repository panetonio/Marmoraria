const mongoose = require('mongoose');
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

const ensureChecklistItemId = (item) => ({
  id: typeof item.id === 'string' && item.id.trim().length > 0
    ? item.id
    : new mongoose.Types.ObjectId().toString(),
  text: item.text,
  checked: Boolean(item.checked),
});

exports.updateDepartureChecklist = async (req, res) => {
  try {
    const { id } = req.params;
    const { checklist } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'ID inválido para ordem de serviço',
      });
    }

    const serviceOrder = await ServiceOrder.findById(id);

    if (!serviceOrder) {
      return res.status(404).json({
        success: false,
        message: 'Ordem de serviço não encontrada',
      });
    }

    const previousChecklist = Array.isArray(serviceOrder.departureChecklist)
      ? serviceOrder.departureChecklist.map(item => ({ ...item }))
      : [];

    const normalizedChecklist = Array.isArray(checklist)
      ? checklist.map(ensureChecklistItemId)
      : [];

    serviceOrder.departureChecklist = normalizedChecklist;
    await serviceOrder.save();

    const previousCheckedMap = new Map(previousChecklist.map(item => [item.id, Boolean(item.checked)]));
    const newlyCompleted = normalizedChecklist.filter(item => item.checked && !previousCheckedMap.get(item.id));
    const totalCompleted = normalizedChecklist.filter(item => item.checked).length;

    const descriptionParts = [
      `Checklist atualizado (${totalCompleted}/${normalizedChecklist.length} itens concluídos)`,
    ];

    if (newlyCompleted.length > 0) {
      descriptionParts.push(`Itens concluídos: ${newlyCompleted.map(item => item.text).join(', ')}`);
    }

    await ActivityLog.create({
      serviceOrder: serviceOrder._id,
      action: newlyCompleted.length > 0
        ? 'service_order_checklist_item_checked'
        : 'service_order_checklist_update',
      description: descriptionParts.join(' | '),
      user: buildUserSnapshot(req.user),
      metadata: {
        totalItems: normalizedChecklist.length,
        totalCompleted,
        newlyCompleted: newlyCompleted.map(item => ({ id: item.id, text: item.text })),
      },
    });

    return res.json({
      success: true,
      message: 'Checklist atualizado com sucesso',
      data: serviceOrder,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Erro ao atualizar checklist da ordem de serviço',
      error: error.message,
    });
  }
};
