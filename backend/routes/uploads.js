const express = require('express');
const router = express.Router();
const uploadController = require('../controllers/uploadController');
const { authenticate } = require('../middleware/auth');

// POST /api/uploads/image - Upload de imagem (protegido)
router.post('/image', authenticate, uploadController.uploadImage);

// GET /api/uploads/files - Listar arquivos uploadados (protegido - admin)
router.get('/files', authenticate, uploadController.listUploadedFiles);

// DELETE /api/uploads/file/:filename - Deletar arquivo (protegido - admin)
router.delete('/file/:filename', authenticate, uploadController.deleteFile);

// GET /api/uploads/stats - Estatísticas de upload (protegido - admin)
router.get('/stats', authenticate, uploadController.getUploadStats);

module.exports = router;
