# Regras de Negócio Consolidadas — ERP/CRM/SCM Marmoraria
 
## 0. Como Usar Este Documento
 
Este é o documento de **fonte única de verdade** sobre regras de negócio e fluxo de trabalho do sistema, resultado de um processo de análise de lacunas e resolução de ambiguidades. Foi escrito para ser lido por outra instância de IA que vai **retomar** o desenvolvimento sem acesso ao histórico da conversa original.
 
**Regras de leitura:**
1. Este documento **substitui** trechos conflitantes da documentação técnica original (`modelo-relacional.md`, `Fluxo de trabalho e regras de negocio.md`, `UI e UX.md`). Onde houver conflito, **este documento prevalece**.
2. Onde este documento for omisso, a documentação original permanece válida como referência complementar (ex: schema completo de tabelas não alteradas).
3. **Princípio de trabalho do projeto:** nenhuma decisão técnica deve ser tomada sobre uma ambiguidade de negócio. Se você (IA) encontrar uma lacuna não coberta aqui, **pare e pergunte** ao usuário — não assuma. Esse foi o método usado para chegar a este documento e deve ser mantido.
4. Documentos relacionados no mesmo projeto: `Roadmap_Sprints_ERP_Marmoraria.md` (Fase 2 já iniciada — 14 sprints, Sprint 0 a 13, com dependências mapeadas).
5. Seção 9 lista o que está **assumido mas não explicitamente confirmado** — trate como pendências, não como fato encerrado.
---
 
## 1. Visão Geral do Sistema
 
Aplicação web **single-tenant**, exclusiva para uma marmoraria específica (sem necessidade de arquitetura multiempresa). Integra ERP + CRM + SCM cobrindo o ciclo completo desde a medição em campo até a montagem final, com acesso via desktop e mobile (scan de QR Code).
 
---
 
## 2. Perfis de Usuário (RBAC)
 
### 2.1 Mudança em relação ao modelo original
 
O `modelo-relacional.md` original define `usuarios.credencial` com 4 valores. Isso está **substituído** pela tabela abaixo (8 valores, extensão do enum original — mantém `administrador`, `vendedor`, `gp`; renomeia o uso de `operador` para cobrir apenas recursos de chão de fábrica; adiciona 4 novos).
 
### 2.2 Perfis com login ativo
 
| Credencial | Função Principal | Observações |
|---|---|---|
| `administrador` | Acesso total, aprova cancelamentos de pedido | Único perfil que cancela pedidos |
| `gestor_financeiro` | Dá baixa em parcelas, emite NF, concilia banco | Baixa de pagamento também permitida a `administrador` |
| `vendedor` | Cria orçamento, converte pedido (< R$10k), define % de sinal | Dashboard mostra **volume de vendas**, não valor de comissão |
| `gp` (Gestor de Produção) | Cria OS, aloca recursos, avança kanban de produção | Bloqueado de criar OS até sinal confirmado (ver 5.4) |
| `motorista` | Opera fila de entrega, confirma recebimento | Login simplificado |
| `montador` | Executa checklist de montagem | Login simplificado |
| `medidor` | Upload de fotos/PDF de projeto, atua **antes** do orçamento | Login simplificado — mesmo padrão de motorista/montador |
 
**Não haverá portal para Cliente/Fornecedor.** Decisão explícita de simplificação — não construir autenticação nem telas para esse público.
 
### 2.3 Recursos alocáveis SEM login (existem em `usuarios`, mas sem acesso ao sistema)
 
| Credencial | Especialidade | Alocado em | Observação |
|---|---|---|---|
| `operador` | `serrador` | Etapa Corte | Produtividade quantificada via alocação na OS |
| `operador` | `acabador` | Etapa Acabamento | Ver hierarquia de capacidade abaixo |
 
**Regra de capacidade do Acabador:** `nivel_acabamento` tem dois valores (`simples`, `completo`). Um acabador com `nivel_acabamento = completo` **também atende** demandas de `simples` (hierárquico, não é match exato — ao alocar um acabador para uma etapa que requer "simples", o sistema deve listar acabadores com nível simples OU completo).
 
### 2.4 Delta no modelo de dados — tabela `usuarios`
 
