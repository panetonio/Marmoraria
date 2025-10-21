const ChecklistTemplate = require('../models/ChecklistTemplate');

const mapTemplate = (template) => ({
  ...template.toObject(),
  id: template._id,
});

exports.getAllTemplates = async (req, res) => {
  try {
    const templates = await ChecklistTemplate.find().sort({ createdAt: -1 });
    return res.json({
      success: true,
      count: templates.length,
      data: templates.map(mapTemplate),
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Erro ao listar modelos de checklist',
      error: error.message,
    });
  }
};

exports.getTemplateById = async (req, res) => {
  try {
    const template = await ChecklistTemplate.findById(req.params.id);

    if (!template) {
      return res.status(404).json({
        success: false,
        message: 'Modelo de checklist não encontrado',
      });
    }

    return res.json({
      success: true,
      data: mapTemplate(template),
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Erro ao buscar modelo de checklist',
      error: error.message,
    });
  }
};

exports.createTemplate = async (req, res) => {
  try {
    const template = await ChecklistTemplate.create(req.body);
    return res.status(201).json({
      success: true,
      message: 'Modelo de checklist criado com sucesso',
      data: mapTemplate(template),
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Erro ao criar modelo de checklist',
      error: error.message,
    });
  }
};

exports.updateTemplate = async (req, res) => {
  try {
    const template = await ChecklistTemplate.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true },
    );

    if (!template) {
      return res.status(404).json({
        success: false,
        message: 'Modelo de checklist não encontrado',
      });
    }

    return res.json({
      success: true,
      message: 'Modelo de checklist atualizado com sucesso',
      data: mapTemplate(template),
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Erro ao atualizar modelo de checklist',
      error: error.message,
    });
  }
};

exports.deleteTemplate = async (req, res) => {
  try {
    const template = await ChecklistTemplate.findByIdAndDelete(req.params.id);

    if (!template) {
      return res.status(404).json({
        success: false,
        message: 'Modelo de checklist não encontrado',
      });
    }

    return res.json({
      success: true,
      message: 'Modelo de checklist removido com sucesso',
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Erro ao remover modelo de checklist',
      error: error.message,
    });
  }
};
