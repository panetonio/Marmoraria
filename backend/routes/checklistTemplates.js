const express = require('express');
const { body, param, validationResult } = require('express-validator');
const router = express.Router();
const checklistTemplateController = require('../controllers/checklistTemplateController');
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
router.use(authorize('logistics', 'checklist_templates'));

const checklistValidations = [
  body('name')
    .isString()
    .trim()
    .notEmpty()
    .withMessage('Nome é obrigatório'),
  body('type')
    .isIn(['entrega', 'montagem'])
    .withMessage('Tipo inválido'),
  body('items')
    .isArray({ min: 1 })
    .withMessage('Informe ao menos um item para o checklist'),
  body('items.*.text')
    .isString()
    .trim()
    .notEmpty()
    .withMessage('Texto do item é obrigatório'),
];

router.get('/', checklistTemplateController.getAllTemplates);
router.get(
  '/:id',
  param('id').isMongoId().withMessage('ID inválido para modelo de checklist'),
  validateRequest,
  checklistTemplateController.getTemplateById,
);

router.post(
  '/',
  checklistValidations,
  validateRequest,
  checklistTemplateController.createTemplate,
);

router.put(
  '/:id',
  [param('id').isMongoId().withMessage('ID inválido para modelo de checklist'), ...checklistValidations],
  validateRequest,
  checklistTemplateController.updateTemplate,
);

router.delete(
  '/:id',
  param('id').isMongoId().withMessage('ID inválido para modelo de checklist'),
  validateRequest,
  checklistTemplateController.deleteTemplate,
);

module.exports = router;
