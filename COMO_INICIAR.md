# 🚀 Como Iniciar o Sistema

## ⚠️ O sistema não está abrindo? Siga estes passos:

### **Opção 1: Inicialização Automática** (Recomendado)

1. **Dê duplo clique no arquivo:** `INICIAR_SISTEMA.bat`
2. Duas janelas serão abertas (Backend e Frontend)
3. **IMPORTANTE:** Observe as mensagens nas janelas
4. Aguarde 10-15 segundos
5. Acesse: http://localhost:5173

---

### **Opção 2: Inicialização Manual** (Para ver erros)

#### **Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

✅ **Sucesso se ver:**
```
🚀 Servidor rodando na porta 5000
🌍 Ambiente: development
✅ API disponível em: http://localhost:5000
```

❌ **Se aparecer erro:** Copie a mensagem e me envie.

---

#### **Terminal 2 - Frontend:**
```bash
npm run dev
```

✅ **Sucesso se ver:**
```
VITE v5.x.x  ready in XXX ms

➜  Local:   http://localhost:5173/
➜  Network: use --host to expose
```

❌ **Se aparecer erro:** Copie a mensagem e me envie.

---

## 🔍 **Verificações Rápidas:**

### 1. **MongoDB está conectando?**
```bash
cd backend
node test-connection.js
```

Deve mostrar:
```
✅ Conexão bem-sucedida!
📊 Database: marmoraria
```

### 2. **Portas estão ocupadas?**
```bash
netstat -ano | findstr ":5000 :5173"
```

Se aparecer algo, outra aplicação está usando as portas.

**Solução:** Mate os processos:
```bash
taskkill /F /IM node.exe
```

### 3. **Dependencies instaladas?**

**Backend:**
```bash
cd backend
npm install
```

**Frontend:**
```bash
npm install
```

---

## 🎯 **URLs Esperadas:**

- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:5000
- **Health Check:** http://localhost:5000/health

---

## 🐛 **Erros Comuns:**

### **Erro: EADDRINUSE (Porta em uso)**
```bash
taskkill /F /IM node.exe
```

### **Erro: Cannot find module**
```bash
npm install
```

### **Erro: MongoDB connection failed**
- Verifique o arquivo `backend/.env`
- Execute `node backend/test-connection.js`

### **Erro de compilação no Frontend**
- Delete a pasta `node_modules`
- Execute `npm install` novamente
- Tente `npm run dev` novamente

---

## 📞 **Ainda não funciona?**

**Me envie:**
1. Print ou texto do erro completo
2. Qual comando você executou
3. Em qual terminal (Backend ou Frontend)

Vou resolver imediatamente! 🛠️

