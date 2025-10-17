const User = require('../models/User');
const bcrypt = require('bcryptjs');

/**
 * Listar todos os usuários
 */
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find();

    res.json({
      success: true,
      count: users.length,
      data: users,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar usuários',
      error: error.message,
    });
  }
};

/**
 * Obter usuário por ID
 */
exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuário não encontrado',
      });
    }

    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar usuário',
      error: error.message,
    });
  }
};

/**
 * Criar novo usuário (apenas admin)
 */
exports.createUser = async (req, res) => {
  try {	
  const { name, email, password, role } = req.body;

    // Verificar se email já existe
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Email já cadastrado',
      });
    }

    console.log('📝 Criando usuário:', { name, email, role });
    
    // Criar usuário
    const user = await User.create({
      name,
      email,
      password,
      role: role || 'vendedor',
    });

    console.log('✅ Usuário criado com sucesso:', user._id);

    res.status(201).json({
      success: true,
      message: 'Usuário criado com sucesso',
      data: user,
    });
  } catch (error) {
    console.error('❌ Erro ao criar usuário:', error.message);
    console.error('Stack:', error.stack);
    
    // Erro de validação do Mongoose
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(e => e.message);
      return res.status(400).json({
        success: false,
        message: 'Erro de validação',
        errors,
      });
    }

    // Erro de email duplicado
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Email já está em uso',
      });
    }

    res.status(500).json({
      success: false,
      message: 'Erro ao criar usuário',
      error: error.message,
    });
  }
};



/**
 * Atualizar usuário
 */
exports.updateUser = async (req, res) => {
  try {
    const { name, email, password, role, customPermissions, isActive } = req.body;

    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuário não encontrado',
      });
    }

    // Atualizar campos
    if (name) user.name = name;
    if (email) user.email = email;
    if (role) user.role = role;
    if (customPermissions !== undefined) user.customPermissions = customPermissions;
    if (isActive !== undefined) user.isActive = isActive;

    // Atualizar senha se fornecida
    if (password) {
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(password, salt);
    }

    await user.save();

    res.json({
      success: true,
      message: 'Usuário atualizado com sucesso',
      data: user,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erro ao atualizar usuário',
      error: error.message,
    });
  }
};

/**
 * Deletar usuário
 */
exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuário não encontrado',
      });
    }

    await User.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Usuário deletado com sucesso',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erro ao deletar usuário',
      error: error.message,
    });
  }
};

/**
 * Ativar/Desativar usuário
 */
exports.toggleUserStatus = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuário não encontrado',
      });
    }

    user.isActive = !user.isActive;
    await user.save();

    res.json({
      success: true,
      message: `Usuário ${user.isActive ? 'ativado' : 'desativado'} com sucesso`,
      data: user,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erro ao alterar status do usuário',
      error: error.message,
    });
  }
};

/**
 * Atualizar permissões customizadas
 */
exports.updateUserPermissions = async (req, res) => {
  try {
    const { customPermissions } = req.body;

    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuário não encontrado',
      });
    }

    user.customPermissions = customPermissions;
    await user.save();

    res.json({
      success: true,
      message: 'Permissões atualizadas com sucesso',
      data: user,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erro ao atualizar permissões',
      error: error.message,
    });
  }
};

