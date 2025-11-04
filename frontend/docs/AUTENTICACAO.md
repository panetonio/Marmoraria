# Sistema de Autenticação e Gerenciamento de Usuários

## 📋 Visão Geral

Foi implementado um sistema completo de autenticação e gerenciamento de usuários no sistema da Marmoraria ERP.

## 🔐 Funcionalidades Implementadas

### 1. Sistema de Login e Cadastro
- **Tela de Login**: Interface moderna para autenticação de usuários
- **Tela de Cadastro**: Permite criar novas contas com diferentes níveis de acesso
- **Autenticação Persistente**: O login é mantido mesmo após fechar o navegador
- **Logout Seguro**: Botão de logout visível no header

### 2. Gerenciamento de Usuários
Uma página completa de administração de usuários com as seguintes funcionalidades:

#### Criar e Editar Usuários
- Nome completo
- Email (único no sistema)
- Senha
- Cargo (Admin, Vendedor, Produção, Aux. Administrativo)

#### Ações sobre Usuários
- ✏️ **Editar**: Modificar informações do usuário
- ⚙️ **Gerenciar Permissões**: Definir acesso personalizado às páginas
- 🔄 **Ativar/Desativar**: Bloquear ou desbloquear acesso do usuário
- 🗑️ **Excluir**: Remover usuário do sistema

#### Permissões Personalizadas
- Por padrão, usuários têm acesso às páginas definidas pelo seu cargo
- Administradores podem personalizar o acesso de cada usuário
- Possível selecionar páginas específicas que o usuário pode acessar
- Exemplo: Um vendedor pode ter acesso apenas a CRM e Fornecedores

### 3. Controle de Acesso às Páginas
- Cada página agora verifica se o usuário tem permissão de acesso
- Usuários sem permissão são redirecionados automaticamente
- Menu lateral mostra apenas as páginas que o usuário pode acessar

## 📱 Páginas Disponíveis para Controle

As seguintes páginas podem ser controladas individualmente:

- Dashboard
- Orçamentos (Quotes)
- Pedidos (Orders)
- Produção (Production)
- Logística (Logistics)
- Estoque (Stock)
- Catálogo (Catalog)
- Fornecedores (Suppliers)
- CRM
- Financeiro (Finance)
- Notas Fiscais (Invoices)
- Recibos (Receipts)
- **Usuários (Users)** - Nova página!

## 👤 Credenciais Padrão

### Usuário Administrador
- **Email**: `admin@marmoraria.com`
- **Senha**: `admin123`

Este usuário tem acesso total ao sistema, incluindo o gerenciamento de usuários.

## 🚀 Como Usar

### Fazer Login
1. Acesse o sistema
2. Digite seu email e senha
3. Clique em "Entrar"

### Criar uma Conta
1. Na tela de login, clique em "Criar conta"
2. Preencha os dados solicitados
3. Escolha o cargo apropriado
4. Clique em "Criar Conta"

### Gerenciar Usuários (Apenas Admin)
1. Faça login com uma conta de administrador
2. Acesse "Usuários" no menu lateral
3. Use os botões para criar, editar, ativar/desativar ou excluir usuários

### Personalizar Permissões
1. Na página de Usuários, clique no ícone de engrenagem (⚙️) do usuário
2. Selecione as páginas que o usuário pode acessar
3. Clique em "Salvar Permissões"
4. Para remover personalizações, clique em "Limpar Personalizações"

## 🔧 Detalhes Técnicos

### Arquivos Criados/Modificados

#### Novos Arquivos:
- `context/AuthContext.tsx` - Gerenciamento de autenticação
- `pages/LoginPage.tsx` - Tela de login
- `pages/RegisterPage.tsx` - Tela de cadastro
- `pages/UsersPage.tsx` - Gerenciamento de usuários

#### Arquivos Modificados:
- `App.tsx` - Integração com autenticação e proteção de rotas
- `types.ts` - Novo tipo `AuthUser` e atualização do tipo `Page`
- `roles.ts` - Adicionada permissão `manage_users`
- `components/Sidebar.tsx` - Atualizado para usar autenticação e mostrar link de Usuários
- `components/Breadcrumbs.tsx` - Adicionado label para página de Usuários
- `constants.ts` - Adicionado ícone de usuários

### Armazenamento de Dados
- Os dados são armazenados no **localStorage** do navegador
- Chave `marmoraria_users`: Lista de todos os usuários
- Chave `marmoraria_auth`: Informações de autenticação do usuário logado

