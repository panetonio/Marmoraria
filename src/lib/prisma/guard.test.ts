import { StatusOperacionalPedido, StatusOs } from "@prisma/client";
import { describe, expect, it } from "vitest";

import { StatusDerivadoError, verificarCamposDerivados } from "./guard";

describe("verificarCamposDerivados — regra 4.3", () => {
  it("bloqueia escrita direta de status derivado da OS", () => {
    expect(() =>
      verificarCamposDerivados("Producao", { status: StatusOs.finalizada }),
    ).toThrow(StatusDerivadoError);

    expect(() =>
      verificarCamposDerivados("Producao", { status: StatusOs.em_andamento }),
    ).toThrow(StatusDerivadoError);

    expect(() =>
      verificarCamposDerivados("Producao", { status: StatusOs.criada }),
    ).toThrow(StatusDerivadoError);
  });

  // regra 4.3 — bloqueada/cancelada são ramos de ação, não estados derivados
  it("permite os ramos de ação bloqueada e cancelada", () => {
    expect(() =>
      verificarCamposDerivados("Producao", { status: StatusOs.bloqueada }),
    ).not.toThrow();

    expect(() =>
      verificarCamposDerivados("Producao", { status: StatusOs.cancelada }),
    ).not.toThrow();
  });

  it("bloqueia a forma { set: valor } do Prisma", () => {
    expect(() =>
      verificarCamposDerivados("Producao", {
        status: { set: StatusOs.finalizada },
      }),
    ).toThrow(StatusDerivadoError);
  });

  // premissa A2 — status_operacional do pedido é agregado das OSs
  it("bloqueia escrita direta do status operacional do pedido", () => {
    expect(() =>
      verificarCamposDerivados("Pedido", {
        statusOperacional: StatusOperacionalPedido.entregue,
      }),
    ).toThrow(StatusDerivadoError);
  });

  // decisão D6 — status_financeiro fica fora do guard nesta fase
  it("não bloqueia o status financeiro do pedido", () => {
    expect(() =>
      verificarCamposDerivados("Pedido", { statusFinanceiro: "pago" }),
    ).not.toThrow();
  });

  it("bloqueia o registro problemático dentro de um createMany", () => {
    const registros = [
      { status: StatusOs.bloqueada },
      { status: StatusOs.finalizada },
    ];

    expect(() => verificarCamposDerivados("Producao", registros)).toThrow(
      StatusDerivadoError,
    );
  });

  it("ignora models sem campo derivado", () => {
    expect(() =>
      verificarCamposDerivados("Cliente", { nome: "Fulano" }),
    ).not.toThrow();
  });

  it("ignora escritas que não tocam no campo protegido", () => {
    expect(() =>
      verificarCamposDerivados("Producao", { dataInicio: new Date() }),
    ).not.toThrow();

    expect(() => verificarCamposDerivados("Producao", null)).not.toThrow();
    expect(() => verificarCamposDerivados("Producao", undefined)).not.toThrow();
  });

  it("a mensagem de erro aponta o recalculador correspondente", () => {
    try {
      verificarCamposDerivados("Producao", { status: StatusOs.finalizada });
      expect.unreachable("deveria ter lançado");
    } catch (erro) {
      expect(erro).toBeInstanceOf(StatusDerivadoError);
      const mensagem = erro instanceof Error ? erro.message : "";
      expect(mensagem).toContain("regra 4.3");
      expect(mensagem).toContain("recalcular-status-os");
    }
  });
});
