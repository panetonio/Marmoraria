-- CreateEnum
CREATE TYPE "Credencial" AS ENUM ('administrador', 'gestor_financeiro', 'vendedor', 'gp', 'motorista', 'montador', 'medidor', 'operador');

-- CreateEnum
CREATE TYPE "Especialidade" AS ENUM ('serrador', 'acabador');

-- CreateEnum
CREATE TYPE "NivelAcabamento" AS ENUM ('simples', 'completo');

-- CreateEnum
CREATE TYPE "TipoPessoa" AS ENUM ('PF', 'PJ');

-- CreateEnum
CREATE TYPE "StatusOrcamento" AS ENUM ('rascunho', 'aprovado', 'arquivado');

-- CreateEnum
CREATE TYPE "TipoAceite" AS ENUM ('upload', 'assinatura', 'contrato');

-- CreateEnum
CREATE TYPE "StatusFinanceiroPedido" AS ENUM ('pendente', 'parcial', 'pago', 'atrasado', 'cancelado');

-- CreateEnum
CREATE TYPE "StatusOperacionalPedido" AS ENUM ('aguardando_producao', 'em_producao', 'entregue', 'montado');

-- CreateEnum
CREATE TYPE "TipoOs" AS ENUM ('producao', 'entrega', 'montagem', 'decorativa');

-- CreateEnum
CREATE TYPE "StatusOs" AS ENUM ('criada', 'em_andamento', 'bloqueada', 'cancelada', 'finalizada');

-- CreateEnum
CREATE TYPE "NomeEtapa" AS ENUM ('corte', 'acabamento', 'checklist_expedicao', 'saida_para_entrega', 'entrega_confirmada', 'montagem', 'confirmacao_cliente');

-- CreateEnum
CREATE TYPE "StatusEtapa" AS ENUM ('nao_iniciado', 'em_andamento', 'finalizado');

-- CreateEnum
CREATE TYPE "StatusAdendo" AS ENUM ('pendente', 'aprovado', 'rejeitado');

-- CreateEnum
CREATE TYPE "TipoLancamento" AS ENUM ('receita', 'despesa');

-- CreateEnum
CREATE TYPE "StatusLancamento" AS ENUM ('pendente', 'pago', 'atrasado', 'cancelado');

-- CreateEnum
CREATE TYPE "TipoAssinatura" AS ENUM ('digital', 'fisica', 'whatsapp');

-- CreateTable
CREATE TABLE "enderecos" (
    "id_endereco" SERIAL NOT NULL,
    "cep" TEXT NOT NULL,
    "logradouro" TEXT NOT NULL,
    "numero" TEXT NOT NULL,
    "bairro" TEXT NOT NULL,
    "cidade" TEXT NOT NULL,
    "uf" CHAR(2) NOT NULL,
    "complemento" TEXT,

    CONSTRAINT "enderecos_pkey" PRIMARY KEY ("id_endereco")
);

-- CreateTable
CREATE TABLE "clientes" (
    "id_cliente" SERIAL NOT NULL,
    "nome" TEXT NOT NULL,
    "tipo" "TipoPessoa" NOT NULL,
    "cpf_cnpj" TEXT NOT NULL,
    "telefone" TEXT,
    "email" TEXT,
    "endereco_id" INTEGER,
    "data_cadastro" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "clientes_pkey" PRIMARY KEY ("id_cliente")
);

-- CreateTable
CREATE TABLE "fornecedores" (
    "id_fornecedor" SERIAL NOT NULL,
    "razao_social" TEXT NOT NULL,
    "nome_fantasia" TEXT,
    "cnpj" TEXT NOT NULL,
    "telefone" TEXT,
    "email" TEXT,
    "endereco_id" INTEGER,
    "contato_responsavel" TEXT,

    CONSTRAINT "fornecedores_pkey" PRIMARY KEY ("id_fornecedor")
);

-- CreateTable
CREATE TABLE "materiais" (
    "id_material" SERIAL NOT NULL,
    "nome" TEXT NOT NULL,
    "tipo" TEXT,
    "fornecedor_id" INTEGER,
    "preco_padrao_m2" DECIMAL(12,2) NOT NULL,
    "medidas_padrao" TEXT,
    "foto_url" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "materiais_pkey" PRIMARY KEY ("id_material")
);

-- CreateTable
CREATE TABLE "categorias_item" (
    "id_categoria" SERIAL NOT NULL,
    "nome" TEXT NOT NULL,
    "requer_producao" BOOLEAN NOT NULL,
    "requer_montagem" BOOLEAN NOT NULL,
    "tipo_acabamento_requerido" "NivelAcabamento",

    CONSTRAINT "categorias_item_pkey" PRIMARY KEY ("id_categoria")
);

