const Quote = require('../models/Quote');
const { createOrderFromQuote } = require('./orderController');

exports.getAllQuotes = async (req, res) => {
  try {
    const quotes = await Quote.find()
      .populate('salespersonId', 'name email')
      .sort({ createdAt: -1 });
    res.json({ success: true, count: quotes.length, data: quotes });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erro ao buscar orçamentos', error: error.message });
  }
};

exports.getQuoteById = async (req, res) => {
  try {
    const quote = await Quote.findById(req.params.id).populate('salespersonId', 'name email');
    if (!quote) {
      return res.status(404).json({ success: false, message: 'Orçamento não encontrado' });
    }
    res.json({ success: true, data: quote });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erro ao buscar orçamento', error: error.message });
  }
};

exports.createQuote = async (req, res) => {
  try {
    const quote = await Quote.create(req.body);
    console.log(`📝 Orçamento criado: ${quote._id} | Status: ${quote.status}`);
    
    // Se o orçamento já foi criado como aprovado, cria automaticamente um pedido
    if (quote.status === 'approved') {
      console.log(`✨ Orçamento aprovado! Criando pedido automaticamente...`);
      try {
        const order = await createOrderFromQuote(quote._id);
        console.log(`🎉 Sucesso! Pedido criado: ${order._id}`);
        return res.status(201).json({ 
          success: true, 
          message: 'Orçamento criado e aprovado - pedido gerado com sucesso', 
          data: quote,
          order: order 
        });
      } catch (orderError) {
        console.error(`❌ Erro ao criar pedido:`, orderError);
        // Se falhar ao criar o pedido, ainda retorna o orçamento criado mas com aviso
        return res.status(201).json({ 
          success: true, 
          message: 'Orçamento criado, mas houve erro ao criar o pedido', 
          data: quote,
          warning: orderError.message 
        });
      }
    }
    
    res.status(201).json({ success: true, message: 'Orçamento criado com sucesso', data: quote });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erro ao criar orçamento', error: error.message });
  }
};

exports.updateQuote = async (req, res) => {
  try {
    const oldQuote = await Quote.findById(req.params.id);
    const quote = await Quote.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!quote) {
      return res.status(404).json({ success: false, message: 'Orçamento não encontrado' });
    }

    console.log(`📝 Orçamento atualizado: ${quote._id} | Status anterior: ${oldQuote.status} → Novo: ${req.body.status}`);

    // Se o status mudou para 'approved', cria automaticamente um pedido
    if (req.body.status === 'approved' && oldQuote.status !== 'approved') {
      console.log(`✨ Status mudou para aprovado! Criando pedido automaticamente...`);
      try {
        const order = await createOrderFromQuote(quote._id);
        console.log(`🎉 Sucesso! Pedido criado: ${order._id}`);
        return res.json({ 
          success: true, 
          message: 'Orçamento aprovado e pedido criado com sucesso', 
          data: quote,
          order: order 
        });
      } catch (orderError) {
        console.error(`❌ Erro ao criar pedido:`, orderError);
        // Se falhar ao criar o pedido, ainda retorna o orçamento atualizado mas com aviso
        return res.json({ 
          success: true, 
          message: 'Orçamento atualizado, mas houve erro ao criar o pedido', 
          data: quote,
          warning: orderError.message 
        });
      }
    }

    res.json({ success: true, message: 'Orçamento atualizado com sucesso', data: quote });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erro ao atualizar orçamento', error: error.message });
  }
};

exports.deleteQuote = async (req, res) => {
  try {
    const quote = await Quote.findByIdAndDelete(req.params.id);
    if (!quote) {
      return res.status(404).json({ success: false, message: 'Orçamento não encontrado' });
    }
    res.json({ success: true, message: 'Orçamento deletado com sucesso' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erro ao deletar orçamento', error: error.message });
  }
};

