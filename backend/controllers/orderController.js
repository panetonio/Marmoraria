const Order = require('../models/Order');
const Quote = require('../models/Quote');

exports.getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find()
      .populate('salespersonId', 'name email')
      .populate('originalQuoteId')
      .sort({ createdAt: -1 });
    res.json({ success: true, count: orders.length, data: orders });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erro ao buscar pedidos', error: error.message });
  }
};

exports.getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('salespersonId', 'name email')
      .populate('originalQuoteId')
      .populate({ 
        path: 'addendums', 
        match: { status: 'approved' },
        populate: {
          path: 'createdBy',
          select: 'name email'
        }
      });
    if (!order) {
      return res.status(404).json({ success: false, message: 'Pedido não encontrado' });
    }
    res.json({ success: true, data: order });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erro ao buscar pedido', error: error.message });
  }
};

exports.createOrder = async (req, res) => {
  try {
    const order = await Order.create(req.body);
    res.status(201).json({ success: true, message: 'Pedido criado com sucesso', data: order });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erro ao criar pedido', error: error.message });
  }
};

exports.updateOrder = async (req, res) => {
  try {
    const order = await Order.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!order) {
      return res.status(404).json({ success: false, message: 'Pedido não encontrado' });
    }
    res.json({ success: true, message: 'Pedido atualizado com sucesso', data: order });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erro ao atualizar pedido', error: error.message });
  }
};

exports.deleteOrder = async (req, res) => {
  try {
    const order = await Order.findByIdAndDelete(req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Pedido não encontrado' });
    }
    res.json({ success: true, message: 'Pedido deletado com sucesso' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erro ao deletar pedido', error: error.message });
  }
};

// Função auxiliar para criar pedido a partir de orçamento
exports.createOrderFromQuote = async (quoteId) => {
  try {
    const quote = await Quote.findById(quoteId);
    if (!quote) {
      throw new Error('Orçamento não encontrado');
    }

    // Verificar se já existe um pedido para este orçamento
    const existingOrder = await Order.findOne({ originalQuoteId: quote._id });
    if (existingOrder) {
      console.log(`⚠️ Pedido já existe para o orçamento ${quote._id}: ${existingOrder._id}`);
      return existingOrder; // Retorna o pedido existente ao invés de criar duplicado
    }

    const orderData = {
      originalQuoteId: quote._id,
      clientName: quote.clientName,
      deliveryAddress: quote.deliveryAddress,
      items: quote.items,
      subtotal: quote.subtotal,
      discount: quote.discount,
      freight: quote.freight,
      paymentMethod: quote.paymentMethod,
      installments: quote.installments,
      total: quote.total,
      salespersonId: quote.salespersonId,
      approvalDate: new Date(),
    };

    const order = await Order.create(orderData);
    console.log(`✅ Pedido criado no banco de dados: ${order._id} para orçamento ${quote._id}`);
    return order;
  } catch (error) {
    console.error('❌ Erro ao criar pedido a partir do orçamento:', error);
    throw error;
  }
};

