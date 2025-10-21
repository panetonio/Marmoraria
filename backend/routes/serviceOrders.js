const express = require('express');
const { body, validationResult } = require('express-validator');
const router = express.Router();
const serviceOrderController = require('../controllers/serviceOrderController');
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
router.use(authorize('logistics'));

router.put(
  '/:id/checklist',
  [
    body('checklist')
      .isArray()
      .withMessage('Checklist deve ser um array'),
    body('checklist.*.text')
      .isString()
      .trim()
      .notEmpty()
      .withMessage('Texto do item é obrigatório'),
    body('checklist.*.checked')
      .optional()
      .isBoolean()
      .withMessage('O campo checked deve ser booleano')
      .toBoolean(),
  ],
  validateRequest,
  serviceOrderController.updateDepartureChecklist,
);

module.exports = router;