-- CreateTable
CREATE TABLE "usuarios" (
    "id_usuario" SERIAL NOT NULL,
    "nome" TEXT NOT NULL,
    "email" TEXT,
    "credencial" "Credencial" NOT NULL,
    "especialidade" "Especialidade",
    "nivel_acabamento" "NivelAcabamento",
    "comissao_percentual" DECIMAL(5,2),
    "senha_hash" TEXT,
    "pin_hash" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "usuarios_pkey" PRIMARY KEY ("id_usuario")
);

-- CreateTable
CREATE TABLE "orcamentos" (
    "id_orcamento" SERIAL NOT NULL,
    "id_cliente" INTEGER NOT NULL,
    "id_vendedor" INTEGER NOT NULL,
    "data_criacao" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" "StatusOrcamento" NOT NULL DEFAULT 'rascunho',
    "validade" TIMESTAMP(3),
    "desconto_total" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "valor_frete" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "forma_pagamento" TEXT,
    "observacao" TEXT,
    "percentual_sinal" DECIMAL(5,2) NOT NULL DEFAULT 10,
    "numero_parcelas" INTEGER NOT NULL DEFAULT 1,
    "tipo_aceite" "TipoAceite",
    "documento_aceite_url" TEXT,
    "data_aceite" TIMESTAMP(3),

    CONSTRAINT "orcamentos_pkey" PRIMARY KEY ("id_orcamento")
);

-- CreateTable
CREATE TABLE "itens_orcamento" (
    "id_item" SERIAL NOT NULL,
    "id_orcamento" INTEGER NOT NULL,
    "id_material" INTEGER NOT NULL,
    "id_categoria" INTEGER NOT NULL,
    "id_item_pai" INTEGER,
    "id_os" INTEGER,
    "descricao" TEXT NOT NULL,
    "qtde" INTEGER NOT NULL DEFAULT 1,
    "largura" DECIMAL(10,4),
    "comprimento" DECIMAL(10,4),
    "area" DECIMAL(10,4),
    "tipo_acabamento" "NivelAcabamento",
    "forma_2d" JSONB,
    "requer_montagem" BOOLEAN,
    "preco_unitario" DECIMAL(12,2) NOT NULL,
    "subtotal" DECIMAL(12,2) NOT NULL,

    CONSTRAINT "itens_orcamento_pkey" PRIMARY KEY ("id_item")
);

-- CreateTable
CREATE TABLE "medicoes" (
    "id_medicao" SERIAL NOT NULL,
    "id_orcamento" INTEGER NOT NULL,
    "medidor_id" INTEGER NOT NULL,
    "arquivo_url" TEXT NOT NULL,
    "data" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "medicoes_pkey" PRIMARY KEY ("id_medicao")
);

-- CreateTable
CREATE TABLE "pedidos" (
    "id_pedido" SERIAL NOT NULL,
    "id_orcamento" INTEGER NOT NULL,
    "id_cliente" INTEGER NOT NULL,
    "data_aprovacao" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status_financeiro" "StatusFinanceiroPedido" NOT NULL DEFAULT 'pendente',
    "status_operacional" "StatusOperacionalPedido" NOT NULL DEFAULT 'aguardando_producao',
    "taxa_entrega" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "endereco_entrega_id" INTEGER,
    "observacao" TEXT,

    CONSTRAINT "pedidos_pkey" PRIMARY KEY ("id_pedido")
);

-- CreateTable
CREATE TABLE "contratos" (
    "id_contrato" SERIAL NOT NULL,
    "id_pedido" INTEGER NOT NULL,
    "arquivo_url" TEXT,
    "termo_html" TEXT,
    "data_assinatura" TIMESTAMP(3),
    "tipo_assinatura" "TipoAssinatura",

    CONSTRAINT "contratos_pkey" PRIMARY KEY ("id_contrato")
);

-- CreateTable
CREATE TABLE "producoes" (
    "id_os" SERIAL NOT NULL,
    "id_pedido" INTEGER NOT NULL,
    "id_material" INTEGER NOT NULL,
    "id_categoria" INTEGER NOT NULL,
    "tipo" "TipoOs" NOT NULL,
    "status" "StatusOs" NOT NULL DEFAULT 'criada',
    "responsavel_id" INTEGER,
    "data_inicio" TIMESTAMP(3),
    "data_fim" TIMESTAMP(3),

    CONSTRAINT "producoes_pkey" PRIMARY KEY ("id_os")
);

-- CreateTable
CREATE TABLE "etapas_os" (
    "id_etapa" SERIAL NOT NULL,
    "id_os" INTEGER NOT NULL,
    "nome_etapa" "NomeEtapa" NOT NULL,
    "ordem" INTEGER NOT NULL,
    "status_etapa" "StatusEtapa" NOT NULL DEFAULT 'nao_iniciado',
    "responsavel_id" INTEGER,
    "data_inicio" TIMESTAMP(3),
    "data_fim" TIMESTAMP(3),

    CONSTRAINT "etapas_os_pkey" PRIMARY KEY ("id_etapa")
);

