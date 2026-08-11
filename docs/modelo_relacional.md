# Modelo Relacional de Banco de Dados 2.0 — ERP/CRM/SCM para Marmoraria

## 0. Como Usar Este Documento

1. Esta é a **versão 2.0** do modelo relacional, consolidando `modelo_relacional.md` (v1.0) + os deltas descritos em `Regras_de_Negocio_Consolidado.md` (seção 6) + as decisões de `Regras_MVP_Addendum.md` (seções 2 e 5).
2. **Este documento substitui `modelo_relacional.md` (v1.0) como referência de schema.** Onde houver divergência entre os dois, esta versão prevalece.
3. Em caso de conflito entre este documento e `Regras_de_Negocio_Consolidado.md` sobre uma **regra de negócio** (não apenas nome de campo/tabela), o Consolidado prevalece — este documento é a tradução em schema das regras, não a fonte delas. Encontrou conflito? O schema aqui é que está errado, não o Consolidado.
4. A legenda de status (seção 2) indica o que é MVP agora vs. fase futura. Não indica se a tabela é "válida" — todas fazem parte do desenho completo do sistema, só não têm implementação na mesma sprint.
5. Seção 5 lista pontos de consolidação que ainda precisam de confirmação — trate como pendência, mesmo princípio da seção 9 do Consolidado.

---

## 1. Visão Geral

Modelo relacional único (single-tenant) para o ciclo completo: orçamento, pedido, produção, estoque, patrimônio, financeiro, CRM e notas fiscais. Esta versão incorpora o RBAC de 8 perfis, as duas máquinas de estado do pedido, as etapas de OS parametrizadas por categoria de item, e o recorte de escopo do MVP.

## 2. Legenda de Status de Implementação

| Símbolo | Significado |
|---|---|
| 🟢 | No MVP (construído em `MVP-S0`–`MVP-S5`) |
| 🟡 | Regra confirmada no modelo, implementação adiada para fase futura |
| 🔴 | Fora de escopo / provavelmente redundante — ver seção 5 |

---

## 3. Entidades

### 1. `clientes` 🟢
- id_cliente (PK)
- nome, tipo (PF/PJ), cpf_cnpj, telefone, email
- endereco_id (FK)
- data_cadastro

### 2. `fornecedores` 🟡
- id_fornecedor (PK)
- razao_social, nome_fantasia, cnpj, telefone, email
- endereco_id (FK)
- contato_responsavel

Nota: tabela mantida no schema pois `materiais.fornecedor_id` referencia ela, mas sem tela de gestão de fornecedores no MVP (procurement fora de escopo). Sugestão de implementação: `materiais.fornecedor_id` nullable.

### 3. `enderecos` 🟢
- id_endereco (PK)
- cep, logradouro, numero, bairro, cidade, uf, complemento

### 4. `orcamentos` 🟢
- id_orcamento (PK)
- id_cliente (FK)
- data_criacao, status (rascunho, aprovado, arquivado)
- validade
- desconto_total, valor_frete, forma_pagamento
- observacao

Delta: transição `rascunho → aprovado` acontece **automaticamente na conversão em pedido** (regra 5.3) — não existe gate de aprovação manual do administrador.

### 5. `itens_orcamento` 🟢 ⚠️
- id_item (PK)
- id_orcamento (FK)
- descricao, id_material (FK), qtde, largura, comprimento, area, tipo_acabamento, preco_unitario, subtotal
- **id_categoria (FK → categorias_item)** — delta, Consolidado §6

⚠️ Ver seção 5, item 1 — o editor 2D grid+snap (regra 5.2) pode exigir um campo adicional de geometria aqui que ainda não está no schema.

### 6. `pedidos` 🟢
- id_pedido (PK)
- id_orcamento (FK)
- id_cliente (FK)
- data_aprovacao
- ~~status (aprovado, em_producao, entregue, pago, cancelado, finalizado)~~ — **SUBSTITUÍDO**, ver delta abaixo
- **status_financeiro** enum (pendente, parcial, pago, atrasado, cancelado) — delta, Consolidado §4.1/§6
- **status_operacional** enum (aguardando_producao, em_producao, entregue, montado) — delta, Consolidado §4.1/§6
- contrato_id (FK) — ver nota de redundância, seção 5, item 3
- observacao

`Finalizado` não é um valor armazenado: é condição derivada (`status_operacional` no teto aplicável **E** `status_financeiro = pago`) — regra 4.1.

### 7. `adendos` 🟢
- id_adendo (PK)
- id_pedido (FK)
- data_criacao, status (pendente, aprovado, rejeitado)
- justificativa, documento_aprovacao
- **valor_abatimento** decimal, nullable — delta, Consolidado §6
- **parcela_afetada_id** FK → financeiro, nullable — delta, Consolidado §6

