const express = require('express');
const router = express.Router();
const orderAddendumController = require('../controllers/orderAddendumController');
const { authenticate, authorize } = require('../middleware/auth');

// Middleware de validação para criação de adendo
const validateCreateAddendum = (req, res, next) => {
  const { reason } = req.body;
  
  if (!reason || reason.trim() === '') {
    return res.status(400).json({
      success: false,
      message: 'Campo "reason" é obrigatório'
    });
  }
  
  next();
};

// Middleware de validação para atualização de status
const validateStatusUpdate = (req, res, next) => {
  const { status } = req.body;
  
  if (!status || !['approved', 'rejected'].includes(status)) {
    return res.status(400).json({
      success: false,
      message: 'Campo "status" é obrigatório e deve ser "approved" ou "rejected"'
    });
  }
  
  next();
};

// Todas as rotas requerem autenticação
router.use(authenticate);

// GET /order/:orderId - Buscar adendos de um pedido
router.get('/order/:orderId', 
  authorize('orders'), 
  orderAddendumController.getAddendumsForOrder
);

// POST /order/:orderId - Criar novo adendo
router.post('/order/:orderId', 
  authorize('orders'), 
  validateCreateAddendum,
  orderAddendumController.createAddendum
);

// PATCH /:addendumId/status - Atualizar status do adendo
router.patch('/:addendumId/status', 
  authorize('orders'), 
  validateStatusUpdate,
  orderAddendumController.updateAddendumStatus
);

module.exports = router;
