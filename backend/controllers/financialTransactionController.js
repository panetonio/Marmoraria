const FinancialTransaction = require('../models/FinancialTransaction');

// Controller para upload de anexos financeiros

exports.uploadAttachment = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Nenhum arquivo enviado. Campo esperado: attachment' });
    }

    // Retorna a URL pública do arquivo salvo
    return res.json({
      success: true,
      url: `/uploads/finance/${req.file.filename}`,
      name: req.file.originalname,
    });
  } catch (error) {
    console.error('Erro no upload de anexo financeiro:', error);
    return res.status(500).json({ success: false, message: 'Erro ao fazer upload do anexo' });
  }
};

// Criar transação financeira
exports.createTransaction = async (req, res) => {
  try {
    const {
      description,
      amount,
      type,
      status,
      dueDate,
      paymentDate,
      relatedOrderId,
      relatedClientId,
      paymentMethod,
      attachmentUrl,
      attachmentName,
    } = req.body || {};

    const doc = new FinancialTransaction({
      description,
      amount,
      type,
      status,
      dueDate,
      paymentDate,
      relatedOrderId,
      relatedClientId,
      paymentMethod,
      attachmentUrl,
      attachmentName,
    });

    await doc.save();
    return res.status(201).json({ success: true, message: 'Transação criada', data: doc });
  } catch (error) {
    console.error('Erro ao criar transação financeira:', error);
    return res.status(500).json({ success: false, message: 'Erro ao criar transação' });
  }
};

// Atualizar transação financeira
exports.updateTransaction = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      description,
      amount,
      type,
      status,
      dueDate,
      paymentDate,
      relatedOrderId,
      relatedClientId,
      paymentMethod,
      attachmentUrl,
      attachmentName,
    } = req.body || {};

    const update = {
      description,
      amount,
      type,
      status,
      dueDate,
      paymentDate,
      relatedOrderId,
      relatedClientId,
      paymentMethod,
      attachmentUrl,
      attachmentName,
    };

    const doc = await FinancialTransaction.findByIdAndUpdate(id, update, { new: true });
    if (!doc) {
      return res.status(404).json({ success: false, message: 'Transação não encontrada' });
    }
    return res.json({ success: true, message: 'Transação atualizada', data: doc });
  } catch (error) {
    console.error('Erro ao atualizar transação financeira:', error);
    return res.status(500).json({ success: false, message: 'Erro ao atualizar transação' });
  }
};


