const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const Contract = require('../models/Contract');
const Order = require('../models/Order');
const Client = require('../models/Client');

// Util: gerar número de documento simples (ex.: CTR-2025-001)
async function generateSequentialDocumentNumber() {
  const year = new Date().getFullYear();
  const prefix = `CTR-${year}-`;
  const count = await Contract.countDocuments({ documentNumber: new RegExp(`^${prefix}`) });
  const seq = String(count + 1).padStart(3, '0');
  return `${prefix}${seq}`;
}

exports.createContractFromOrder = async (req, res) => {
  try {
    const { orderId } = req.body || {};
    if (!orderId || !mongoose.Types.ObjectId.isValid(orderId)) {
      return res.status(400).json({ success: false, message: 'orderId inválido' });
    }

    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ success: false, message: 'Pedido não encontrado' });

    // Tentar localizar cliente por nome (modelo Order não possui clientId)
    const client = await Client.findOne({ name: order.clientName });

    const documentNumber = await generateSequentialDocumentNumber();

    const contentTemplate = (
      'CONTRATO DE PRESTAÇÃO DE SERVIÇOS\n\n' +
      'Pelo presente instrumento particular, as partes acordam nos termos e condições a seguir. ' +
      'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Praesent vehicula, leo in molestie gravida, ' +
      'erat sapien facilisis velit, sed bibendum urna sem a orci. Integer facilisis, augue id mollis auctor, ' +
      'felis libero faucibus lorem, eget fermentum mauris arcu at lorem. Vivamus euismod, dui ut aliquam ' +
      'convallis, lectus justo posuere mauris, a posuere ex purus a magna.\n\n' +
      'Cláusula 1ª - Do Objeto...\nCláusula 2ª - Do Preço e Condições de Pagamento...\n' +
      'Cláusula 3ª - Dos Prazos...\nCláusula 4ª - Das Obrigações...\n' +
      'Cláusula 5ª - Das Disposições Gerais...'
    );

    const variables = {
      clientName: order.clientName,
      orderTotal: order.total,
      deliveryAddress: order.deliveryAddress,
      orderId: order._id,
      quoteId: order.originalQuoteId,
      clientCpfCnpj: client?.cpfCnpj || '',
    };

    const contract = new Contract({
      orderId: order._id,
      quoteId: order.originalQuoteId,
      clientId: client?._id,
      documentNumber,
      status: 'draft',
      contentTemplate,
      variables,
      createdBy: req.user?._id || null,
    });

    await contract.save();
    return res.status(201).json({ success: true, message: 'Contrato criado com sucesso', data: contract });
  } catch (error) {
    console.error('Erro ao criar contrato:', error);
    return res.status(500).json({ success: false, message: 'Erro ao criar contrato' });
  }
};

exports.getContractById = async (req, res) => {
  try {
    const { id } = req.params;
    const contract = await Contract.findById(id);
    if (!contract) return res.status(404).json({ success: false, message: 'Contrato não encontrado' });
    return res.json({ success: true, data: contract });
  } catch (error) {
    console.error('Erro ao buscar contrato:', error);
    return res.status(500).json({ success: false, message: 'Erro ao buscar contrato' });
  }
};

exports.getContractsForOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    if (!orderId || !mongoose.Types.ObjectId.isValid(orderId)) {
      return res.status(400).json({ success: false, message: 'orderId inválido' });
    }
    const contracts = await Contract.find({ orderId }).sort({ createdAt: -1 });
    return res.json({ success: true, count: contracts.length, data: contracts });
  } catch (error) {
    console.error('Erro ao listar contratos do pedido:', error);
    return res.status(500).json({ success: false, message: 'Erro ao listar contratos' });
  }
};

exports.signContract = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, documentNumber, signatureDataUrl } = req.body || {};
    const contract = await Contract.findById(id);
    if (!contract) return res.status(404).json({ success: false, message: 'Contrato não encontrado' });

    if (!signatureDataUrl || typeof signatureDataUrl !== 'string' || !signatureDataUrl.startsWith('data:')) {
      return res.status(400).json({ success: false, message: 'Assinatura inválida' });
    }

    // Salvar assinatura localmente (simulando upload service)
    const outDir = path.join(__dirname, '..', 'public', 'uploads', 'signatures');
    await fs.promises.mkdir(outDir, { recursive: true });

    const base64 = signatureDataUrl.split(',')[1];
    const buffer = Buffer.from(base64, 'base64');
    const fileName = `signature_${id}_${Date.now()}.png`;
    const filePath = path.join(outDir, fileName);
    await fs.promises.writeFile(filePath, buffer);

    contract.signatoryInfo = { name, documentNumber };
    contract.digitalSignatureUrl = `/uploads/signatures/${fileName}`;
    contract.signedAt = new Date();
    contract.status = 'signed';
    await contract.save();

    return res.json({ success: true, message: 'Contrato assinado com sucesso', data: contract });
  } catch (error) {
    console.error('Erro ao assinar contrato:', error);
    return res.status(500).json({ success: false, message: 'Erro ao assinar contrato' });
  }
};


