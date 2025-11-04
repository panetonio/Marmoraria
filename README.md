# Marmoraria ERP - Gestão Integrada

Bem-vindo ao Marmoraria ERP, um sistema de gestão interno (ERP) robusto e centralizado, projetado para otimizar todas as operações de uma marmoraria.

Este documento fornece as instruções necessárias para configurar e executar o projeto em um ambiente de desenvolvimento.

## 🚀 Começando

Siga os passos abaixo para colocar a aplicação em funcionamento.

### 1. Pré-requisitos

Certifique-se de ter o [Node.js](https://nodejs.org/) (versão 18 ou superior) instalado em sua máquina. A instalação do Node.js também inclui o `npm`, o gerenciador de pacotes que usaremos.

### 2. Instalação

#### Frontend
```bash
cd frontend
npm install
```

#### Backend
```bash
cd backend
npm install
```

### 3. Variáveis de Ambiente

#### Frontend
Algumas funcionalidades do ERP, como integrações com APIs externas, podem exigir chaves de API. Crie um arquivo chamado `.env` na pasta `frontend/` para armazenar essas chaves.

**Exemplo de `frontend/.env`:**
```
API_KEY=SUA_CHAVE_DE_API_AQUI
```
*A aplicação está configurada para ler a variável `API_KEY` do ambiente para integrações com serviços de IA.*

#### Backend
Veja as instruções detalhadas em `backend/INSTALACAO.md` para configurar o arquivo `.env` do backend.

### 4. Executando a Aplicação

#### Opção 1: Modo Produção (Frontend integrado ao Backend)
```bash
cd backend
npm run build:frontend  # Gera o build do frontend
npm start                # Inicia o servidor (frontend + backend na porta 5000)
```
Acesse: `http://localhost:5000` (Frontend e API integrados)

#### Opção 2: Modo Desenvolvimento (Frontend e Backend separados)
Na raiz do projeto, execute:
```bash
INICIAR_SISTEMA.bat
```
Este script iniciará automaticamente o backend e o frontend em modo desenvolvimento.

**Ou manualmente:**

**Backend:**
```bash
cd backend
npm run dev
```
O backend estará disponível em `http://localhost:5000`

**Frontend:**
```bash
cd frontend
npm run dev
```
O frontend estará disponível em `http://localhost:3000`

---

## 🔮 Futuras Configurações

### Conexão com Banco de Dados

Atualmente, o projeto utiliza dados estáticos (mock data) para facilitar o desenvolvimento do frontend. Estes dados estão localizados no diretório `frontend/data`.

O planejamento futuro inclui a integração com um banco de dados real (como PostgreSQL, MySQL, ou um serviço de BaaS como Firebase). Quando essa integração for realizada, as credenciais de conexão do banco de dados deverão ser adicionadas ao arquivo `.env` para garantir a segurança.

**Exemplo de futuras variáveis para o banco de dados:**
```
DB_HOST=localhost
DB_PORT=5432
DB_USER=seu_usuario
DB_PASSWORD=sua_senha
DB_NAME=marmoraria_db
```