```
usuarios.credencial: enum (administrador, gestor_financeiro, vendedor, gp, motorista, montador, medidor, operador)
usuarios.especialidade: enum (serrador, acabador) — nullable, só quando credencial = 'operador'
usuarios.nivel_acabamento: enum (simples, completo) — nullable, só quando especialidade = 'acabador'
usuarios.comissao_percentual: decimal — configurável individualmente por vendedor
```
 
---
 
## 3. Fluxo Macro do Pedido (sequência)
 
```
1. Medição (opcional, pré-orçamento)         [medidor]
2. Orçamento — criação com itens             [vendedor]
3. Aceite do cliente                         [cliente + vendedor/admin]
4. Conversão em Pedido                       [regra por valor — ver 5.3]
5. Geração automática de parcelas + sinal    [sistema]
6. Confirmação do sinal                      [gestor_financeiro] ← GATE
7. Criação de OS(s)                          [gp]
8. Execução do kanban de produção            [gp + serrador/acabador alocados]
9. Checklist de expedição → entrega          [motorista]
10. Checklist de montagem (se aplicável)     [montador]
11. Pedido "Finalizado" (condição derivada — ver 4.1)
```
 
> ⚠️ **Mudança de regra crítica em relação ao documento original:** o texto original descreve "Aprovação que converte orçamentos em pedidos", sugerindo um gate de aprovação do administrador. **Essa aprovação NÃO existe mais.** O vendedor tem autonomia total para converter (respeitando as regras de valor da seção 5.3). O único gate real do fluxo é o **financeiro confirmando o sinal antes da produção começar** (passo 6 acima).
 
---
 
## 4. Máquinas de Estado
 
### 4.1 Pedido — dois status independentes (substitui o status único do modelo original)
 
```
status_financeiro:   pendente → parcial → pago
                                   ↘ atrasado
                      (cancelado — via administrador)
 
status_operacional:  aguardando_producao → em_producao → entregue → montado
                      (montado só é alcançável se o pedido contém item que requer montagem;
                       caso contrário, "entregue" é o teto operacional)
```
 
**"Finalizado" é uma condição derivada, não um status armazenado:**
> `Finalizado` = `status_operacional` atingiu seu teto aplicável (entregue, ou montado quando exigido) **E** `status_financeiro = pago`
 
### 4.2 Orçamento
 
```
rascunho → aprovado (convertido em pedido) → arquivado
```
 
### 4.3 OS (Ordem de Serviço) — status global
 
```
criada → em_andamento → finalizada
              ↘ bloqueada / cancelada
```
O status global da OS é **derivado/agregado** do status das suas etapas (seção 4.4) — não é um campo editado diretamente pelo GP.
 
### 4.4 Etapas da OS — predefinidas por tipo (não configuráveis pelo GP)
 
| Tipo de OS | Etapas (em ordem) |
|---|---|
| **Produção** (padrão) | Corte → Acabamento |
| **Entrega** | Checklist de Expedição → Saída para Entrega → Entrega Confirmada |
| **Montagem** | Montagem → Confirmação do Cliente |
| **Decorativa** | Checklist de Expedição → Entrega Confirmada *(pula produção)* |
 
### 4.5 Sub-máquina de cada etapa de Produção
 
```
Corte (requer Serrador alocado):
  não_iniciado → em_andamento → finalizado
 
Acabamento (requer Acabador alocado; só pode iniciar após Corte = finalizado):
  não_iniciado → em_andamento → finalizado
```
 
**Fluxo de operação (confirmado):** GP cria OS → GP aloca serrador → serrador corta → GP atualiza etapa para "finalizado" → GP aloca acabador (só agora Acabamento pode iniciar) → acabador finaliza → GP atualiza etapa.
 
O **avanço é sempre manual pelo GP** — o sistema não avança etapas automaticamente. Sem alocação de recurso, a próxima etapa não pode ser iniciada.
 
### 4.6 Adendo
 
```
pendente → aprovado / rejeitado
```
 
---
 
## 5. Regras de Negócio Detalhadas por Módulo
 
### 5.1 Medição (Pré-Orçamento)
 
- `medidor` tem login simplificado, atua **antes** da criação do orçamento.
- Faz upload de fotos de desenho ou PDF do projeto fornecido pelo cliente.
- Gera um registro vinculado a um orçamento em rascunho, que o vendedor usa como base.
### 5.2 Orçamento e Categorias de Item
 
Itens do orçamento (`itens_orcamento`) são vinculados a **material** E **categoria**. A categoria determina automaticamente qual fluxo de OS o item vai gerar.
 