### Segurança
⚠️ **IMPORTANTE**: Este é um sistema de demonstração. Para produção, você deve:
- Implementar hash de senhas (bcrypt, argon2, etc.)
- Usar um backend real com banco de dados
- Implementar tokens JWT
- Adicionar autenticação de dois fatores
- Implementar rate limiting para evitar ataques de força bruta

## 📊 Estrutura de Permissões

### Por Cargo Padrão:

#### Administrador
- Acesso total a todas as páginas
- Pode gerenciar outros usuários
- Pode personalizar permissões de qualquer usuário

#### Vendedor
- Dashboard, Orçamentos, Pedidos, CRM, Estoque

#### Produção
- Dashboard, Pedidos, Produção, Logística, Estoque, Fornecedores

#### Auxiliar Administrativo
- Dashboard, Orçamentos (visualização), Pedidos, Logística, Fornecedores, CRM, Financeiro, Notas Fiscais, Recibos, Catálogo

### Permissões Personalizadas
Administradores podem sobrescrever as permissões padrão e dar acesso específico a qualquer página para qualquer usuário.

## 🎨 Interface

### Tela de Login
- Design moderno com gradiente
- Campo de email e senha
- Link para criar conta
- Credenciais padrão visíveis para facilitar primeiro acesso

### Tela de Gerenciamento
- Busca por nome ou email
- Cards informativos para cada usuário
- Badges visuais indicando status e permissões customizadas
- Modais intuitivos para edição e gestão de permissões

## 💡 Exemplos de Uso

### Cenário 1: Novo Vendedor
1. Admin cria usuário com cargo "Vendedor"
2. Vendedor tem acesso automático a: Dashboard, Orçamentos, Pedidos, CRM, Estoque

### Cenário 2: Acesso Personalizado
1. Admin cria usuário com cargo "Vendedor"
2. Admin acessa gerenciamento de permissões
3. Admin seleciona apenas "CRM" e "Fornecedores"
4. Vendedor agora só vê essas duas páginas no menu

### Cenário 3: Desativação Temporária
1. Admin desativa usuário
2. Usuário não consegue mais fazer login
3. Admin pode reativar quando necessário

## 🔄 Fluxo de Autenticação

```
1. Usuário acessa sistema → Tela de Login
2. Insere credenciais → Validação
3. Login bem-sucedido → Carrega dados do usuário
4. Verifica permissões → Mostra menu personalizado
5. Tenta acessar página → Verifica permissão
6. Acesso autorizado → Renderiza página
```

## 📝 Notas Importantes

1. O primeiro usuário do sistema é sempre o admin padrão
2. Não é possível excluir o usuário admin padrão (user-1)
3. Usuários desativados não aparecem no sistema de autenticação
4. Permissões customizadas têm prioridade sobre permissões de cargo
5. Todos os dados são salvos automaticamente no navegador

## 🆘 Solução de Problemas

### Não consigo fazer login
- Verifique se o email está correto
- Verifique se a senha está correta
- Tente usar as credenciais padrão do admin
- Verifique se o usuário não foi desativado

### Não vejo a página de Usuários
- Apenas administradores têm acesso a esta página
- Faça login com a conta de admin padrão

### Esqueci a senha
- Atualmente não há recuperação de senha
- Um administrador pode editar sua conta e definir uma nova senha

### Perdi acesso ao admin
- Limpe o localStorage do navegador
- O sistema criará automaticamente o usuário admin padrão novamente

Para limpar o localStorage:
```javascript
// No console do navegador (F12)
localStorage.removeItem('marmoraria_users');
localStorage.removeItem('marmoraria_auth');
location.reload();
```

## 🎯 Próximos Passos Recomendados

Para tornar este sistema pronto para produção:

1. **Backend Real**
   - Implementar API REST ou GraphQL
   - Banco de dados (PostgreSQL, MySQL, MongoDB)

2. **Segurança Avançada**
   - Hash de senhas com bcrypt
   - Tokens JWT para autenticação
   - Refresh tokens
   - HTTPS obrigatório
   - Rate limiting

3. **Funcionalidades Adicionais**
   - Recuperação de senha por email
   - Autenticação de dois fatores (2FA)
   - Log de atividades dos usuários
   - Histórico de permissões
   - Expiração de sessão

4. **Auditoria**
   - Registro de todas as ações dos usuários
   - Alertas de tentativas de acesso não autorizado
   - Relatórios de uso do sistema

---

**Desenvolvido para**: Sistema Marmoraria ERP - Gestão Integrada
**Data**: 2024

