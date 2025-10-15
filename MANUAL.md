# Manual do Usuário - Marmoraria ERP

Bem-vindo ao Marmoraria ERP, seu sistema completo para gerenciar todas as operações da sua empresa de forma integrada e eficiente. Este manual foi criado para guiar você através das principais funcionalidades do sistema.

## 1. Primeiros Passos

### 1.1. Visão Geral da Interface

A interface do sistema é dividida em três áreas principais:

1.  **Barra Lateral (Esquerda):** Seu principal menu de navegação. Clique nos ícones para acessar os diferentes módulos do sistema (Dashboard, Orçamentos, Produção, etc.).
2.  **Cabeçalho (Topo):** Contém ferramentas rápidas como a Busca Global, a troca de tema (claro/escuro) e o seletor de usuário.
3.  **Área de Conteúdo (Central):** Onde todas as informações e funcionalidades do módulo selecionado são exibidas.

### 1.2. Simulação de Usuário

No canto superior direito, você encontrará um seletor de "Usuário Simulado". Esta ferramenta permite que você veja o sistema da perspectiva de diferentes cargos (Administrador, Vendedor, Produção). É útil para entender as permissões de cada um e para treinamento.

### 1.3. Busca Global

A barra de busca no cabeçalho é uma ferramenta poderosa. Comece a digitar o ID de um pedido (ex: `PED-2024-001`), o nome de um cliente ou o número de uma nota fiscal para encontrar rapidamente o que você precisa, sem precisar navegar pelos menus.

---

## 2. Módulos Principais

A seguir, uma descrição detalhada de cada módulo disponível na barra lateral.

### 2.1. Dashboard

Esta é a sua tela inicial. Ela oferece uma visão geral e rápida da saúde do seu negócio, com indicadores chave como:
*   **Faturamento Mensal:** Total de vendas no mês corrente.
*   **Ticket Médio:** Valor médio por pedido.
*   **Orçamentos em Aberto:** Quantidade de propostas aguardando resposta.
*   **Ordens em Produção:** Quantidade de pedidos que estão sendo fabricados.

### 2.2. CRM (Gestão de Clientes)

Este módulo centraliza todo o relacionamento com seus clientes.

*   **Clientes:** Visualize, cadastre e edite as informações de todos os seus clientes. Clique em "Ver Detalhes" para acessar um histórico completo de interações, incluindo orçamentos, pedidos e anotações.
*   **Pipeline:** Um quadro no estilo Kanban para gerenciar suas oportunidades de venda. Arraste os cards entre as colunas (`Novo`, `Contatado`, `Negociação`, etc.) para atualizar o status de cada negociação.
*   **Agenda:** Visualize todos os compromissos agendados, como medições, instalações ou reuniões de acompanhamento.

### 2.3. Orçamentos

Crie e gerencie todas as suas propostas comerciais aqui.

*   **Para criar um novo orçamento:** Clique no botão "Novo Orçamento".
*   **Preenchimento:**
    1.  Selecione um cliente existente ou digite as informações de um novo.
    2.  Na seção "Itens", adicione os produtos. Você pode escolher entre:
        *   **Material:** Selecione a pedra, insira as medidas (largura e altura) ou use o **Designer Visual** para peças com formatos customizados.
        *   **Serviço:** Adicione serviços como "Corte Reto" ou "Instalação".
        *   **Produto:** Inclua itens de revenda, como cubas e torneiras.
    3.  O sistema calcula os totais automaticamente.
*   **Ações:** Após preencher, você pode "Salvar Rascunho", "Salvar e Enviar" (marcando-o como enviado ao cliente) ou "Aprovar" para convertê-lo diretamente em um Pedido.
*   **Otimizador de Corte:** Para orçamentos com muitas peças de um mesmo material, use esta ferramenta para visualizar o melhor aproveitamento da chapa e calcular a perda.

### 2.4. Pedidos

Esta tela lista todos os orçamentos que foram aprovados pelos clientes.

*   **Função Principal:** A principal ação aqui é gerar as **Ordens de Serviço (OS)** para a produção.
*   **Como gerar uma OS:**
    1.  Encontre o pedido na lista.
    2.  Clique no botão "Gerar OS".
    3.  Uma janela aparecerá com os itens do pedido que ainda não foram para a produção.
    4.  Selecione os itens que farão parte desta OS e defina a data de entrega.
    *Você pode gerar múltiplas OS para um único pedido, ideal para entregas parciais.*

### 2.5. Produção

Acompanhe o andamento de cada Ordem de Serviço (OS) na fábrica.

*   **Visão Kanban:** O painel é dividido em colunas que representam as etapas da produção (`Em Corte`, `Em Acabamento`, `Em Montagem`, etc.).
*   **Atualizar Status:** Para mover uma OS para a próxima etapa, simplesmente **clique e arraste** o card da OS para a coluna desejada. Uma confirmação será solicitada para evitar erros.
*   **Alocar Recursos:** Clique no botão "Alocar" em um card para designar quais profissionais (cortador, acabador) são responsáveis por aquela OS.

### 2.6. Estoque

Gerencie suas chapas e retalhos de forma individual e inteligente.

*   **Visualização:** Cada card representa uma chapa ou retalho físico no seu pátio.
*   **Alertas de Estoque:** O sistema exibe um alerta no topo da página quando o estoque total de um material (ex: "Granito Preto Absoluto") está abaixo do mínimo definido.
*   **Detalhes e QR Code:** Clique em uma chapa para ver todos os detalhes (dimensões, localização, foto). Nesta tela, você também pode **imprimir uma etiqueta com QR Code** para colar na chapa física, facilitando a identificação e o controle no pátio.

### 2.7. Fornecedores

Centralize as informações de todos os seus fornecedores.

*   **Cadastro:** Adicione, visualize e edite os dados dos seus fornecedores.
*   **Gerar Recibo:** Ao fazer um pagamento a um fornecedor, clique no botão "Gerar Recibo". Preencha o valor e a descrição do pagamento para gerar um arquivo PDF pronto para impressão e assinatura, já com um identificador único.

### 2.8. Faturamento

Gere e controle as Notas Fiscais (NF) para os seus pedidos.

1.  Clique em "Gerar Nota Fiscal".
2.  Selecione na lista o pedido que deseja faturar.
3.  O sistema preencherá os dados automaticamente.
4.  Você pode salvar a nota como "Pendente" ou simular a emissão, alterando seu status para "Emitida".

### 2.9. Financeiro

Tenha um controle completo sobre as finanças da empresa.

*   **Contas:** Visualize todas as suas contas a pagar e a receber. Quando uma conta pendente for paga, clique no botão "Marcar como Pago" para registrar a transação.
*   **Fluxo de Caixa:** Veja uma projeção das suas entradas e saídas para os próximos 30 dias, ajudando no planejamento financeiro.
*   **Relatórios:** Gere relatórios detalhados de **entradas (vendas)** e **saídas (pagamentos)**. Use os filtros "Hoje", "7 dias" e "Mês" para analisar a performance financeira em diferentes períodos.

---

## 3. Suporte

Caso encontre algum problema ou tenha dúvidas que não foram respondidas neste manual, entre em contato com o suporte técnico.
*   **Email:** suporte@empresa.com
*   **Telefone:** (99) 99999-9999
