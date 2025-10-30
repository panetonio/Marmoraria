const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const Invoice = require('../models/Invoice');
const Order = require('../models/Order');
const Client = require('../models/Client');

exports.getAllInvoices = async (req, res) => {
  try {
    const invoices = await Invoice.find({}).sort({ createdAt: -1 });
    return res.json({ success: true, count: invoices.length, data: invoices });
  } catch (error) {
    console.error('Erro ao listar NFs:', error);
    return res.status(500).json({ success: false, message: 'Erro ao listar notas fiscais' });
  }
};

exports.getInvoiceById = async (req, res) => {
  try {
    const { id } = req.params;
    const invoice = await Invoice.findById(id);
    if (!invoice) {
      return res.status(404).json({ success: false, message: 'Nota fiscal não encontrada' });
    }
    return res.json({ success: true, data: invoice });
  } catch (error) {
    console.error('Erro ao buscar NF:', error);
    return res.status(500).json({ success: false, message: 'Erro ao buscar nota fiscal' });
  }
};

exports.createInvoiceFromOrder = async (req, res) => {
  try {
    const { orderId } = req.body || {};
    if (!orderId || !mongoose.Types.ObjectId.isValid(orderId)) {
      return res.status(400).json({ success: false, message: 'orderId inválido' });
    }

    // Verificar se já existe NF para este pedido
    const existing = await Invoice.findOne({ orderId });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Já existe uma NF para este pedido', data: existing });
    }

    // Buscar pedido
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Pedido não encontrado' });
    }

    // Tentar localizar cliente – não há clientId no Order, então usar nome como fallback
    let client = null;
    try {
      client = await Client.findOne({ name: order.clientName });
    } catch (_) {}

    const invoice = new Invoice({
      orderId: order._id,
      clientId: client?._id,
      clientName: order.clientName,
      buyerDocument: client?.cpfCnpj || '',
      buyerAddress: order.deliveryAddress,
      items: order.items,
      total: order.total,
      status: 'pending',
    });

    await invoice.save();

    return res.status(201).json({ success: true, message: 'NF criada a partir do pedido', data: invoice });
  } catch (error) {
    console.error('Erro ao criar NF a partir do pedido:', error);
    return res.status(500).json({ success: false, message: 'Erro ao criar NF a partir do pedido' });
  }
};

// Simular emissão de NF-e
exports.simulateIssueNFe = async (req, res) => {
  try {
    const { id } = req.params;
    const invoice = await Invoice.findById(id);
    if (!invoice) {
      return res.status(404).json({ success: false, message: 'Nota fiscal não encontrada' });
    }

    if (invoice.status !== 'pending') {
      return res.status(400).json({ success: false, message: 'A NF-e não está pendente para emissão' });
    }

    // Gerar chave simulada e conteúdo fake
    const fakeKey = `NFE_SIMULADA_55_${Date.now()}`;
    const fakePdfContent = `PDF simulado para NFE ${fakeKey}\nPedido: ${invoice.orderId}\nCliente: ${invoice.clientName}`;

    // Garantir diretório e salvar arquivo fake
    const outDir = path.join(__dirname, '..', 'public', 'nfe_simulada');
    await fs.promises.mkdir(outDir, { recursive: true });
    const pdfPath = path.join(outDir, `${fakeKey}.pdf`);
    await fs.promises.writeFile(pdfPath, fakePdfContent, 'utf8');

    // Atualizar invoice
    invoice.status = 'issued';
    invoice.issueDate = new Date();
    invoice.nfeKey = fakeKey;
    invoice.nfePdfUrl = `/nfe_simulada/${fakeKey}.pdf`;

    await invoice.save();

    return res.json({ success: true, message: 'NF-e simulada emitida com sucesso', data: invoice });
  } catch (error) {
    console.error('Erro ao simular emissão de NF-e:', error);
    return res.status(500).json({ success: false, message: 'Erro ao simular emissão de NF-e' });
  }
};


