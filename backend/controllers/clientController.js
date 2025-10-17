const Client = require('../models/Client');
const Note = require('../models/Note');

exports.getAllClients = async (req, res) => {
  try {
    const clients = await Client.find().sort({ createdAt: -1 });
    res.json({ success: true, count: clients.length, data: clients });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erro ao buscar clientes', error: error.message });
  }
};

exports.getClientById = async (req, res) => {
  try {
    const client = await Client.findById(req.params.id);
    if (!client) {
      return res.status(404).json({ success: false, message: 'Cliente não encontrado' });
    }
    res.json({ success: true, data: client });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erro ao buscar cliente', error: error.message });
  }
};

exports.createClient = async (req, res) => {
  try {
    const client = await Client.create(req.body);
    res.status(201).json({ success: true, message: 'Cliente criado com sucesso', data: client });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erro ao criar cliente', error: error.message });
  }
};

exports.updateClient = async (req, res) => {
  try {
    const client = await Client.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!client) {
      return res.status(404).json({ success: false, message: 'Cliente não encontrado' });
    }
    res.json({ success: true, message: 'Cliente atualizado com sucesso', data: client });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erro ao atualizar cliente', error: error.message });
  }
};

exports.deleteClient = async (req, res) => {
  try {
    const client = await Client.findByIdAndDelete(req.params.id);
    if (!client) {
      return res.status(404).json({ success: false, message: 'Cliente não encontrado' });
    }
    res.json({ success: true, message: 'Cliente deletado com sucesso' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erro ao deletar cliente', error: error.message });
  }
};

// Funções de anotações
exports.getClientNotes = async (req, res) => {
  try {
    const notes = await Note.find({ clientId: req.params.id })
      .populate('userId', 'name email')
      .sort({ createdAt: -1 });
    res.json({ success: true, count: notes.length, data: notes });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erro ao buscar anotações', error: error.message });
  }
};

exports.createClientNote = async (req, res) => {
  try {
    const { content } = req.body;
    const note = await Note.create({
      clientId: req.params.id,
      userId: req.user._id,
      content,
    });
    const populatedNote = await Note.findById(note._id).populate('userId', 'name email');
    res.status(201).json({ success: true, message: 'Anotação criada com sucesso', data: populatedNote });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erro ao criar anotação', error: error.message });
  }
};

exports.updateClientNote = async (req, res) => {
  try {
    const note = await Note.findOneAndUpdate(
      { _id: req.params.noteId, clientId: req.params.id },
      { content: req.body.content },
      { new: true, runValidators: true }
    ).populate('userId', 'name email');
    if (!note) {
      return res.status(404).json({ success: false, message: 'Anotação não encontrada' });
    }
    res.json({ success: true, message: 'Anotação atualizada com sucesso', data: note });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erro ao atualizar anotação', error: error.message });
  }
};

exports.deleteClientNote = async (req, res) => {
  try {
    const note = await Note.findOneAndDelete({ _id: req.params.noteId, clientId: req.params.id });
    if (!note) {
      return res.status(404).json({ success: false, message: 'Anotação não encontrada' });
    }
    res.json({ success: true, message: 'Anotação deletada com sucesso' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erro ao deletar anotação', error: error.message });
  }
};

