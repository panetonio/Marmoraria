# Sistema de Upload de Imagens - Documentação

## 📋 Visão Geral

Sistema completo de upload de imagens para o backend da Marmoraria ERP, implementado com armazenamento local e preparado para migração para cloud storage.

## 🏗️ Arquitetura

### Componentes Implementados

1. **Controller**: `backend/controllers/uploadController.js`
2. **Rotas**: `backend/routes/uploads.js`
3. **Middleware**: Configurado em `backend/server.js`
4. **Armazenamento**: `backend/public/uploads/`

## 🔧 Funcionalidades

### 1. Upload de Imagem
- **Endpoint**: `POST /api/uploads/image`
- **Autenticação**: Bearer token obrigatório
- **Formato**: Data URI base64
- **Validação**: Tipo de arquivo, tamanho máximo
- **Resposta**: URL pública da imagem

### 2. Listagem de Arquivos
- **Endpoint**: `GET /api/uploads/files`
- **Autenticação**: Bearer token obrigatório
- **Resposta**: Lista de arquivos com metadados

### 3. Deletar Arquivo
- **Endpoint**: `DELETE /api/uploads/file/:filename`
- **Autenticação**: Bearer token obrigatório
- **Resposta**: Confirmação de exclusão

### 4. Estatísticas
- **Endpoint**: `GET /api/uploads/stats`
- **Autenticação**: Bearer token obrigatório
- **Resposta**: Estatísticas de uso

## 📡 API Endpoints

### POST /api/uploads/image

**Request Body:**
```json
{
  "imageData": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=="
}
```

**Response Success:**
```json
{
  "success": true,
  "url": "/uploads/1761704037813-abc12345.png",
  "filename": "1761704037813-abc12345.png",
  "size": 1024,
  "mimeType": "image/png"
}
```

**Response Error:**
```json
{
  "success": false,
  "message": "Tipo de arquivo não permitido: image/gif. Tipos permitidos: image/jpeg, image/jpg, image/png, image/gif, image/webp"
}
```

### GET /api/uploads/files

**Response:**
```json
{
  "success": true,
  "files": [
    {
      "filename": "1761704037813-abc12345.png",
      "url": "/uploads/1761704037813-abc12345.png",
      "size": 1024,
      "created": "2024-12-15T14:30:00.000Z",
      "modified": "2024-12-15T14:30:00.000Z"
    }
  ],
  "count": 1
}
```

### DELETE /api/uploads/file/:filename

**Response Success:**
```json
{
  "success": true,
  "message": "Arquivo 1761704037813-abc12345.png deletado com sucesso"
}
```

### GET /api/uploads/stats

**Response:**
```json
{
  "success": true,
  "stats": {
    "totalFiles": 5,
    "totalSize": 2048000,
    "totalSizeMB": "1.95",
    "fileTypes": {
      ".png": 3,
      ".jpg": 2
    },
    "uploadDir": "/path/to/backend/public/uploads"
  }
}
```

## ⚙️ Configurações

### Validações Implementadas

1. **Tipos de Arquivo Permitidos**:
   - `image/jpeg`
   - `image/jpg`
   - `image/png`
   - `image/gif`
   - `image/webp`

2. **Tamanho Máximo**: 10MB por arquivo

3. **Formato de Entrada**: Data URI base64 obrigatório

### Middleware Configurado

```javascript
// Body parser com limite de 10MB
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Servir arquivos estáticos
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));
```

## 🔒 Segurança

### Autenticação
- Todas as rotas protegidas com middleware `authenticate`
- Bearer token obrigatório no header `Authorization`

### Validação de Arquivos
- Validação de tipo MIME
- Validação de tamanho máximo
- Validação de formato data URI
- Sanitização de nomes de arquivo