### 8. `producoes` (Ordens de Serviço) 🟢
- id_os (PK)
- id_pedido (FK)
- id_material (FK)
- tipo (produção, entrega, montagem, **decorativa**) — 4º valor incorporado da regra 4.4 (o SQL delta do Consolidado §6 não listou explicitamente, mas a tabela de tipos de OS em §4.4 exige)
- status (criada, em_andamento, bloqueada, cancelada, finalizada) — **derivado/agregado de `etapas_os`**, não editado diretamente pelo GP (regra 4.3)
- responsavel_id (FK usuário)
- data_inicio, data_fim
- ~~checklist_id (FK)~~ — ver nota de redundância, seção 5, item 2

### 9. `checklist_os` 🔴
- id_checklist (PK), id_os (FK), data_validacao, operador_id (FK), observacao

Ver seção 5, item 2 — provável redundância com `etapas_os`. Mantida aqui só para rastreabilidade; recomendo **não implementar** no MVP.

### 10. `materiais` 🟢
- id_material (PK)
- nome, tipo, fornecedor_id (FK, nullable — ver nota tabela 2), preco_padrao_m2
- medidas_padrao, foto_url
- ativo

Escopo MVP: catálogo genérico (decisão D1) — sem exigência de chapa física vinculada.

### 11. `chapas` 🟡
- id_chapa (PK), id_material (FK), largura, comprimento, espessura, localizacao, status (available, partial, consumed, retalho), qr_code, foto_url, data_entrada

Fora do MVP (decisão D1). Mantida no modelo completo para fase futura de estoque físico.

### 12. `retalhos` 🟡 ⚠️
- id_retalho (PK), id_chapa (FK), forma_2d, largura, comprimento, area, status, qr_code, foto_url

Fora do MVP como gestão de estoque (decisão D1). **Mas ver seção 5, item 1** — pode haver sobreposição conceitual com o editor 2D que a decisão D2 manteve dentro do MVP.

### 13. `patrimonio` 🟡
- id_patrimonio (PK), tipo, nome, modelo, fabricante, numero_serie, nf_compra, data_compra, status, localizacao_atual, tag_rfid, foto_url

Fora do MVP.

### 14. `manutencoes_patrimonio` 🟡
- id_manutencao (PK), patrimonio_id (FK), data_manutencao, tipo (preventiva/corretiva), descricao, custo, operador_id (FK usuário)

Fora do MVP.

### 15. `alocacoes_patrimonio` 🟡
- id_alocacao (PK), patrimonio_id (FK), funcionario_id (FK usuário), data_inicio, data_fim, observacao

Fora do MVP.

### 16. `usuarios` 🟢
- id_usuario (PK)
- nome, email
- ~~credencial (administrador, vendedor, gp, operador)~~ — **SUBSTITUÍDO**
- **credencial** enum (administrador, gestor_financeiro, vendedor, gp, motorista, montador, medidor, operador) — delta, Consolidado §2.4
- **especialidade** enum (serrador, acabador) — nullable, só quando credencial = 'operador' — delta, Consolidado §2.4
- **nivel_acabamento** enum (simples, completo) — nullable, só quando especialidade = 'acabador' — delta, Consolidado §2.4
- **comissao_percentual** decimal — regra 5.12, campo já confirmado mas **sem lógica de cálculo no MVP** (dado armazenado, não usado)
- **pin_hash** string, nullable — só quando credencial IN (motorista, montador, medidor); autenticação simplificada, decisão D3 (`Regras_MVP_Addendum.md` §5). Armazenar hash, nunca PIN em texto puro.
- ativo

### 17. `contratos` 🟢
- id_contrato (PK)
- id_pedido (FK)
- arquivo_url, data_assinatura, tipo_assinatura (digital/física/whatsapp), termo_html

### 18. `financeiro` 🟢 (AR vinculado a pedido) / 🔴 (despesas gerais)
- id_lancamento (PK)
- **id_pedido (FK) — NULLABLE** (decisão fechada, Addendum §2: preparar para despesas gerais sem migration futura)
- tipo (receita, despesa), categoria, descricao
- valor, data_vencimento, data_pagamento, forma_pagamento
- status (pendente, pago, atrasado, cancelado)
- **Nenhum campo de aprovação de despesa** (`aprovado_por`, `nivel_aprovacao`, etc.) — decisão fechada, Addendum §2. Adicionar apenas quando o modelo de aprovação for decidido pelo stakeholder, como mudança aditiva.

