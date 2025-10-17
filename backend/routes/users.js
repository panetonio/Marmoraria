const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authenticate, isAdmin } = require('../middleware/auth');

// Todas as rotas requerem autenticação e permissão de admin
router.use(authenticate);
router.use(isAdmin);

/**
 * @route   GET /api/users
 * @desc    Listar todos os usuários
 * @access  Private/Admin
 */
router.get('/', userController.getAllUsers);

/**
 * @route   GET /api/users/:id
 * @desc    Obter usuário por ID
 * @access  Private/Admin
 */
router.get('/:id', userController.getUserById);

/**
 * @route   POST /api/users
 * @desc    Criar novo usuário
 * @access  Private/Admin
 */
router.post('/', userController.createUser);

/**
 * @route   PUT /api/users/:id
 * @desc    Atualizar usuário
 * @access  Private/Admin
 */
router.put('/:id', userController.updateUser);

/**
 * @route   DELETE /api/users/:id
 * @desc    Deletar usuário
 * @access  Private/Admin
 */
router.delete('/:id', userController.deleteUser);

/**
 * @route   PATCH /api/users/:id/toggle-status
 * @desc    Ativar/Desativar usuário
 * @access  Private/Admin
 */
router.patch('/:id/toggle-status', userController.toggleUserStatus);

/**
 * @route   PATCH /api/users/:id/permissions
 * @desc    Atualizar permissões customizadas
 * @access  Private/Admin
 */
router.patch('/:id/permissions', userController.updateUserPermissions);

module.exports = router;

