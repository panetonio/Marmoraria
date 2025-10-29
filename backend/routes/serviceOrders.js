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

// Criar ServiceOrder
router.post('/', authorize('production', 'admin'), serviceOrderController.createServiceOrder);

// Atualizar status da ServiceOrder
router.patch('/:id/status', authorize('production', 'admin'), serviceOrderController.updateServiceOrderStatus);

router.put(
  '/:id/checklist',
  authorize('logistics'),
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

// Marcar Exceções
router.patch('/:id/mark-rework', authorize('production'), serviceOrderController.markForRework);
router.patch('/:id/report-delivery-issue', authorize('logistics'), serviceOrderController.reportDeliveryIssue);
router.patch('/:id/request-review', authorize('logistics', 'production'), serviceOrderController.requestInstallationReview);

// Resolver Exceções
router.patch('/:id/resolve-issue', authorize('production', 'logistics'), serviceOrderController.resolveServiceOrderIssue);
router.patch('/:id/resolve-rework', authorize('production'), serviceOrderController.resolveRework);
router.patch('/:id/resolve-delivery-issue', authorize('logistics'), serviceOrderController.resolveDeliveryIssue);
router.patch('/:id/complete-review', authorize('production'), serviceOrderController.completeReview);

module.exports = router;
