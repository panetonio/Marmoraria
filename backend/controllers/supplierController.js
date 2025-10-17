const Supplier = require('../models/Supplier');

exports.getAllSuppliers = async (req, res) => {
  try {
    const suppliers = await Supplier.find().sort({ createdAt: -1 });
    res.json({ success: true, count: suppliers.length, data: suppliers });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erro ao buscar fornecedores', error: error.message });
  }
};

exports.getSupplierById = async (req, res) => {
  try {
    const supplier = await Supplier.findById(req.params.id);
    if (!supplier) {
      return res.status(404).json({ success: false, message: 'Fornecedor não encontrado' });
    }
    res.json({ success: true, data: supplier });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erro ao buscar fornecedor', error: error.message });
  }
};

exports.createSupplier = async (req, res) => {
  try {
    const supplier = await Supplier.create(req.body);
    res.status(201).json({ success: true, message: 'Fornecedor criado com sucesso', data: supplier });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erro ao criar fornecedor', error: error.message });
  }
};

exports.updateSupplier = async (req, res) => {
  try {
    const supplier = await Supplier.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!supplier) {
      return res.status(404).json({ success: false, message: 'Fornecedor não encontrado' });
    }
    res.json({ success: true, message: 'Fornecedor atualizado com sucesso', data: supplier });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erro ao atualizar fornecedor', error: error.message });
  }
};

exports.deleteSupplier = async (req, res) => {
  try {
    const supplier = await Supplier.findByIdAndDelete(req.params.id);
    if (!supplier) {
      return res.status(404).json({ success: false, message: 'Fornecedor não encontrado' });
    }
    res.json({ success: true, message: 'Fornecedor deletado com sucesso' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erro ao deletar fornecedor', error: error.message });
  }
};

