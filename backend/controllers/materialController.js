const Material = require('../models/Material');

exports.getAll = async (req, res) => {
  try {
    const materials = await Material.find({}).lean();
    return res.json({ success: true, count: materials.length, data: materials });
  } catch (error) {
    console.error('Erro ao listar materiais:', error);
    return res.status(500).json({ success: false, message: 'Erro interno ao listar materiais', error: error.message });
  }
};

exports.create = async (req, res) => {
  try {
    const created = await Material.create(req.body);
    return res.status(201).json({ success: true, message: 'Material criado com sucesso', data: created });
  } catch (error) {
    console.error('Erro ao criar material:', error);
    return res.status(500).json({ success: false, message: 'Erro interno ao criar material', error: error.message });
  }
};

exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    const updated = await Material.findByIdAndUpdate(id, { $set: req.body }, { new: true });
    if (!updated) return res.status(404).json({ success: false, message: 'Material não encontrado' });
    return res.json({ success: true, message: 'Material atualizado com sucesso', data: updated });
  } catch (error) {
    console.error('Erro ao atualizar material:', error);
    return res.status(500).json({ success: false, message: 'Erro interno ao atualizar material', error: error.message });
  }
};

exports.remove = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Material.findByIdAndDelete(id);
    if (!deleted) return res.status(404).json({ success: false, message: 'Material não encontrado' });
    return res.json({ success: true, message: 'Material removido com sucesso' });
  } catch (error) {
    console.error('Erro ao remover material:', error);
    return res.status(500).json({ success: false, message: 'Erro interno ao remover material', error: error.message });
  }
};


