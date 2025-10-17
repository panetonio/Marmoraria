# 🚀 Guia Rápido de Instalação - Backend

## Passos para rodar o backend

### 1️⃣ Instalar Node.js
Se ainda não tem, baixe em: https://nodejs.org/ (versão LTS recomendada)

### 2️⃣ Navegar até a pasta do backend
```bash
cd backend
```

### 3️⃣ Instalar dependências
```bash
npm install
```

### 4️⃣ Criar arquivo .env
Crie um arquivo chamado `.env` na pasta `backend/` com este conteúdo:

```env
MONGODB_URI=mongodb+srv://admin:@81566794Ga@marmoraria.bopqgos.mongodb.net/marmoraria?retryWrites=true&w=majority&appName=Marmoraria
JWT_SECRET=marmoraria_super_secret_key_change_in_production_2024
JWT_EXPIRES_IN=7d
PORT=5000
NODE_ENV=development
CORS_ORIGIN=http://localhost:5173
```

### 5️⃣ Popular banco com usuários iniciais (Opcional)
```bash
npm run seed
```

Isso criará:
- **Admin**: admin@marmoraria.com / admin123
- **Vendedor**: vendedor@marmoraria.com / vendedor123
- **Produção**: producao@marmoraria.com / producao123

### 6️⃣ Iniciar o servidor

**Desenvolvimento (com auto-reload):**
```bash
npm run dev
```

**OU Produção:**
```bash
npm start
```

### 7️⃣ Testar
Abra o navegador em: http://localhost:5000

Você deve ver:
```json
{
  "success": true,
  "message": "API Marmoraria ERP",
  "version": "1.0.0",
  ...
}
```

## ✅ Pronto!

O backend está rodando em `http://localhost:5000`

### Próximos passos:

1. Teste o login via Postman/Insomnia:
   - POST http://localhost:5000/api/auth/login
   - Body: `{"email": "admin@marmoraria.com", "password": "admin123"}`

2. Configure o frontend para usar esta URL da API

3. Veja a documentação completa em `README.md`

## 🆘 Problemas?

### Erro "Cannot find module"
```bash
npm install
```

### Erro de conexão MongoDB
- Verifique se a string de conexão no .env está correta
- Verifique sua conexão com a internet

### Porta 5000 já em uso
Altere a porta no arquivo `.env`:
```env
PORT=5001
```

### CORS Error no frontend
Verifique se `CORS_ORIGIN` no .env está igual à URL do frontend

---

📚 **Documentação completa**: Veja `README.md`
🐛 **Issues**: Relate problemas encontrados

