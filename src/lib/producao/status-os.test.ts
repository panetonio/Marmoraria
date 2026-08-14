import { StatusEtapa, StatusOs } from "@prisma/client";
import { describe, expect, it } from "vitest";

import { derivarStatusOs, statusEhAcaoExplicita } from "./status-os";

const etapa = (statusEtapa: StatusEtapa) => ({ statusEtapa });

describe("derivarStatusOs — regra 4.3", () => {
  it("todas as etapas não iniciadas mantém a OS em 'criada'", () => {
    const etapas = [
      etapa(StatusEtapa.nao_iniciado),
      etapa(StatusEtapa.nao_iniciado),
    ];

    expect(derivarStatusOs(etapas, StatusOs.criada)).toBe(StatusOs.criada);
  });

  it("todas as etapas finalizadas levam a OS a 'finalizada'", () => {
    const etapas = [
      etapa(StatusEtapa.finalizado),
      etapa(StatusEtapa.finalizado),
    ];

    expect(derivarStatusOs(etapas, StatusOs.em_andamento)).toBe(
      StatusOs.finalizada,
    );
  });

  it("qualquer etapa em andamento leva a OS a 'em_andamento'", () => {
    const etapas = [
      etapa(StatusEtapa.em_andamento),
      etapa(StatusEtapa.nao_iniciado),
    ];

    expect(derivarStatusOs(etapas, StatusOs.criada)).toBe(
      StatusOs.em_andamento,
    );
  });

  it("mistura de finalizado e não iniciado é 'em_andamento' (corte pronto, acabamento não começou)", () => {
    // regra 4.5 — fluxo típico: Corte finalizado, Acabamento aguardando alocação
    const etapas = [
      etapa(StatusEtapa.finalizado),
      etapa(StatusEtapa.nao_iniciado),
    ];

    expect(derivarStatusOs(etapas, StatusOs.criada)).toBe(
      StatusOs.em_andamento,
    );
  });

  it("OS sem etapas permanece 'criada'", () => {
    expect(derivarStatusOs([], StatusOs.criada)).toBe(StatusOs.criada);
  });

  // regra 4.3 — caminho de bloqueio: ramos de ação não voltam ao caminho derivado
  it("OS bloqueada não é recalculada, mesmo com todas as etapas finalizadas", () => {
    const etapas = [
      etapa(StatusEtapa.finalizado),
      etapa(StatusEtapa.finalizado),
    ];

    expect(derivarStatusOs(etapas, StatusOs.bloqueada)).toBe(
      StatusOs.bloqueada,
    );
  });

  it("OS cancelada não é recalculada, mesmo com etapas em andamento", () => {
    const etapas = [etapa(StatusEtapa.em_andamento)];

    expect(derivarStatusOs(etapas, StatusOs.cancelada)).toBe(
      StatusOs.cancelada,
    );
  });
});

describe("statusEhAcaoExplicita — regra 4.3", () => {
  it("bloqueada e cancelada são ações, não estados derivados", () => {
    expect(statusEhAcaoExplicita(StatusOs.bloqueada)).toBe(true);
    expect(statusEhAcaoExplicita(StatusOs.cancelada)).toBe(true);
  });

  it("os três estados do caminho linear são derivados", () => {
    expect(statusEhAcaoExplicita(StatusOs.criada)).toBe(false);
    expect(statusEhAcaoExplicita(StatusOs.em_andamento)).toBe(false);
    expect(statusEhAcaoExplicita(StatusOs.finalizada)).toBe(false);
  });
});
