const express = require('express');
const { param, body, validationResult } = require('express-validator');
const router = express.Router();
const stockController = require('../controllers/stockController');
const { authenticate, authorize } = require('../middleware/auth');

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

router.use(authenticate);
router.use(authorize('stock'));

router.get(
  '/qrcode/:id',
  param('id').isMongoId().withMessage('ID inválido para item de estoque'),
  validateRequest,
  stockController.getStockItemById,
);

router.put(
  '/qrcode/:id/status',
  [
    param('id').isMongoId().withMessage('ID inválido para item de estoque'),
    body('status')
      .optional()
      .isIn([
        'disponivel',
        'reservada',
        'em_uso',
        'consumida',
        'em_corte',
        'em_acabamento',
        'pronto_para_expedicao',
      ])
      .withMessage('Status inválido'),
    body('location')
      .optional()
      .isString()
      .trim()
      .notEmpty()
      .withMessage('Localização não pode ser vazia'),
    body('note')
      .optional()
      .isString()
      .withMessage('Observação deve ser uma string'),
    body().custom((value) => {
      if (!value.status && !value.location) {
        throw new Error('É necessário informar status ou localização');
      }
      return true;
    }),
  ],
  validateRequest,
  stockController.updateStockItemStatus,
);

module.exports = router;
