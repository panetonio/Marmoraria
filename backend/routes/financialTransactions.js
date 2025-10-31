const express = require('express');
const router = express.Router();
const path = require('path');
const multer = require('multer');
const { authenticate, authorize } = require('../middleware/auth');
const financialTransactionController = require('../controllers/financialTransactionController');

// Configuração do multer para salvar em backend/public/uploads/finance
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '..', 'public', 'uploads', 'finance'));
  },
  filename: function (req, file, cb) {
    const uniqueName = `${Date.now()}-${file.originalname}`;
    cb(null, uniqueName);
  },
});

const upload = multer({ storage });

// Proteger todas as rotas
router.use(authenticate);

// Upload de anexo financeiro
router.post('/upload', authorize('finance'), upload.single('attachment'), financialTransactionController.uploadAttachment);

module.exports = router;