No MVP, só lançamentos com `id_pedido` preenchido têm fluxo funcional (sinal + parcelas, regra 5.4). Despesas gerais (`id_pedido = null`) ficam fora até a resolução das 3 perguntas pendentes.

### 19. `notas_fiscais` 🟡
- id_nf (PK), id_os (FK), destinatario_tipo (cliente/terceiro), destinatario_id (FK), tipo_nf (NFe, NFSe, NFCe), numero_nf, serie_nf, xml_url, data_emissao, valor_total, status, observacao

Fora do MVP ("fiscal avançado"). Mantida no modelo completo — regra 5.11 já cobre NF parcial e emissão para terceiro para quando for implementada.

### 20. `categorias_item` 🟢 — NOVA (Consolidado §6)
- id_categoria (PK)
- nome (Soleira/Peitoril, Pia/Lavatório/Balcão/Nicho, Pedra Decorativa, Padrão)
- requer_producao (bool)
- requer_montagem (bool)
- tipo_acabamento_requerido enum (simples, completo) — nullable

### 21. `etapas_os` 🟢 — NOVA (Consolidado §6)
- id_etapa (PK)
- id_os (FK)
- nome_etapa (Corte, Acabamento, Checklist de Expedição, Saída para Entrega, Entrega Confirmada, Montagem, Confirmação do Cliente)
- status_etapa enum (não_iniciado, em_andamento, finalizado)
- responsavel_id (FK usuarios) — nullable até alocação
- data_inicio, data_fim

### 22. `medicoes` 🟢 — NOVA (Consolidado §6)
- id_medicao (PK)
- id_orcamento (FK)
- medidor_id (FK usuarios)
- arquivo_url (foto ou PDF)
- data

---

## 4. Relacionamentos Chave

- Cliente → orçamentos, pedidos (1:N, inalterado).
- Orçamento → itens_orcamento, medições (nova).
- Item de orçamento → categoria (`categorias_item`), que determina o fluxo de etapas que a OS herdará (regra 5.5.3).
- Pedido → adendos, produções (OS), lançamentos financeiros (1:N, inalterado).
- **OS → etapas_os (1:N, nova)** — substitui o papel que `checklist_os` ocupava; o status da OS é agregado a partir daqui.
- Chapa → retalhos (mantido no desenho completo; ambos fora do MVP por ora).
- Patrimônio → manutenções, alocações (inalterado, fora do MVP).
- Usuários → responsável em OS, etapas_os, manutenções, alocações, medições.
- Contratos vinculados a pedidos (inalterado).
- Notas fiscais → cliente ou terceiro (mantido no desenho, fora do MVP).
- Adendo → financeiro (`parcela_afetada_id`, nova) para o abatimento cascateado (regra 5.7).

---

## 5. Notas de Consolidação — Pontos Que Precisam de Confirmação

1. **🔴 Crítico — Editor 2D grid+snap (regra 5.2).** O texto está na seção de Orçamento, mas a tabela que tem `forma_2d` no schema original é `retalhos` (estoque, tabela 12). Duas leituras possíveis: (a) o editor desenha a **forma da peça sendo orçada** — e aí `itens_orcamento` precisa de um campo novo de geometria que não existe hoje no schema; ou (b) o editor é o gerenciador de **retalhos de estoque** — e aí, pela decisão D1 (chapas/retalhos fora do MVP), a decisão D2 (manter o editor no MVP) não teria dado de apoio para funcionar no `MVP-S1`. Isso precisa ser resolvido antes de fechar o schema do `MVP-S1` — pergunta ao final desta resposta.
2. `checklist_os` não é referenciado por nenhuma regra do Consolidado além do schema original — `etapas_os` cobre o mesmo papel com mais detalhe (status, responsável, datas). Recomendo tratar como superseded e não implementar no MVP.
3. `pedidos.contrato_id` e `contratos.id_pedido` apontam nos dois sentidos para a mesma relação 1:1 — redundante. Sugestão de implementação (não é regra de negócio): manter só `contratos.id_pedido`, remover `pedidos.contrato_id`.
4. `producoes.status` como derivado (regra 4.3) — recomendo manter a coluna como cache recalculado a cada mudança de etapa (por performance de query), mas deixar explícito no Prisma/service layer que ela nunca é editada diretamente.

---

## 6. Observações e Melhorias Futuras

- `endpoint_rfid` / `equipamentos_epis` seguem como extensões fáceis de adicionar quando RFID for implementado (junto com `patrimonio`, já fora do MVP).
- Campos de log de auditoria em tabelas críticas seguem como módulo pendente (mencionado como área futura do projeto: governança/audit trail).
- Estrutura preparada para tabelas complementares futuras (histórico de comunicações, arquivos anexos, logs de alteração) sem necessidade de redesenho.
