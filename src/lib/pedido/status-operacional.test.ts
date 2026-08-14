import {
  NomeEtapa,
  StatusEtapa,
  StatusOperacionalPedido,
  StatusOs,
  TipoOs,
} from "@prisma/client";
import { describe, expect, it } from "vitest";

import { derivarStatusOperacional, type OsPedido } from "./status-operacional";

/** OS de produção já finalizada (Corte + Acabamento prontos). */
const producaoFinalizada: OsPedido = {
  tipo: TipoOs.producao,
  status: StatusOs.finalizada,
  etapas: [
    { nomeEtapa: NomeEtapa.corte, statusEtapa: StatusEtapa.finalizado },
    { nomeEtapa: NomeEtapa.acabamento, statusEtapa: StatusEtapa.finalizado },
  ],
};

/** Consolidado §4.4 — OS de entrega com a última etapa confirmada. */
const entregaConfirmada: OsPedido = {
  tipo: TipoOs.entrega,
  status: StatusOs.finalizada,
  etapas: [
    {
      nomeEtapa: NomeEtapa.checklist_expedicao,
      statusEtapa: StatusEtapa.finalizado,
    },
    {
      nomeEtapa: NomeEtapa.saida_para_entrega,
      statusEtapa: StatusEtapa.finalizado,
    },
    {
      nomeEtapa: NomeEtapa.entrega_confirmada,
      statusEtapa: StatusEtapa.finalizado,
    },
  ],
};

const montagemConfirmada: OsPedido = {
  tipo: TipoOs.montagem,
  status: StatusOs.finalizada,
  etapas: [
    { nomeEtapa: NomeEtapa.montagem, statusEtapa: StatusEtapa.finalizado },
    {
      nomeEtapa: NomeEtapa.confirmacao_cliente,
      statusEtapa: StatusEtapa.finalizado,
    },
  ],
};

