const express = require('express');
const { body, param, validationResult } = require('express-validator');
const cutPieceController = require('../controllers/cutPieceController');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

const validateRequest = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Erro de validação',
      errors: errors.array(),
    });
  }

  return next();
};

// Aplicar autenticação e autorização para todas as rotas
router.use(authenticate);
router.use(authorize('production', 'logistics', 'admin'));

// GET /cut-pieces/by-os/:serviceOrderId - Buscar todas as CutPieces de uma ServiceOrder
router.get(
  '/by-os/:serviceOrderId',
  [
    param('serviceOrderId')
      .isString()
      .withMessage('ID da ServiceOrder é obrigatório')
      .bail()
      .trim()
      .notEmpty()
      .withMessage('ID da ServiceOrder não pode ser vazio')
      .bail()
      .matches(/^OS-\d{4}-\d{3}$/)
      .withMessage('Formato do ID da ServiceOrder inválido (ex: OS-2024-001)'),
  ],
  validateRequest,
  cutPieceController.getCutPiecesByServiceOrder
);

// GET /cut-pieces/by-id/:pieceId - Buscar uma CutPiece pelo pieceId
router.get(
  '/by-id/:pieceId',
  [
    param('pieceId')
      .isString()
      .withMessage('ID da peça é obrigatório')
      .bail()
      .trim()
      .notEmpty()
      .withMessage('ID da peça não pode ser vazio')
      .bail()
      .matches(/^OS-\d{4}-\d{3}-.*-P\d+$/)
      .withMessage('Formato do ID da peça inválido (ex: OS-2024-001-ITEM-1-P1)'),
  ],
  validateRequest,
  cutPieceController.getCutPieceById
);

// PATCH /cut-pieces/:pieceId/status - Atualizar status de uma CutPiece
router.patch(
  '/:pieceId/status',
  [
    param('pieceId')
      .isString()
      .withMessage('ID da peça é obrigatório')
      .bail()
      .trim()
      .notEmpty()
      .withMessage('ID da peça não pode ser vazio')
      .bail()
      .matches(/^OS-\d{4}-\d{3}-.*-P\d+$/)
      .withMessage('Formato do ID da peça inválido (ex: OS-2024-001-ITEM-1-P1)'),
    body('status')
      .isString()
      .withMessage('Status é obrigatório')
      .bail()
      .trim()
      .notEmpty()
      .withMessage('Status não pode ser vazio')
      .bail()
      .isIn(['pending_cut', 'cut', 'finishing', 'assembly', 'ready_for_delivery', 'delivered', 'installed'])
      .withMessage('Status inválido'),
    body('reason')
      .optional()
      .isString()
      .withMessage('Motivo deve ser uma string')
      .bail()
      .trim()
      .isLength({ max: 500 })
      .withMessage('Motivo não pode ter mais de 500 caracteres'),
  ],
  validateRequest,
  cutPieceController.updateCutPieceStatus
);

// PATCH /cut-pieces/:pieceId/location - Atualizar localização de uma CutPiece
router.patch(
  '/:pieceId/location',
  [
    param('pieceId')
      .isString()
      .withMessage('ID da peça é obrigatório')
      .bail()
      .trim()
      .notEmpty()
      .withMessage('ID da peça não pode ser vazio')
      .bail()
      .matches(/^OS-\d{4}-\d{3}-.*-P\d+$/)
      .withMessage('Formato do ID da peça inválido (ex: OS-2024-001-ITEM-1-P1)'),
    body('location')
      .isString()
      .withMessage('Localização é obrigatória')
      .bail()
      .trim()
      .notEmpty()
      .withMessage('Localização não pode ser vazia')
      .bail()
      .isLength({ min: 2, max: 100 })
      .withMessage('Localização deve ter entre 2 e 100 caracteres'),
  ],
  validateRequest,
  cutPieceController.updateCutPieceLocation
);

module.exports = router;