-- CreateTable
CREATE TABLE "entregas" (
    "id_entrega" SERIAL NOT NULL,
    "id_os" INTEGER NOT NULL,
    "posicao_fila" INTEGER NOT NULL,
    "motorista_id" INTEGER,
    "recebedor_nome" TEXT,
    "recebedor_documento" TEXT,
    "assinatura_url" TEXT,
    "data_entrega" TIMESTAMP(3),

    CONSTRAINT "entregas_pkey" PRIMARY KEY ("id_entrega")
);

-- CreateTable
CREATE TABLE "adendos" (
    "id_adendo" SERIAL NOT NULL,
    "id_pedido" INTEGER NOT NULL,
    "data_criacao" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" "StatusAdendo" NOT NULL DEFAULT 'pendente',
    "justificativa" TEXT NOT NULL,
    "documento_aprovacao" TEXT,
    "valor_abatimento" DECIMAL(12,2),
    "parcela_afetada_id" INTEGER,

    CONSTRAINT "adendos_pkey" PRIMARY KEY ("id_adendo")
);

-- CreateTable
CREATE TABLE "financeiro" (
    "id_lancamento" SERIAL NOT NULL,
    "id_pedido" INTEGER,
    "tipo" "TipoLancamento" NOT NULL,
    "categoria" TEXT,
    "descricao" TEXT NOT NULL,
    "valor" DECIMAL(12,2) NOT NULL,
    "data_vencimento" TIMESTAMP(3) NOT NULL,
    "data_pagamento" TIMESTAMP(3),
    "forma_pagamento" TEXT,
    "status" "StatusLancamento" NOT NULL DEFAULT 'pendente',
    "eh_sinal" BOOLEAN NOT NULL DEFAULT false,
    "numero_parcela" INTEGER,
    "baixado_por_id" INTEGER,

    CONSTRAINT "financeiro_pkey" PRIMARY KEY ("id_lancamento")
);

-- CreateIndex
CREATE UNIQUE INDEX "clientes_cpf_cnpj_key" ON "clientes"("cpf_cnpj");

-- CreateIndex
CREATE UNIQUE INDEX "fornecedores_cnpj_key" ON "fornecedores"("cnpj");

-- CreateIndex
CREATE UNIQUE INDEX "categorias_item_nome_key" ON "categorias_item"("nome");

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_email_key" ON "usuarios"("email");

-- CreateIndex
CREATE INDEX "orcamentos_id_cliente_idx" ON "orcamentos"("id_cliente");

-- CreateIndex
CREATE INDEX "orcamentos_id_vendedor_idx" ON "orcamentos"("id_vendedor");

-- CreateIndex
CREATE INDEX "itens_orcamento_id_orcamento_idx" ON "itens_orcamento"("id_orcamento");

-- CreateIndex
CREATE INDEX "itens_orcamento_id_os_idx" ON "itens_orcamento"("id_os");

-- CreateIndex
CREATE INDEX "itens_orcamento_id_item_pai_idx" ON "itens_orcamento"("id_item_pai");

-- CreateIndex
CREATE INDEX "medicoes_id_orcamento_idx" ON "medicoes"("id_orcamento");

-- CreateIndex
CREATE UNIQUE INDEX "pedidos_id_orcamento_key" ON "pedidos"("id_orcamento");

-- CreateIndex
CREATE INDEX "pedidos_id_cliente_idx" ON "pedidos"("id_cliente");

-- CreateIndex
CREATE UNIQUE INDEX "contratos_id_pedido_key" ON "contratos"("id_pedido");

-- CreateIndex
CREATE INDEX "producoes_id_pedido_idx" ON "producoes"("id_pedido");

-- CreateIndex
CREATE INDEX "etapas_os_id_os_idx" ON "etapas_os"("id_os");

-- CreateIndex
CREATE UNIQUE INDEX "etapas_os_id_os_nome_etapa_key" ON "etapas_os"("id_os", "nome_etapa");

-- CreateIndex
CREATE UNIQUE INDEX "entregas_id_os_key" ON "entregas"("id_os");

-- CreateIndex
CREATE INDEX "adendos_id_pedido_idx" ON "adendos"("id_pedido");

-- CreateIndex
CREATE INDEX "financeiro_id_pedido_idx" ON "financeiro"("id_pedido");

