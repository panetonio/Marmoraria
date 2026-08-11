# CLAUDE.md — Instruções do Projeto

## Sobre este projeto

ERP/CRM/SCM para uma marmoraria (fabricação e instalação de mármore/granito), single-tenant. Esta fase de desenvolvimento é o **MVP**: o ciclo operacional completo (orçamento → pedido → produção → entrega → montagem) e o financeiro vinculado a pedido (contas a receber). O módulo de despesas gerais da empresa está **fora desta fase** — não implementar, mesmo que pareça simples.

## Documentos de referência — leia antes de escrever qualquer código

Ordem de prioridade em caso de dúvida:

1. `docs/Regras_MVP_Addendum.md` — o que está dentro/fora **desta fase**. Consulte primeiro para saber se a funcionalidade pedida deve ser construída agora.
2. `docs/Regras_de_Negocio_Consolidado.md` — fonte de verdade de toda regra de negócio, máquinas de estado e RBAC. Prevalece sobre `modelo_relacional.md` em caso de conflito.
3. `docs/modelo_relacional.md` — schema original de referência, para tabelas que o Consolidado não alterou.

## Stack

- Frontend: Next.js (App Router) + React 18 + TypeScript + Tailwind CSS + shadcn/ui
- Backend: Next.js Route Handlers + Prisma ORM
- Banco: PostgreSQL
- Auth: login e senha (ex: Auth.js/NextAuth, credentials provider) para `administrador`, `gestor_financeiro`, `vendedor`, `gp`; **PIN numérico simples** para `motorista`, `montador`, `medidor` (decisão D3 — ver `Regras_MVP_Addendum.md` seção 5)
- Testes: Vitest (unidade) + Playwright (E2E dos fluxos críticos)

## Regras de trabalho — não negociáveis

1. **Limiar de certeza de 90%.** Se você não tem 90% de certeza sobre uma decisão de negócio (não técnica), pare e pergunte antes de codificar. Nunca assuma uma regra de negócio ambígua — essa é a regra 0.3 do documento consolidado e se aplica aqui também.
2. **Subtarefas de 50–150 linhas.** Decomponha qualquer feature grande antes de começar a escrever código. Apresente o plano de subtarefas antes de implementar a primeira.
3. **Comentários de regra de negócio em português**, citando a seção da regra. Exemplo: `// regra 5.4 — GP bloqueado até sinal confirmado pelo financeiro`.
4. **TypeScript estrito.** Proibido usar `any`. Se um tipo for genuinamente desconhecido, use `unknown` e faça o narrowing explícito.
5. **Cobertura de testes > 80%** para lógica de negócio: máquinas de estado (pedido, orçamento, OS, etapas, adendo), cálculo de parcelas, regras de bloqueio (gate do sinal, bloqueio de adendo pós-início).
6. **Um commit por subtarefa concluída**, mensagem descritiva referenciando a seção da regra (ex: `feat: gate do sinal antes de criar OS (regra 5.4)`).
7. **Máquinas de estado implementadas exatamente como especificado** (seção 4 do Consolidado). Não adicionar status intermediários "para facilitar" a UI — se a UI precisar de um estado derivado, calcule, não armazene.
8. **Nunca implemente algo listado como "Fora" no addendum**, mesmo que a tabela já exista em `modelo_relacional.md` (ex: `financeiro` como despesa geral, comissão de operador, chapas/retalhos/patrimônio — decisão D1).

## Definition of Done por tarefa

- Código implementa a regra exatamente como descrita na seção referenciada — sem interpretação livre.
- Testes cobrindo o caminho feliz e pelo menos um caminho de bloqueio/erro da regra.
- Nenhum `any`, `// @ts-ignore` sem justificativa em comentário.
- Comentário de regra de negócio presente em qualquer trecho que implemente uma máquina de estado ou um gate.
- Commit feito, mensagem referenciando a seção da regra.

## Quando algo não estiver claro

Pare e liste as opções (estilo múltipla escolha, como o restante deste projeto foi discovery-driven) em vez de escolher sozinho. Se a dúvida for sobre escopo (dentro/fora do MVP), a resposta provavelmente já está em `docs/Regras_MVP_Addendum.md` seção 1 — confira antes de perguntar.
