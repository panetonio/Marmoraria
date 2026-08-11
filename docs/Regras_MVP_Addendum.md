# Addendum MVP — Escopo da Fase 1 de Desenvolvimento

## 0. Como Usar Este Documento

1. Este addendum **estende** `Regras_de_Negocio_Consolidado.md` — não substitui nenhuma regra dele, apenas delimita **quando** cada parte entra em produção.
2. Onde este documento for omisso sobre uma regra de negócio, `Regras_de_Negocio_Consolidado.md` continua sendo a fonte de verdade.
3. Mesmo princípio de trabalho do documento consolidado (seção 0.3): se o Claude Code encontrar uma lacuna de escopo não coberta aqui, **para e pergunta** — não assume que algo está dentro ou fora do MVP.
4. Motivação: o módulo financeiro geral (despesas da empresa) está com 3 decisões de negócio pendentes de resposta do stakeholder. Este addendum define um recorte que **não depende** dessas respostas, para destravar desenvolvimento e produzir uma demo funcional do ciclo operacional completo.
5. Nomenclatura de sprints deste addendum usa prefixo `MVP-S` (MVP-S0, MVP-S1...) para não colidir com a numeração de `Roadmap_Sprints_ERP_Marmoraria.md` (Sprint 0–13). Quando o roadmap completo for retomado, reconciliar as duas numerações.

---

## 1. Escopo do MVP — Dentro x Fora

| Módulo | Status | Referência no Consolidado | Nota |
|---|---|---|---|
| Medição (pré-orçamento) | **Dentro** | 5.1 | Upload simples de foto/PDF |
| Orçamento e itens | **Dentro** | 5.2, 4.2 | Editor 2D grid+snap simplificado confirmado (decisão D2) — aumenta a complexidade de UI do MVP-S1 |
| Categorias de item | **Dentro** | 5.2, tabela `categorias_item` | |
| Aceite e conversão em pedido | **Dentro** | 5.3 | Contrato automático ≥R$10k incluso |
| Financeiro — sinal e parcelas (AR vinculado a pedido) | **Dentro** | 5.4, 4.1 | Já 100% especificado |
| Financeiro — despesas gerais da empresa | **Fora** | — | Bloqueado pelas 3 perguntas em aberto (seção 4) |
| Produção — criação de OS e kanban | **Dentro** | 5.5, 5.6, 4.3–4.5 | |
| Adendos | **Dentro** | 5.7 | Candidato a corte se o cronograma apertar — ver seção 3 |
| Expedição e entrega | **Dentro** | 5.8 | |
| Montagem | **Dentro** | 5.9 | Fecha o ciclo completo p/ a demo |
| Estoque de chapas/retalhos e patrimônio | **Fora do MVP** | 5.10 | Decisão D1 confirmada: catálogo genérico de `materiais` permanece (usado em `itens_orcamento`); chapas físicas, QR code, retalhos e patrimônio ficam para depois |
| Fiscal (emissão real de NF) | **Fora** | 5.11 | "Invoicing avançado" — fica como tela estática/placeholder se necessário |
| Comissão de vendedor (cálculo) | **Fora** | 5.12 | Dashboard mostra volume, sem cálculo de comissão nesta fase |
| Comissão de operadores | **Fora** | Seção 8 do Consolidado | Explicitamente fora, aguarda reconciliação de perfis |
| Conciliação bancária | **Dentro (trivial)** | 5.13 | É manual por definição — nada a construir além da baixa de parcela |
| WhatsApp Business API | **Fora (stub)** | 5.14 | Sem integração real; no máximo um botão de compartilhar link |
| Procurement/fornecedores | **Fora** | — | Não documentado ainda, fora por definição |

---

## 2. Decisões de Schema Já Fechadas

Aplicar desde o `MVP-S0` (fundação), mesmo com o módulo de despesas gerais fora do MVP:

- **`financeiro.id_pedido` permanece nullable** — mesmo que 100% dos lançamentos do MVP tenham pedido vinculado, a coluna já nasce preparada para despesas gerais (sem FK obrigatória), evitando migração destrutiva depois.
- **Nenhum campo relacionado a aprovação de despesa é criado agora** (ex: `aprovado_por`, `nivel_aprovacao`, `limite_valor`). Quando o modelo de aprovação for decidido, esses campos são adicionados como mudança aditiva — não retrofit.

## 3. Adendos: Dentro do MVP, Mas com Corte Autorizado

A regra 5.7 (adendos) está no escopo, mas é o item de menor impacto para "mostrar o ciclo completo funcionando". Se o cronograma apertar entre `MVP-S4` e a data da demo, este é o módulo a cortar primeiro sem reabrir discussão — o ciclo orçamento→pedido→produção→entrega→montagem continua demonstrável sem ele.

## 4. As 3 Perguntas do Financeiro Geral (para referência — continuam bloqueadas)

1. Modelo de aprovação de despesa (nenhum / por valor / por categoria).
2. Despesas fixas recorrentes: geração automática mensal ou lançamento manual.
3. Toda despesa precisa de fornecedor cadastrado, ou aceita lançamento avulso.

Nenhuma delas bloqueia o MVP. Continuam pendentes de resposta do stakeholder, tratadas fora deste addendum.

## 5. Decisões de Implementação — Resolvidas

| # | Decisão | Resolução | Onde afeta |
|---|---|---|---|
| D1 | Estoque de chapas/retalhos | **Fora do MVP.** `materiais` continua existindo como catálogo genérico (sem chapa física, QR, retalho, patrimônio) | 5.10 |
| D2 | Medidas de peça no orçamento | **Editor grid+snap simplificado mantido**, conforme já descrito em 5.2 (formas em "L"/"U", sem desenho vetorial livre) | 5.2, `MVP-S1` |
| D3 | Autenticação de motorista/montador/medidor | **PIN numérico simples** por usuário — sem senha completa, sem link mágico/integração externa | 2.2, `MVP-S0` |

Nenhuma decisão de escopo segue pendente para começar o `MVP-S0`.

## 6. Definição de "Pronto" do MVP (demo-ready)

O MVP está pronto para ser mostrado ao stakeholder quando:

- Um pedido de cliente percorre o ciclo completo clicável: orçamento → aceite/conversão → sinal confirmado → OS criada → kanban de produção → expedição → entrega confirmada → (montagem, se aplicável) → condição "Finalizado" calculada corretamente.
- Os 7 perfis com login (seção 2.2 do Consolidado) conseguem logar e ver seu dashboard correspondente (tabela 7).
- O gate financeiro (5.4 — GP bloqueado até sinal confirmado) está funcionando de verdade, não simulado.
- Existe dado de seed realista (cliente, material, orçamento de exemplo) para não improvisar durante a demo.
- O sistema está acessível por um link, não só rodando localmente na máquina do desenvolvedor.