**Nova tabela `categorias_item`:**
 
| Categoria | Requer Produção? | Requer Montagem? | Tipo de Acabamento |
|---|---|---|---|
| Soleira/Peitoril | Sim | **Nunca** | Simples *(assumido — ver seção 9)* |
| Pia/Lavatório/Balcão/Nicho | Sim | Geralmente sim | Completo *(assumido — ver seção 9)* |
| Pedra Decorativa | **Não** | Não | N/A |
| Padrão | Sim | Depende do item | A definir por item |
 
**Regra de entrega:** todas as categorias geralmente têm entrega. A **taxa de entrega é definida no nível do PEDIDO** (não por OS individual) — decisão explícita, mesmo sabendo que isso não cobre com granularidade fina o caso de itens do mesmo pedido com destinos diferentes (retirada vs. entrega).
 
**Editor 2D de retalhos:** escopo limitado — grid de pontos com snap, formando apenas linhas retas (figuras em "L" ou com insertos em "U"). **Não é** um desenhador vetorial livre.
 
### 5.3 Aceite e Conversão em Pedido
 
**Aceite do cliente** — qualquer uma das opções abaixo é suficiente (mínimo uma confirmação):
- Upload de foto/print/PDF comprovando aceite (ex: print de WhatsApp), OU
- Assinatura no dispositivo móvel do vendedor/administrador
**Regra de conversão por valor do orçamento:**
 
| Valor do Orçamento | Mecanismo de Conversão |
|---|---|
| **≥ R$ 10.000** (configurável) | Ao assinar, sistema gera **contrato automático dinâmico**, que substitui a assinatura/print como confirmação. Contrato **não pode ser editado** após assinado. |
| **< R$ 10.000** | Vendedor clica em **"Confirmar e Gerar Pedido"** — sem contrato automático obrigatório. |
 
Não há aprovação de administrador em nenhum dos dois casos (ver nota na seção 3).
 
**Ao converter:**
- Orçamento é bloqueado para edição.
- Sistema gera automaticamente a **parcela de sinal** (percentual definido pelo vendedor no orçamento, **mínimo 10%**, configurável) e **todas as demais parcelas**, todas com status `pendente`.
### 5.4 Financeiro — Sinal e Parcelas
 
- Todas as parcelas (sinal + demais) são geradas **automaticamente** na conversão — não há lançamento manual.
- O **sinal deve ser baixado pelo Financeiro** (`gestor_financeiro`, ou `administrador`).
- 🔴 **REGRA CRÍTICA / GATE DO SISTEMA:** o **GP não pode criar nenhuma OS** para um pedido até que o sinal tenha sido confirmado (baixado) pelo financeiro. Este é o único ponto de bloqueio de produção no fluxo.
- Parcelas já pagas **nunca** são modificadas diretamente por nenhuma ação (adendo, edição, etc.) — ver regra de abatimento em 5.7.
### 5.5 Produção — Criação de OS
 
GP cria manualmente, **N OS por pedido**, respeitando:
 
1. **Item composto sempre na mesma OS.** Ex: uma pia com tampo + saia + espelho é uma única "unidade" e não pode ser separada em OSs diferentes.
2. **OS nunca mistura materiais diferentes.** Itens de materiais distintos vão obrigatoriamente para OSs separadas.
3. **OS nunca mistura categorias com fluxo incompatível** (ex: uma Soleira, que nunca tem montagem, não pode estar na mesma OS que uma Pia, que geralmente tem — mesmo que sejam do mesmo material). A OS herda o fluxo de etapas inteiramente da categoria dos itens que contém.
4. **Itens do mesmo material E categoria compatível** podem ou não estar na mesma OS — a critério do GP (ex: pia1 e pia2 do mesmo material podem ser a mesma OS ou OSs separadas).
5. GP é responsável por manter OSs de **tamanho gerenciável** — já que uma OS só libera para entrega quando 100% de suas peças estão prontas (ver 5.8), OSs muito grandes atrasam a expedição desnecessariamente.
### 5.6 Produção — Execução do Kanban
 
- Etapas são **predefinidas pelo sistema**, não configuráveis pelo GP (ver 4.4).
- GP aloca recursos (serrador/acabador) para **iniciar** cada etapa — sem alocação, a etapa não pode começar.
- GP **monitora e avança manualmente** cada transição de status (o sistema não avança sozinho).
- Produtividade por operador deve ser **rastreada** mesmo sem login do operador — via registro de alocação na etapa da OS. Isso é a base de dados para um futuro módulo de comissionamento de operadores (ver seção 8 — fora de escopo desta consolidação).
### 5.7 Adendos
 
