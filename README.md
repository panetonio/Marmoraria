# Marmoraria ERP - Gestão Integrada

Bem-vindo ao Marmoraria ERP, um sistema de gestão interno (ERP) robusto e centralizado, projetado para otimizar todas as operações de uma marmoraria.

Este documento fornece as instruções necessárias para configurar e executar o projeto em um ambiente de desenvolvimento.

## 🚀 Começando

Siga os passos abaixo para colocar a aplicação em funcionamento.

### 1. Pré-requisitos

Certifique-se de ter o [Node.js](https://nodejs.org/) (versão 18 ou superior) instalado em sua máquina. A instalação do Node.js também inclui o `npm`, o gerenciador de pacotes que usaremos.

### 2. Instalação

Primeiro, instale todas as dependências do projeto. No diretório raiz do projeto, execute o seguinte comando:

```bash
npm install
```

Este comando irá baixar e instalar todas as bibliotecas e pacotes necessários para a aplicação funcionar corretamente.

### 3. Variáveis de Ambiente

Algumas funcionalidades do ERP, como integrações com APIs externas, podem exigir chaves de API. Crie um arquivo chamado `.env` na raiz do projeto para armazenar essas chaves.

**Exemplo de `.env`:**
```
API_KEY=SUA_CHAVE_DE_API_AQUI
```
*A aplicação está configurada para ler a variável `API_KEY` do ambiente para integrações com serviços de IA.*

### 4. Executando a Aplicação

Após a instalação das dependências, você pode iniciar o servidor de desenvolvimento:

```bash
npm run dev
```

Este comando iniciará a aplicação em modo de desenvolvimento. Você poderá acessá-la em `http://localhost:5173` (ou a porta indicada no seu terminal).

---

## 🔮 Futuras Configurações

### Conexão com Banco de Dados

Atualmente, o projeto utiliza dados estáticos (mock data) para facilitar o desenvolvimento do frontend. Estes dados estão localizados no diretório `/data`.

O planejamento futuro inclui a integração com um banco de dados real (como PostgreSQL, MySQL, ou um serviço de BaaS como Firebase). Quando essa integração for realizada, as credenciais de conexão do banco de dados deverão ser adicionadas ao arquivo `.env` para garantir a segurança.

**Exemplo de futuras variáveis para o banco de dados:**
```
DB_HOST=localhost
DB_PORT=5432
DB_USER=seu_usuario
DB_PASSWORD=sua_senha
DB_NAME=marmoraria_db
```
