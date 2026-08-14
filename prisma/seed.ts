import { randomBytes, scryptSync } from "node:crypto";

import { PrismaPg } from "@prisma/adapter-pg";
import {
  Credencial,
  Especialidade,
  NivelAcabamento,
  PrismaClient,
  StatusOrcamento,
  TipoPessoa,
} from "@prisma/client";
import "dotenv/config";

/**
 * Seed de demonstração (Addendum §6 — "existe dado de seed realista para não
 * improvisar durante a demo").
 *
 * Idempotente: roda quantas vezes for preciso sem duplicar (upsert por chave
 * natural). Use `npm run db:seed`.
 */

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error("DATABASE_URL não definida");

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

/**
 * decisão D3 — senha e PIN sempre em hash, nunca em texto puro.
 * scrypt do Node evita dependência extra no seed; a autenticação real
 * (MVP-S0, Auth.js) deve usar a mesma função — ver src/lib/auth quando existir.
 */
function hash(segredo: string): string {
  const salt = randomBytes(16).toString("hex");
  const derivado = scryptSync(segredo, salt, 64).toString("hex");
  return `${salt}:${derivado}`;
}

async function main() {
  // ---------------------------------------------------------------
  // regra 5.2 — categorias de item, com a premissa A1 CONFIRMADA:
  // Soleira/Peitoril = simples, Pia/Lavatório/Balcão/Nicho = completo
  // ---------------------------------------------------------------
  const categorias = [
    {
      nome: "Soleira/Peitoril",
      requerProducao: true,
      // regra 5.2 — soleira NUNCA tem montagem
      requerMontagem: false,
      tipoAcabamentoRequerido: NivelAcabamento.simples,
    },
    {
      nome: "Pia/Lavatório/Balcão/Nicho",
      requerProducao: true,
      // regra 5.2 — "geralmente sim"; o item pode sobrescrever
      requerMontagem: true,
      tipoAcabamentoRequerido: NivelAcabamento.completo,
    },
    {
      nome: "Pedra Decorativa",
      // Consolidado §4.4 — pula produção, vai direto para expedição
      requerProducao: false,
      requerMontagem: false,
      tipoAcabamentoRequerido: null,
    },
    {
      nome: "Padrão",
      requerProducao: true,
      // regra 5.2 — "depende do item": default false, sobrescrevível por item
      requerMontagem: false,
      tipoAcabamentoRequerido: null,
    },
  ];

  for (const categoria of categorias) {
    await prisma.categoriaItem.upsert({
      where: { nome: categoria.nome },
      create: categoria,
      update: categoria,
    });
  }

  // ---------------------------------------------------------------
  // Consolidado §2.2 — 7 perfis com login
  // Consolidado §2.3 — operadores existem em `usuarios` mas SEM acesso
  // ---------------------------------------------------------------
  const comLogin = [
    { nome: "Ana Admin", email: "admin@marmoraria.local", credencial: Credencial.administrador },
    { nome: "Fábio Financeiro", email: "financeiro@marmoraria.local", credencial: Credencial.gestor_financeiro },
    { nome: "Vera Vendas", email: "vendedor@marmoraria.local", credencial: Credencial.vendedor, comissaoPercentual: "3.00" },
    { nome: "Gil Produção", email: "gp@marmoraria.local", credencial: Credencial.gp },
  ];

  for (const usuario of comLogin) {
    await prisma.usuario.upsert({
      where: { email: usuario.email },
      create: { ...usuario, senhaHash: hash("demo1234") },
      update: { nome: usuario.nome, credencial: usuario.credencial },
    });
  }

  // decisão D3 — PIN numérico simples, sem senha completa
  const comPin = [
    { nome: "Marcos Motorista", email: "motorista@marmoraria.local", credencial: Credencial.motorista, pin: "1111" },
    { nome: "Mauro Montador", email: "montador@marmoraria.local", credencial: Credencial.montador, pin: "2222" },
    { nome: "Célia Medidora", email: "medidor@marmoraria.local", credencial: Credencial.medidor, pin: "3333" },
  ];

  for (const { pin, ...usuario } of comPin) {
    await prisma.usuario.upsert({
      where: { email: usuario.email },
      create: { ...usuario, pinHash: hash(pin) },
      update: { nome: usuario.nome, credencial: usuario.credencial },
    });
  }

  // Consolidado §2.3 — recursos alocáveis SEM login (sem senha nem PIN).
  // O acabador é `completo`: pela hierarquia da §2.3 ele também atende
  // demandas `simples`, então um único acabador cobre as duas categorias.
  const operadores = [
    {
      nome: "Sérgio Serrador",
      email: "serrador@marmoraria.local",
      credencial: Credencial.operador,
      especialidade: Especialidade.serrador,
      nivelAcabamento: null,
    },
    {
      nome: "Alberto Acabador",
      email: "acabador@marmoraria.local",
      credencial: Credencial.operador,
      especialidade: Especialidade.acabador,
      nivelAcabamento: NivelAcabamento.completo,
    },
  ];

  for (const operador of operadores) {
    await prisma.usuario.upsert({
      where: { email: operador.email },
      create: operador,
      update: operador,
    });
  }

  // ---------------------------------------------------------------
  // Cliente, endereço e material de exemplo
  // ---------------------------------------------------------------
  const endereco = await prisma.endereco.create({
    data: {
      cep: "13560-000",
      logradouro: "Rua das Pedras",
      numero: "120",
      bairro: "Centro",
      cidade: "São Carlos",
      uf: "SP",
    },
  });

  const cliente = await prisma.cliente.upsert({
    where: { cpfCnpj: "123.456.789-00" },
    create: {
      nome: "Joana Ribeiro",
      tipo: TipoPessoa.PF,
      cpfCnpj: "123.456.789-00",
      telefone: "(16) 99999-1234",
      email: "joana@exemplo.local",
      enderecoId: endereco.idEndereco,
    },
    update: {},
  });

  // decisão D1 — catálogo genérico, sem chapa física
  const material = await prisma.material.create({
    data: {
      nome: "Granito Preto São Gabriel",
      tipo: "granito",
      precoPadraoM2: "480.00",
      medidasPadrao: "3,20m x 1,90m",
      ativo: true,
    },
  });

  const vendedor = await prisma.usuario.findUniqueOrThrow({
    where: { email: "vendedor@marmoraria.local" },
  });
  const categoriaPia = await prisma.categoriaItem.findUniqueOrThrow({
    where: { nome: "Pia/Lavatório/Balcão/Nicho" },
  });
  const categoriaSoleira = await prisma.categoriaItem.findUniqueOrThrow({
    where: { nome: "Soleira/Peitoril" },
  });

  // ---------------------------------------------------------------
  // Orçamento de exemplo em rascunho (regra 4.2)
  // ---------------------------------------------------------------
  const orcamento = await prisma.orcamento.create({
    data: {
      idCliente: cliente.idCliente,
      idVendedor: vendedor.idUsuario,
      status: StatusOrcamento.rascunho,
      descontoTotal: "0.00",
      valorFrete: "150.00",
      formaPagamento: "PIX",
      // regra 5.3 — sinal mínimo de 10%
      percentualSinal: "30.00",
      numeroParcelas: 3,
      observacao: "Orçamento de demonstração — reforma de cozinha.",
    },
  });

  // regra 5.5.1 — item composto: a pia é uma unidade indivisível formada por
  // tampo + saia + espelho. Os componentes vão obrigatoriamente na mesma OS.
  const pia = await prisma.itemOrcamento.create({
    data: {
      idOrcamento: orcamento.idOrcamento,
      idMaterial: material.idMaterial,
      idCategoria: categoriaPia.idCategoria,
      descricao: "Pia de cozinha em granito (conjunto)",
      qtde: 1,
      largura: "0.6000",
      comprimento: "2.4000",
      area: "1.4400",
      tipoAcabamento: NivelAcabamento.completo,
      precoUnitario: "1850.00",
      subtotal: "1850.00",
      // regra 5.2 — herda a montagem da categoria (null = herda)
      requerMontagem: null,
    },
  });

  const componentes = [
    { descricao: "Tampo", area: "1.4400", preco: "1200.00" },
    { descricao: "Saia frontal", area: "0.2400", preco: "350.00" },
    { descricao: "Espelho", area: "0.2400", preco: "300.00" },
  ];

  for (const componente of componentes) {
    await prisma.itemOrcamento.create({
      data: {
        idOrcamento: orcamento.idOrcamento,
        idMaterial: material.idMaterial,
        idCategoria: categoriaPia.idCategoria,
        idItemPai: pia.idItem,
        descricao: componente.descricao,
        qtde: 1,
        area: componente.area,
        tipoAcabamento: NivelAcabamento.completo,
        precoUnitario: componente.preco,
        subtotal: componente.preco,
        requerMontagem: null,
      },
    });
  }

  // regra 5.5.3 — soleira nunca tem montagem, então vai para OS separada da pia
  await prisma.itemOrcamento.create({
    data: {
      idOrcamento: orcamento.idOrcamento,
      idMaterial: material.idMaterial,
      idCategoria: categoriaSoleira.idCategoria,
      descricao: "Soleira de porta 0,90m",
      qtde: 2,
      largura: "0.1500",
      comprimento: "0.9000",
      area: "0.1350",
      tipoAcabamento: NivelAcabamento.simples,
      precoUnitario: "120.00",
      subtotal: "240.00",
      requerMontagem: null,
    },
  });

  console.log("Seed concluído:");
  console.log(`  categorias: ${categorias.length}`);
  console.log(
    `  usuários: ${comLogin.length + comPin.length + operadores.length} ` +
      `(${comLogin.length} com senha, ${comPin.length} com PIN, ${operadores.length} sem login)`,
  );
  console.log(`  orçamento #${orcamento.idOrcamento} com 5 itens (pia composta + soleira)`);
  console.log("  senha dos perfis com login: demo1234 | PINs: 1111 / 2222 / 3333");
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (erro) => {
    console.error(erro);
    await prisma.$disconnect();
    process.exit(1);
  });
