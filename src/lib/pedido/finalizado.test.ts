import { StatusFinanceiroPedido, StatusOperacionalPedido } from "@prisma/client";
import { describe, expect, it } from "vitest";

import { estaFinalizado, tetoOperacional } from "./finalizado";

describe("tetoOperacional — regra 4.1", () => {
  it("sem item que exija montagem, o teto é 'entregue'", () => {
    expect(tetoOperacional(false)).toBe(StatusOperacionalPedido.entregue);
  });

  it("com item que exija montagem, o teto é 'montado'", () => {
    expect(tetoOperacional(true)).toBe(StatusOperacionalPedido.montado);
  });
});

describe("estaFinalizado — regra 4.1", () => {
  it("caminho feliz: entregue e pago, sem montagem exigida", () => {
    const pedido = {
      statusOperacional: StatusOperacionalPedido.entregue,
      statusFinanceiro: StatusFinanceiroPedido.pago,
    };

    expect(estaFinalizado(pedido, false)).toBe(true);
  });

  it("caminho feliz: montado e pago, com montagem exigida", () => {
    const pedido = {
      statusOperacional: StatusOperacionalPedido.montado,
      statusFinanceiro: StatusFinanceiroPedido.pago,
    };

    expect(estaFinalizado(pedido, true)).toBe(true);
  });

  // caminho de bloqueio: teto operacional atingido, mas financeiro em aberto
  it("não finaliza com o teto operacional atingido e o financeiro pendente", () => {
    const pedido = {
      statusOperacional: StatusOperacionalPedido.entregue,
      statusFinanceiro: StatusFinanceiroPedido.pendente,
    };

    expect(estaFinalizado(pedido, false)).toBe(false);
  });

  it("não finaliza com pagamento parcial", () => {
    const pedido = {
      statusOperacional: StatusOperacionalPedido.entregue,
      statusFinanceiro: StatusFinanceiroPedido.parcial,
    };

    expect(estaFinalizado(pedido, false)).toBe(false);
  });

  // caminho de bloqueio: pago, mas o teto aplicável é 'montado', não 'entregue'
  it("não finaliza pedido com montagem exigida que só chegou a 'entregue'", () => {
    const pedido = {
      statusOperacional: StatusOperacionalPedido.entregue,
      statusFinanceiro: StatusFinanceiroPedido.pago,
    };

    expect(estaFinalizado(pedido, true)).toBe(false);
  });

  it("não finaliza pedido ainda em produção, mesmo pago", () => {
    const pedido = {
      statusOperacional: StatusOperacionalPedido.em_producao,
      statusFinanceiro: StatusFinanceiroPedido.pago,
    };

    expect(estaFinalizado(pedido, false)).toBe(false);
  });
});