- Só podem alterar **itens/OS que ainda não iniciaram** (status da etapa = `não_iniciado`, ou OS ainda em `criada`).
- Uma vez que a OS **iniciou qualquer etapa** (ex: corte começou), **bloqueio total** — o sistema não aceita adendo para aqueles itens.
- Requer documento de aprovação: upload (foto/print/PDF) OU assinatura do cliente — mesmo padrão do aceite original.
- Parcelas já pagas nunca são alteradas.
- **Se o adendo reduz o valor total do pedido:** sistema lança um **abatimento (desconto) automaticamente na ÚLTIMA parcela em aberto primeiro**, cascateando para parcelas anteriores caso o valor do abatimento exceda o valor da última parcela.
> ⚖️ **Nota legal (não é aconselhamento jurídico — recomenda-se revisão por advogado antes de publicar o termo/contrato final):** a política de bloqueio total para itens com produção iniciada, e a forma de compensação via abatimento em parcelas (em vez de reembolso em dinheiro), devem estar **explicitamente redigidas no contrato/termo de aceite** assinado pelo cliente, para reduzir risco de disputa sob o Código de Defesa do Consumidor — especialmente quanto ao **direito de arrependimento (Art. 49 CDC)**, aplicável a compras fechadas fora do estabelecimento comercial (ex: negociadas inteiramente por WhatsApp).
 
### 5.8 Expedição e Entrega
 
- Uma OS só entra na fila de entrega quando **100% de suas peças estão prontas** (checklist de expedição completo).
- Fila de entrega: **reordenável via drag-and-drop** pelo motorista/GP — roteirização simplificada (estilo fila), **não** é otimização automática de rota.
- Confirmação de entrega requer: **nome + documento** de quem recebeu **+ assinatura**.
- Taxa de entrega definida no nível do **pedido** (ver 5.2).
### 5.9 Montagem
 
- Etapas: Montagem → Confirmação do Cliente.
- Categorias sem montagem (Soleira/Peitoril, Pedra Decorativa) **pulam esta etapa automaticamente**, por regra herdada da categoria (5.2).
- `montador` tem login simplificado, mesmo padrão de `motorista`.
### 5.10 Estoque e Patrimônio
 
- Chapas: status `available` / `partial` / `consumed` / `retalho`, com QR Code.
- Retalhos vinculados a chapas, com forma desenhada no editor 2D (ver 5.2).
- Patrimônio (máquinas/veículos/equipamentos): histórico completo de manutenção e alocação.
### 5.11 Fiscal
 
- NF pode ser emitida tanto por `administrador` quanto por `gestor_financeiro`.
- **NF parcial é permitida** — uma OS pode ter múltiplas NFs associadas.
- NF pode ser emitida em nome de **terceiro** (ex: pedido em nome do cônjuge, NF em nome do cônjuge).
- NFs vinculadas por OS (`id_os` como FK, conforme modelo original).
### 5.12 Comissão (Vendedor) — Escopo Reduzido para Este MVP
 
- Dashboard do vendedor **NÃO exibe valor de comissão** — exibe apenas **volume/quantidade de vendas**.
- Percentual de comissão é configurável individualmente por vendedor (`usuarios.comissao_percentual`).
- Ver seção 8 sobre o sistema de comissionamento mais amplo (não incluído nesta consolidação).
### 5.13 Conciliação Bancária
 
- **Manual por enquanto** — sem integração bancária automática neste MVP.
### 5.14 WhatsApp Business API
 
- Escopo confirmado: **apenas no momento da conversão do pedido** (envio de mensagem template com link, por exemplo). Não há coleta de assinatura via WhatsApp no MVP.
---
 
## 6. Modelo de Dados — Deltas em Relação a `modelo-relacional.md`
 