### Proteção contra Path Traversal
- Validação de nomes de arquivo
- Prevenção de caracteres perigosos (`..`, `/`, `\`)

## 📁 Estrutura de Arquivos

```
backend/
├── controllers/
│   └── uploadController.js
├── routes/
│   └── uploads.js
├── public/
│   └── uploads/
│       ├── .gitignore
│       └── .gitkeep
├── scripts/
│   └── testImageUpload.js
└── server.js
```

## 🧪 Testes

### Script de Teste
Execute `node scripts/testImageUpload.js` para testar:
- ✅ Validação de data URI
- ✅ Conversão base64 para buffer
- ✅ Geração de nome único
- ✅ Salvamento local de arquivo
- ✅ Verificação de arquivo salvo
- ✅ Geração de URL pública
- ✅ Listagem de arquivos
- ✅ Cálculo de estatísticas
- ✅ Cleanup de arquivos de teste

### Teste Manual com cURL

```bash
# Upload de imagem
curl -X POST http://localhost:5000/api/uploads/image \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"imageData": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=="}'

# Listar arquivos
curl -X GET http://localhost:5000/api/uploads/files \
  -H "Authorization: Bearer YOUR_TOKEN"

# Estatísticas
curl -X GET http://localhost:5000/api/uploads/stats \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## 🚀 Uso no Frontend

### Exemplo de Upload

```javascript
const uploadImage = async (imageDataUri) => {
  try {
    const response = await fetch('/api/uploads/image', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        imageData: imageDataUri
      })
    });
    
    const result = await response.json();
    
    if (result.success) {
      console.log('Imagem enviada:', result.url);
      return result.url;
    } else {
      throw new Error(result.message);
    }
  } catch (error) {
    console.error('Erro no upload:', error);
    throw error;
  }
};

// Uso com canvas/signature pad
const canvas = document.getElementById('signatureCanvas');
const imageDataUri = canvas.toDataURL('image/png');
const imageUrl = await uploadImage(imageDataUri);
```

### Integração com ServiceOrder

```javascript
// Salvar foto de confirmação
const photoUrl = await uploadImage(photoDataUri);

await fetch(`/api/serviceorders/${serviceOrderId}`, {
  method: 'PATCH',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    $push: {
      confirmationPhotos: {
        url: photoUrl,
        description: 'Foto da instalação'
      }
    }
  })
});

// Salvar assinatura do cliente
const signatureUrl = await uploadImage(signatureDataUri);

await fetch(`/api/serviceorders/${serviceOrderId}`, {
  method: 'PATCH',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    customerSignature: {
      url: signatureUrl,
      name: 'João Silva',
      documentNumber: '123.456.789-00'
    }
  })
});
```

## 🔄 Migração para Cloud Storage

### Preparação para AWS S3

Para migrar para AWS S3, substitua a função `saveFileLocally` por:

```javascript
const AWS = require('aws-sdk');
const s3 = new AWS.S3();

const saveFileToS3 = async (buffer, filename) => {
  const params = {
    Bucket: process.env.S3_BUCKET_NAME,
    Key: `uploads/${filename}`,
    Body: buffer,
    ContentType: 'image/png', // ou detectar do filename
    ACL: 'public-read'
  };
  
  const result = await s3.upload(params).promise();
  return result.Location; // URL pública do S3
};
```

### Preparação para Cloudinary

```javascript
const cloudinary = require('cloudinary').v2;

const saveFileToCloudinary = async (buffer, filename) => {
  return new Promise((resolve, reject) => {
    cloudinary.uploader.upload_stream(
      {
        public_id: `uploads/${filename}`,
        resource_type: 'image'
      },
      (error, result) => {
        if (error) reject(error);
        else resolve(result.secure_url);
      }
    ).end(buffer);
  });
};
```

## 📊 Monitoramento

### Logs Implementados
- Upload iniciado/concluído
- Validação de arquivos
- Erros de salvamento
- Estatísticas de uso

### Métricas Disponíveis
- Total de arquivos
- Tamanho total usado
- Tipos de arquivo
- Arquivos por período

## 🎯 Próximos Passos

1. **Frontend**: Implementar componentes de captura de foto/assinatura
2. **Integração**: Conectar com ServiceOrder para confirmação de entrega
3. **Cloud Storage**: Migrar para AWS S3 ou Cloudinary
4. **CDN**: Implementar CDN para melhor performance
5. **Backup**: Implementar backup automático dos arquivos
6. **Limpeza**: Implementar limpeza automática de arquivos antigos