-- AddForeignKey
ALTER TABLE "clientes" ADD CONSTRAINT "clientes_endereco_id_fkey" FOREIGN KEY ("endereco_id") REFERENCES "enderecos"("id_endereco") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fornecedores" ADD CONSTRAINT "fornecedores_endereco_id_fkey" FOREIGN KEY ("endereco_id") REFERENCES "enderecos"("id_endereco") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "materiais" ADD CONSTRAINT "materiais_fornecedor_id_fkey" FOREIGN KEY ("fornecedor_id") REFERENCES "fornecedores"("id_fornecedor") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orcamentos" ADD CONSTRAINT "orcamentos_id_cliente_fkey" FOREIGN KEY ("id_cliente") REFERENCES "clientes"("id_cliente") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orcamentos" ADD CONSTRAINT "orcamentos_id_vendedor_fkey" FOREIGN KEY ("id_vendedor") REFERENCES "usuarios"("id_usuario") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "itens_orcamento" ADD CONSTRAINT "itens_orcamento_id_orcamento_fkey" FOREIGN KEY ("id_orcamento") REFERENCES "orcamentos"("id_orcamento") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "itens_orcamento" ADD CONSTRAINT "itens_orcamento_id_material_fkey" FOREIGN KEY ("id_material") REFERENCES "materiais"("id_material") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "itens_orcamento" ADD CONSTRAINT "itens_orcamento_id_categoria_fkey" FOREIGN KEY ("id_categoria") REFERENCES "categorias_item"("id_categoria") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "itens_orcamento" ADD CONSTRAINT "itens_orcamento_id_os_fkey" FOREIGN KEY ("id_os") REFERENCES "producoes"("id_os") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "itens_orcamento" ADD CONSTRAINT "itens_orcamento_id_item_pai_fkey" FOREIGN KEY ("id_item_pai") REFERENCES "itens_orcamento"("id_item") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "medicoes" ADD CONSTRAINT "medicoes_id_orcamento_fkey" FOREIGN KEY ("id_orcamento") REFERENCES "orcamentos"("id_orcamento") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "medicoes" ADD CONSTRAINT "medicoes_medidor_id_fkey" FOREIGN KEY ("medidor_id") REFERENCES "usuarios"("id_usuario") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pedidos" ADD CONSTRAINT "pedidos_id_orcamento_fkey" FOREIGN KEY ("id_orcamento") REFERENCES "orcamentos"("id_orcamento") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pedidos" ADD CONSTRAINT "pedidos_id_cliente_fkey" FOREIGN KEY ("id_cliente") REFERENCES "clientes"("id_cliente") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pedidos" ADD CONSTRAINT "pedidos_endereco_entrega_id_fkey" FOREIGN KEY ("endereco_entrega_id") REFERENCES "enderecos"("id_endereco") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contratos" ADD CONSTRAINT "contratos_id_pedido_fkey" FOREIGN KEY ("id_pedido") REFERENCES "pedidos"("id_pedido") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "producoes" ADD CONSTRAINT "producoes_id_pedido_fkey" FOREIGN KEY ("id_pedido") REFERENCES "pedidos"("id_pedido") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "producoes" ADD CONSTRAINT "producoes_id_material_fkey" FOREIGN KEY ("id_material") REFERENCES "materiais"("id_material") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "producoes" ADD CONSTRAINT "producoes_id_categoria_fkey" FOREIGN KEY ("id_categoria") REFERENCES "categorias_item"("id_categoria") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "producoes" ADD CONSTRAINT "producoes_responsavel_id_fkey" FOREIGN KEY ("responsavel_id") REFERENCES "usuarios"("id_usuario") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "etapas_os" ADD CONSTRAINT "etapas_os_id_os_fkey" FOREIGN KEY ("id_os") REFERENCES "producoes"("id_os") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "etapas_os" ADD CONSTRAINT "etapas_os_responsavel_id_fkey" FOREIGN KEY ("responsavel_id") REFERENCES "usuarios"("id_usuario") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "entregas" ADD CONSTRAINT "entregas_id_os_fkey" FOREIGN KEY ("id_os") REFERENCES "producoes"("id_os") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "entregas" ADD CONSTRAINT "entregas_motorista_id_fkey" FOREIGN KEY ("motorista_id") REFERENCES "usuarios"("id_usuario") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "adendos" ADD CONSTRAINT "adendos_id_pedido_fkey" FOREIGN KEY ("id_pedido") REFERENCES "pedidos"("id_pedido") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "adendos" ADD CONSTRAINT "adendos_parcela_afetada_id_fkey" FOREIGN KEY ("parcela_afetada_id") REFERENCES "financeiro"("id_lancamento") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "financeiro" ADD CONSTRAINT "financeiro_id_pedido_fkey" FOREIGN KEY ("id_pedido") REFERENCES "pedidos"("id_pedido") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "financeiro" ADD CONSTRAINT "financeiro_baixado_por_id_fkey" FOREIGN KEY ("baixado_por_id") REFERENCES "usuarios"("id_usuario") ON DELETE SET NULL ON UPDATE CASCADE;