describe("derivarStatusOperacional — premissa A2", () => {
  it("pedido sem OS fica em 'aguardando_producao'", () => {
    expect(derivarStatusOperacional([], false)).toBe(
      StatusOperacionalPedido.aguardando_producao,
    );
  });

  it("OS criada mas não iniciada mantém 'aguardando_producao'", () => {
    const ordens: OsPedido[] = [
      { tipo: TipoOs.producao, status: StatusOs.criada, etapas: [] },
    ];

    expect(derivarStatusOperacional(ordens, false)).toBe(
      StatusOperacionalPedido.aguardando_producao,
    );
  });

  it("OS em andamento leva o pedido a 'em_producao'", () => {
    const ordens: OsPedido[] = [
      { tipo: TipoOs.producao, status: StatusOs.em_andamento, etapas: [] },
    ];

    expect(derivarStatusOperacional(ordens, false)).toBe(
      StatusOperacionalPedido.em_producao,
    );
  });

  // regra 4.1 — sem item que exija montagem, 'entregue' é o teto operacional
  it("pedido só de soleira chega a 'entregue' e para lá", () => {
    const ordens = [producaoFinalizada, entregaConfirmada];

    expect(derivarStatusOperacional(ordens, false)).toBe(
      StatusOperacionalPedido.entregue,
    );
  });

  it("pedido com pia só chega a 'montado' após a confirmação do cliente", () => {
    const ordens = [producaoFinalizada, entregaConfirmada, montagemConfirmada];

    expect(derivarStatusOperacional(ordens, true)).toBe(
      StatusOperacionalPedido.montado,
    );
  });

  // caminho de bloqueio: exige montagem, entregue, mas montagem não confirmada
  it("pedido que exige montagem fica em 'entregue' enquanto o cliente não confirma", () => {
    const montagemPendente: OsPedido = {
      tipo: TipoOs.montagem,
      status: StatusOs.em_andamento,
      etapas: [
        { nomeEtapa: NomeEtapa.montagem, statusEtapa: StatusEtapa.finalizado },
        {
          nomeEtapa: NomeEtapa.confirmacao_cliente,
          statusEtapa: StatusEtapa.nao_iniciado,
        },
      ],
    };

    const ordens = [producaoFinalizada, entregaConfirmada, montagemPendente];

    expect(derivarStatusOperacional(ordens, true)).toBe(
      StatusOperacionalPedido.entregue,
    );
  });

  it("pedido que exige montagem sem OS de montagem criada fica em 'entregue'", () => {
    const ordens = [producaoFinalizada, entregaConfirmada];

    expect(derivarStatusOperacional(ordens, true)).toBe(
      StatusOperacionalPedido.entregue,
    );
  });

  it("produção pronta mas entrega não confirmada mantém 'em_producao'", () => {
    const entregaPendente: OsPedido = {
      tipo: TipoOs.entrega,
      status: StatusOs.em_andamento,
      etapas: [
        {
          nomeEtapa: NomeEtapa.checklist_expedicao,
          statusEtapa: StatusEtapa.finalizado,
        },
        {
          nomeEtapa: NomeEtapa.entrega_confirmada,
          statusEtapa: StatusEtapa.nao_iniciado,
        },
      ],
    };

    expect(
      derivarStatusOperacional([producaoFinalizada, entregaPendente], false),
    ).toBe(StatusOperacionalPedido.em_producao);
  });

  it("uma OS de produção pendente segura o pedido, mesmo com a entrega da outra confirmada", () => {
    const producaoPendente: OsPedido = {
      tipo: TipoOs.producao,
      status: StatusOs.em_andamento,
      etapas: [
        { nomeEtapa: NomeEtapa.corte, statusEtapa: StatusEtapa.em_andamento },
      ],
    };

    expect(
      derivarStatusOperacional(
        [producaoFinalizada, producaoPendente, entregaConfirmada],
        false,
      ),
    ).toBe(StatusOperacionalPedido.em_producao);
  });

  it("OS cancelada é ignorada e não segura o pedido", () => {
    const cancelada: OsPedido = {
      tipo: TipoOs.producao,
      status: StatusOs.cancelada,
      etapas: [
        { nomeEtapa: NomeEtapa.corte, statusEtapa: StatusEtapa.nao_iniciado },
      ],
    };

    expect(
      derivarStatusOperacional(
        [producaoFinalizada, entregaConfirmada, cancelada],
        false,
      ),
    ).toBe(StatusOperacionalPedido.entregue);
  });

  it("pedido com todas as OSs canceladas volta a 'aguardando_producao'", () => {
    const ordens: OsPedido[] = [
      { tipo: TipoOs.producao, status: StatusOs.cancelada, etapas: [] },
    ];

    expect(derivarStatusOperacional(ordens, false)).toBe(
      StatusOperacionalPedido.aguardando_producao,
    );
  });

  // Consolidado §4.4 — a OS decorativa pula produção e entrega direto
  it("OS decorativa entrega o pedido sem passar por produção", () => {
    const decorativa: OsPedido = {
      tipo: TipoOs.decorativa,
      status: StatusOs.finalizada,
      etapas: [
        {
          nomeEtapa: NomeEtapa.checklist_expedicao,
          statusEtapa: StatusEtapa.finalizado,
        },
        {
          nomeEtapa: NomeEtapa.entrega_confirmada,
          statusEtapa: StatusEtapa.finalizado,
        },
      ],
    };

    expect(derivarStatusOperacional([decorativa], false)).toBe(
      StatusOperacionalPedido.entregue,
    );
  });

  it("OS bloqueada segura o pedido em 'em_producao'", () => {
    const bloqueada: OsPedido = {
      tipo: TipoOs.producao,
      status: StatusOs.bloqueada,
      etapas: [
        { nomeEtapa: NomeEtapa.corte, statusEtapa: StatusEtapa.em_andamento },
      ],
    };

    expect(
      derivarStatusOperacional([bloqueada, entregaConfirmada], false),
    ).toBe(StatusOperacionalPedido.em_producao);
  });
});
