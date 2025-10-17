const express = require('express');
const router = express.Router();
const quoteController = require('../controllers/quoteController');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate);
router.use(authorize('quotes'));

router.get('/', quoteController.getAllQuotes);
router.get('/:id', quoteController.getQuoteById);
router.post('/', quoteController.createQuote);
router.put('/:id', quoteController.updateQuote);
router.delete('/:id', quoteController.deleteQuote);

module.exports = router;

