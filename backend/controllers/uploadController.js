const fs = require('fs').promises;
const path = require('path');
const { v4: uuidv4 } = require('uuid');

// Configurações
const UPLOAD_DIR = path.join(__dirname, '../public/uploads');
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];

// Garantir que o diretório de upload existe
const ensureUploadDir = async () => {
  try {
    await fs.access(UPLOAD_DIR);
  } catch (error) {
    await fs.mkdir(UPLOAD_DIR, { recursive: true });
    console.log('📁 Diretório de upload criado:', UPLOAD_DIR);
  }
};

// Validar formato de data URI
const validateDataUri = (dataUri) => {
  const dataUriRegex = /^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,(.+)$/;
  const match = dataUri.match(dataUriRegex);
  
  if (!match) {
    throw new Error('Formato de data URI inválido');
  }
  
  const [, mimeType, base64Data] = match;
  
  if (!ALLOWED_MIME_TYPES.includes(mimeType)) {
    throw new Error(`Tipo de arquivo não permitido: ${mimeType}. Tipos permitidos: ${ALLOWED_MIME_TYPES.join(', ')}`);
  }
  
  // Calcular tamanho aproximado do arquivo
  const fileSizeInBytes = (base64Data.length * 3) / 4;
  if (fileSizeInBytes > MAX_FILE_SIZE) {
    throw new Error(`Arquivo muito grande: ${(fileSizeInBytes / 1024 / 1024).toFixed(2)}MB. Tamanho máximo: ${MAX_FILE_SIZE / 1024 / 1024}MB`);
  }
  
  return { mimeType, base64Data };
};

// Converter base64 para buffer
const base64ToBuffer = (base64Data) => {
  return Buffer.from(base64Data, 'base64');
};

// Gerar nome de arquivo único
const generateUniqueFilename = (mimeType) => {
  const extension = mimeType.split('/')[1];
  const timestamp = Date.now();
  const uuid = uuidv4().substring(0, 8);
  return `${timestamp}-${uuid}.${extension}`;
};

// Salvar arquivo localmente
const saveFileLocally = async (buffer, filename) => {
  const filePath = path.join(UPLOAD_DIR, filename);
  await fs.writeFile(filePath, buffer);
  return filePath;
};

// Upload de imagem
exports.uploadImage = async (req, res) => {
  try {
    console.log('📤 Iniciando upload de imagem...');
    
    // Garantir que o diretório existe
    await ensureUploadDir();
    
    // Validar dados da requisição
    const { imageData } = req.body;
    
    if (!imageData) {
      return res.status(400).json({
        success: false,
        message: 'Dados da imagem não fornecidos'
      });
    }
    
    if (typeof imageData !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Dados da imagem devem ser uma string'
      });
    }
    
    // Validar formato de data URI
    const { mimeType, base64Data } = validateDataUri(imageData);
    console.log(`📋 Tipo de arquivo detectado: ${mimeType}`);
    
    // Converter base64 para buffer
    const imageBuffer = base64ToBuffer(base64Data);
    console.log(`📏 Tamanho do arquivo: ${(imageBuffer.length / 1024).toFixed(2)}KB`);
    
    // Gerar nome de arquivo único
    const filename = generateUniqueFilename(mimeType);
    console.log(`📝 Nome do arquivo: ${filename}`);
    
    // Salvar arquivo
    const filePath = await saveFileLocally(imageBuffer, filename);
    console.log(`💾 Arquivo salvo em: ${filePath}`);
    
    // Gerar URL pública
    const publicUrl = `/uploads/${filename}`;
    
    console.log('✅ Upload concluído com sucesso');
    
    res.json({
      success: true,
      url: publicUrl,
      filename: filename,
      size: imageBuffer.length,
      mimeType: mimeType
    });
    
  } catch (error) {
    console.error('❌ Erro no upload:', error.message);
    
    // Determinar código de status baseado no tipo de erro
    let statusCode = 500;
    let message = 'Erro interno do servidor';
    
    if (error.message.includes('Formato de data URI inválido') || 
        error.message.includes('Tipo de arquivo não permitido') ||
        error.message.includes('Arquivo muito grande')) {
      statusCode = 400;
      message = error.message;
    }
    
    res.status(statusCode).json({
      success: false,
      message: message,
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Listar arquivos uploadados (para debug/admin)
exports.listUploadedFiles = async (req, res) => {
  try {
    await ensureUploadDir();
    
    const files = await fs.readdir(UPLOAD_DIR);
    const fileStats = await Promise.all(
      files.map(async (filename) => {
        const filePath = path.join(UPLOAD_DIR, filename);
        const stats = await fs.stat(filePath);
        return {
          filename,
          url: `/uploads/${filename}`,
          size: stats.size,
          created: stats.birthtime,
          modified: stats.mtime
        };
      })
    );
    
    res.json({
      success: true,
      files: fileStats,
      count: fileStats.length
    });
    
  } catch (error) {
    console.error('❌ Erro ao listar arquivos:', error.message);
    res.status(500).json({
      success: false,
      message: 'Erro ao listar arquivos',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Deletar arquivo (para cleanup/admin)
exports.deleteFile = async (req, res) => {
  try {
    const { filename } = req.params;
    
    if (!filename) {
      return res.status(400).json({
        success: false,
        message: 'Nome do arquivo não fornecido'
      });
    }
    
    // Validar nome do arquivo para segurança
    if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
      return res.status(400).json({
        success: false,
        message: 'Nome do arquivo inválido'
      });
    }
    
    const filePath = path.join(UPLOAD_DIR, filename);
    
    try {
      await fs.unlink(filePath);
      console.log(`🗑️ Arquivo deletado: ${filename}`);
      
      res.json({
        success: true,
        message: `Arquivo ${filename} deletado com sucesso`
      });
      
    } catch (fsError) {
      if (fsError.code === 'ENOENT') {
        return res.status(404).json({
          success: false,
          message: 'Arquivo não encontrado'
        });
      }
      throw fsError;
    }
    
  } catch (error) {
    console.error('❌ Erro ao deletar arquivo:', error.message);
    res.status(500).json({
      success: false,
      message: 'Erro ao deletar arquivo',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Estatísticas de upload (para monitoramento)
exports.getUploadStats = async (req, res) => {
  try {
    await ensureUploadDir();
    
    const files = await fs.readdir(UPLOAD_DIR);
    let totalSize = 0;
    const fileTypes = {};
    
    for (const filename of files) {
      const filePath = path.join(UPLOAD_DIR, filename);
      const stats = await fs.stat(filePath);
      totalSize += stats.size;
      
      const extension = path.extname(filename).toLowerCase();
      fileTypes[extension] = (fileTypes[extension] || 0) + 1;
    }
    
    res.json({
      success: true,
      stats: {
        totalFiles: files.length,
        totalSize: totalSize,
        totalSizeMB: (totalSize / 1024 / 1024).toFixed(2),
        fileTypes: fileTypes,
        uploadDir: UPLOAD_DIR
      }
    });
    
  } catch (error) {
    console.error('❌ Erro ao obter estatísticas:', error.message);
    res.status(500).json({
      success: false,
      message: 'Erro ao obter estatísticas',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};
