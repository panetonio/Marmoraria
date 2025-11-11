const express = require('express');
const { body, param, query, validationResult } = require('express-validator');
const assetController = require('../controllers/assetController');
const { createRetalhoFromSlab } = assetController;
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

router.use(authenticate);
router.use(authorize('stock', 'production', 'catalog', 'admin'));

router.get(
  '/qrcode-scan',
  query('data')
    .isString()
    .withMessage('Dados do QR Code são obrigatórios')
    .bail()
    .notEmpty()
    .withMessage('Dados do QR Code não podem ser vazios'),
  validateRequest,
  assetController.scanByQrData,
);

router.put(
  '/:type/:id/status',
  [
    param('type')
      .custom((value) => {
        const config = assetController.getAssetConfig(value);
        if (!config) {
          throw new Error('Tipo de asset inválido');
        }
        if (!config.statusField) {
          throw new Error('Este asset não suporta atualização de status');
        }
        return true;
      }),
    param('id')
      .isMongoId()
      .withMessage('ID inválido para asset'),
    body('status')
      .exists()
      .withMessage('Status é obrigatório')
      .bail()
      .isString()
      .withMessage('Status deve ser uma string')
      .bail()
      .trim()
      .notEmpty()
      .withMessage('Status é obrigatório')
      .bail()
      .custom((value, { req }) => {
        const config = assetController.getAssetConfig(req.params.type);
        if (!config || !config.statusField) {
          throw new Error('Este asset não suporta atualização de status');
        }
        if (config.allowedStatuses && !config.allowedStatuses.includes(value)) {
          throw new Error('Status inválido para este asset');
        }
        return true;
      }),
  ],
  validateRequest,
  assetController.updateAssetStatus,
);

router.put(
  '/:type/:id/location',
  [
    param('type')
      .custom((value) => {
        const config = assetController.getAssetConfig(value);
        if (!config) {
          throw new Error('Tipo de asset inválido');
        }
        if (!config.locationField) {
          throw new Error('Este asset não suporta atualização de localização');
        }
        return true;
      }),
    param('id')
      .isMongoId()
      .withMessage('ID inválido para asset'),
    body('location')
      .exists()
      .withMessage('Localização é obrigatória')
      .bail()
      .isString()
      .withMessage('Localização deve ser uma string')
      .bail()
      .trim()
      .notEmpty()
      .withMessage('Localização é obrigatória'),
  ],
  validateRequest,
  assetController.updateAssetLocation,
);

router.post(
  '/stock_item/:id/create-retalho',
  authenticate,
  authorize('production', 'stock', 'admin'),
  createRetalhoFromSlab,
);

module.exports = router;