```sql
-- usuarios: ver seção 2.4 (credencial expandido, especialidade, nivel_acabamento, comissao_percentual)
 
-- pedidos: campo "status" único é SUBSTITUÍDO por dois campos:
pedidos.status_financeiro   enum (pendente, parcial, pago, atrasado, cancelado)
pedidos.status_operacional  enum (aguardando_producao, em_producao, entregue, montado)
 
-- itens_orcamento: novo campo
itens_orcamento.id_categoria   FK → categorias_item
 
-- NOVA TABELA
categorias_item
  id_categoria         PK
  nome                 (Soleira/Peitoril, Pia/Lavatório/Balcão/Nicho, Pedra Decorativa, Padrão)
  requer_producao      bool
  requer_montagem      bool
  tipo_acabamento_requerido  enum (simples, completo) — nullable
 
-- NOVA TABELA (filha de producoes/OS)
etapas_os
  id_etapa       PK
  id_os          FK
  nome_etapa     (Corte, Acabamento, Checklist de Expedição, Saída para Entrega,
                  Entrega Confirmada, Montagem, Confirmação do Cliente)
  status_etapa   enum (não_iniciado, em_andamento, finalizado)
  responsavel_id FK usuarios — nullable até alocação
  data_inicio, data_fim
 
-- producoes (OS): campo "status" passa a ser DERIVADO/AGREGADO das etapas_os,
-- não editado diretamente pelo GP.
 
-- adendos: novos campos
adendos.valor_abatimento     decimal — nullable
adendos.parcela_afetada_id   FK financeiro — nullable
 
-- NOVA TABELA
medicoes
  id_medicao     PK
  id_orcamento   FK
  medidor_id     FK usuarios
  arquivo_url    (foto ou PDF)
  data
```
 
---
 
## 7. Perfis × Dashboards (referência rápida)
 
| Perfil | Vê |
|---|---|
| Administrador | Tudo — faturamento, fluxo de caixa, inadimplência, aprovação de cancelamentos |
| Gestor Financeiro | Contas a pagar/receber, baixa de parcelas, emissão de NF, conciliação manual |
| Vendedor | Orçamentos, pedidos, **volume** de vendas (sem valor de comissão), histórico de clientes |
| GP | OSs, alocação de recursos, kanban, pendências financeiras que bloqueiam produção |
| Motorista | Fila de entrega (drag-and-drop), confirmação com assinatura |
| Montador | Checklist de montagem |
| Medidor | Upload de medições vinculadas a orçamentos em rascunho |
 
---
 
## 8. Fora do Escopo Desta Consolidação
 
- **Sistema de comissionamento detalhado para operadores (Serrador/Acabador):** existe um desenho mais amplo, elaborado em sessão anterior, cobrindo múltiplos perfis, gatilhos por prazo (`data_fim_real`, `urgente`), aprovação do Admin, multiplicador de senioridade e pool de bônus coletivo. **Não foi trazido para este documento** porque precisa ser reconciliado com os perfis novos definidos aqui (`medidor`, `motorista`, `montador` não existiam no desenho original de comissão). Recomenda-se tratar isso como uma sprint/tarefa dedicada de reconciliação antes de implementar comissionamento de operadores.
- **Roadmap de Sprints:** já existe como documento separado (`Roadmap_Sprints_ERP_Marmoraria.md`), cobrindo Sprint 0–13.
- **Arquitetura técnica** (stack, estrutura de pastas, padrões de API/endpoints): Fase 2 do projeto, ainda não iniciada.
---
 
## 9. Premissas Assumidas — Requerem Confirmação Explícita
 
| # | Premissa | Onde é usada |
|---|---|---|
| A1 | `tipo_acabamento_requerido`: Soleira/Peitoril = Simples, Pia/Lavatório/Balcão/Nicho = Completo | Tabela `categorias_item` (seção 5.2) |
| A2 | Status operacional do **pedido** é agregado a partir do status de **todas as suas OSs** (ex: pedido só chega a "entregue" quando todas as OSs relevantes chegaram a "Entrega Confirmada") | Máquina de estado do pedido (4.1) |
 
Nenhuma outra suposição foi feita além do que foi explicitamente confirmado ao longo da análise de lacunas.
 
---
 
## 10. Glossário
 
| Termo | Significado |
|---|---|
| OS | Ordem de Serviço |
| GP | Gestor de Produção |
| Adendo | Alteração solicitada após a aprovação/conversão do pedido |
| Chapa | Placa bruta de material (mármore/granito) antes do corte |
| Retalho | Sobra de chapa após o corte, com forma própria registrada no editor 2D |
| Sinal | Valor inicial pago pelo cliente que dispara a conversão de orçamento em pedido |
| NFe/NFSe/NFCe | Tipos de nota fiscal eletrônica (produto / serviço / consumidor) |