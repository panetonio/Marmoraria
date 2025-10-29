# Modificações no Modelo ServiceOrder - Campos de Confirmação

## 📋 Resumo das Alterações

Foram adicionados novos campos ao modelo `ServiceOrder.js` para persistir informações coletadas durante a confirmação de entrega e instalação.

## 🔧 Campos Adicionados

### 1. **confirmationPhotos** (Array de Objetos)
```javascript
confirmationPhotos: [{
  url: String,        // Obrigatório - Link da imagem armazenada
  description: String // Opcional - Descrição da foto
}]
```

**Uso**: Armazena múltiplas fotos tiradas durante a entrega/instalação, cada uma com sua descrição.

**Exemplo**:
```javascript
confirmationPhotos: [
  {
    url: 'https://storage.example.com/photos/entrega-1.jpg',
    description: 'Foto da bancada instalada na cozinha'
  },
  {
    url: 'https://storage.example.com/photos/entrega-2.jpg',
    description: 'Foto geral da instalação'
  }
]
```

### 2. **customerSignature** (Objeto)
```javascript
customerSignature: {
  url: String,           // Obrigatório - Link da imagem da assinatura
  timestamp: Date,       // Automático - Data/hora da assinatura
  name: String,          // Opcional - Nome de quem assinou
  documentNumber: String // Opcional - CPF/CNPJ de quem assinou
}
```

**Uso**: Armazena a assinatura digital do cliente com informações do signatário.

**Exemplo**:
```javascript
customerSignature: {
  url: 'https://storage.example.com/signatures/assinatura-cliente.jpg',
  timestamp: new Date('2024-12-15T14:30:00Z'),
  name: 'João Silva',
  documentNumber: '123.456.789-00'
}
```

## 🏗️ Estrutura dos Schemas

### confirmationPhotoSchema
```javascript
const confirmationPhotoSchema = new mongoose.Schema({
  url: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    trim: true,
  },
}, { _id: false });
```

### customerSignatureSchema
```javascript
const customerSignatureSchema = new mongoose.Schema({
  url: {
    type: String,
    required: true,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
  name: {
    type: String,
    trim: true,
  },
  documentNumber: {
    type: String,
    trim: true,
  },
}, { _id: false });
```

## ✅ Validações Implementadas

1. **Campos Obrigatórios**:
   - `confirmationPhotos[].url` - URL da foto é obrigatória
   - `customerSignature.url` - URL da assinatura é obrigatória

2. **Campos Opcionais**:
   - `confirmationPhotos[].description` - Descrição da foto é opcional
   - `customerSignature.name` - Nome do signatário é opcional
   - `customerSignature.documentNumber` - Documento do signatário é opcional

3. **Valores Automáticos**:
   - `customerSignature.timestamp` - Definido automaticamente como `Date.now`

## 🔍 Operações Suportadas

### Criação
```javascript
const serviceOrder = await ServiceOrder.create({
  // ... outros campos ...
  confirmationPhotos: [
    { url: 'photo1.jpg', description: 'Foto 1' }
  ],
  customerSignature: {
    url: 'signature.jpg',
    name: 'João Silva',
    documentNumber: '123.456.789-00'
  }
});
```

### Atualização - Adicionar Fotos
```javascript
await ServiceOrder.findByIdAndUpdate(serviceOrderId, {
  $push: {
    confirmationPhotos: {
      url: 'new-photo.jpg',
      description: 'Nova foto'
    }
  }
});
```

### Atualização - Modificar Assinatura
```javascript
await ServiceOrder.findByIdAndUpdate(serviceOrderId, {
  $set: {
    'customerSignature.name': 'Novo Nome',
    'customerSignature.documentNumber': '987.654.321-00'
  }
});
```

### Busca - ServiceOrders com Fotos
```javascript
const serviceOrdersWithPhotos = await ServiceOrder.find({
  'confirmationPhotos.0': { $exists: true }
});
```

### Busca - ServiceOrders com Assinatura
```javascript
const serviceOrdersWithSignature = await ServiceOrder.find({
  'customerSignature.url': { $exists: true }
});
```

## 🧪 Testes Realizados

O script `backend/scripts/testConfirmationFields.js` testa:

- ✅ Criação de ServiceOrder com campos de confirmação
- ✅ Salvamento de fotos de confirmação
- ✅ Salvamento de assinatura do cliente
- ✅ Atualização de campos existentes
- ✅ Busca por campos específicos
- ✅ Validação de campos obrigatórios

## 📊 Exemplo de Dados Salvos

```javascript
{
  "_id": ObjectId("..."),
  "id": "OS-CONFIRM-TEST-001",
  "clientName": "Cliente Teste Confirmação",
  // ... outros campos ...
  "confirmationPhotos": [
    {
      "url": "https://example.com/photos/entrega-1.jpg",
      "description": "Foto da bancada instalada na cozinha"
    },
    {
      "url": "https://example.com/photos/entrega-2.jpg",
      "description": "Foto geral da instalação"
    }
  ],
  "customerSignature": {
    "url": "https://example.com/signatures/assinatura-cliente.jpg",
    "timestamp": ISODate("2024-12-15T14:30:00.000Z"),
    "name": "João Silva",
    "documentNumber": "123.456.789-00"
  },
  "createdAt": ISODate("2024-12-15T10:00:00.000Z"),
  "updatedAt": ISODate("2024-12-15T14:30:00.000Z")
}
```

## 🎯 Próximos Passos

1. **Frontend**: Atualizar interfaces TypeScript para incluir os novos campos
2. **APIs**: Criar endpoints para upload de fotos e assinaturas
3. **Controllers**: Implementar lógica para salvar os dados de confirmação
4. **UI**: Criar componentes para captura de fotos e assinaturas
5. **Validação**: Implementar validação de tipos de arquivo e tamanhos

## 🔄 Compatibilidade

- ✅ **Retrocompatível**: ServiceOrders existentes continuam funcionando
- ✅ **Opcional**: Campos são opcionais, não quebram funcionalidades existentes
- ✅ **Flexível**: Permite adicionar múltiplas fotos conforme necessário
- ✅ **Extensível**: Estrutura permite futuras expansões dos campos
