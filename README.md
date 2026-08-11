# Marmoraria ERP/CRM/SCM

> Status: 🚧 Em desenvolvimento — MVP (Fase 1)

Sistema de gestão completo para uma marmoraria (fabricação e instalação de mármore/granito): ERP + CRM + SCM cobrindo o ciclo operacional inteiro, da medição em campo até a montagem final, com controle de acesso por perfil, comissionamento e integrações fiscais/WhatsApp planejadas. Aplicação **single-tenant**, uso exclusivo desta empresa.

## Fase atual: MVP

Esta fase entrega o ciclo operacional completo — **orçamento → pedido → produção → entrega → montagem** — e o financeiro vinculado a pedido (contas a receber). O módulo de despesas gerais da empresa está fora desta fase, aguardando decisão do stakeholder sobre modelo de aprovação. Escopo completo em [`docs/Regras_MVP_Addendum.md`](docs/Regras_MVP_Addendum.md).

## Stack

| Camada | Tecnologia |
|---|---|
| Frontend | Next.js (App Router) + React 18 + TypeScript + Tailwind CSS + shadcn/ui |
| Backend | Next.js Route Handlers + Prisma ORM |
| Banco de dados | PostgreSQL |
| Autenticação | Login/senha (perfis administrativos) + PIN numérico (perfis de campo) |
| Testes | Vitest (unidade) + Playwright (E2E) |

## Estrutura do repositório

```
marmoraria-mvp/
├── CLAUDE.md                                   # instruções de projeto para o Claude Code
├── README.md
├── docs/
│   ├── Regras_de_Negocio_Consolidado.md        # fonte de verdade das regras de negócio
│   ├── Regras_MVP_Addendum.md                  # escopo desta fase (dentro x fora)
│   ├── Guia_Desenvolvimento_MVP_ClaudeCode.md  # passo a passo de execução por sprint
│   └── modelo_relacional.md                    # schema relacional original de referência
├── prisma/
│   └── schema.prisma
├── src/
│   ├── app/
│   ├── components/
│   ├── lib/
│   └── server/                                 # regras de negócio / use-cases, separado da UI
└── tests/
```

## Documentação — onde procurar o quê

| Pergunta | Documento |
|---|---|
| "Qual é a regra de negócio disso?" | `docs/Regras_de_Negocio_Consolidado.md` |
| "Isso está dentro do MVP?" | `docs/Regras_MVP_Addendum.md` |
| "Como desenvolvo o próximo sprint?" | `docs/Guia_Desenvolvimento_MVP_ClaudeCode.md` |
| "Como era o schema antes das mudanças do MVP?" | `docs/modelo_relacional.md` |
| "Quais são as convenções de código deste projeto?" | `CLAUDE.md` |

Em caso de conflito entre documentos, a ordem de prevalência é: `Regras_MVP_Addendum.md` → `Regras_de_Negocio_Consolidado.md` → `modelo_relacional.md`.

## Como rodar localmente

```bash
git clone <url-do-repo>
cd marmoraria-mvp
npm install

docker compose up -d          # sobe o Postgres local
cp .env.example .env          # ajuste DATABASE_URL se necessário

npx prisma migrate dev
npx prisma db seed

npm run dev
```

## Roadmap do MVP

| Sprint | Entrega | Status |
|---|---|---|
| `MVP-S0` | Fundação — schema, RBAC, auth (senha + PIN), seed | ⬜ |
| `MVP-S1` | Orçamento — clientes, itens, editor grid+snap | ⬜ |
| `MVP-S2` | Aceite, conversão em pedido, sinal e parcelas | ⬜ |
| `MVP-S3` | Produção — OS e kanban | ⬜ |
| `MVP-S4` | Expedição, entrega e montagem | ⬜ |
| `MVP-S5` | Adendos, dashboards por perfil, preparação da demo | ⬜ |

Detalhes de cada sprint (tabelas, regras, definição de pronto) em [`docs/Guia_Desenvolvimento_MVP_ClaudeCode.md`](docs/Guia_Desenvolvimento_MVP_ClaudeCode.md).

## Perfis de usuário (RBAC)

| Perfil | Acesso |
|---|---|
| `administrador`, `gestor_financeiro`, `vendedor`, `gp` | Login e senha |
| `motorista`, `montador`, `medidor` | PIN numérico simples |
| `operador` (`serrador`, `acabador`) | Sem login — alocado por outros perfis |

Detalhes completos de permissões e dashboards em `docs/Regras_de_Negocio_Consolidado.md` §2 e §7.

## Fora de escopo nesta fase

Despesas gerais, comissionamento de operadores, procurement, emissão fiscal real, integração WhatsApp real, estoque de chapas/retalhos/patrimônio. Lista completa e justificativa em `docs/Regras_MVP_Addendum.md` §1.

## Metodologia

Desenvolvimento guiado por documentação: nenhuma ambiguidade de negócio é resolvida por suposição — é levantada e decidida antes de virar código. As convenções de trabalho com o Claude Code (limiar de certeza, decomposição de tarefas, cobertura de testes) estão em `CLAUDE.md`.
