import { describe, expect, it } from "vitest";

import {
  itemRequerMontagem,
  pedidoExigeMontagem,
  type CategoriaFluxo,
} from "./regras-categoria";

// regra 5.2 — as 4 categorias do MVP, com a premissa A1 confirmada
const soleira: CategoriaFluxo = { requerProducao: true, requerMontagem: false };
const pia: CategoriaFluxo = { requerProducao: true, requerMontagem: true };
const decorativa: CategoriaFluxo = {
  requerProducao: false,
  requerMontagem: false,
};
const padrao: CategoriaFluxo = { requerProducao: true, requerMontagem: false };

describe("itemRequerMontagem — regra 5.2", () => {
  it("sem override, herda a categoria", () => {
    expect(itemRequerMontagem({ requerMontagem: null, categoria: soleira })).toBe(
      false,
    );
    expect(itemRequerMontagem({ requerMontagem: null, categoria: pia })).toBe(
      true,
    );
    expect(
      itemRequerMontagem({ requerMontagem: null, categoria: decorativa }),
    ).toBe(false);
  });

  // regra 5.2 — categoria "Padrão": montagem "depende do item"
  it("item da categoria Padrão pode exigir montagem via override", () => {
    expect(itemRequerMontagem({ requerMontagem: true, categoria: padrao })).toBe(
      true,
    );
    expect(
      itemRequerMontagem({ requerMontagem: null, categoria: padrao }),
    ).toBe(false);
  });

  it("override false vence o 'geralmente sim' da Pia", () => {
    expect(itemRequerMontagem({ requerMontagem: false, categoria: pia })).toBe(
      false,
    );
  });
});

describe("pedidoExigeMontagem — regra 4.1", () => {
  it("pedido só de soleira não exige montagem", () => {
    const itens = [
      { requerMontagem: null, categoria: soleira },
      { requerMontagem: null, categoria: soleira },
    ];

    expect(pedidoExigeMontagem(itens)).toBe(false);
  });

  it("um único item com montagem já muda o teto do pedido", () => {
    const itens = [
      { requerMontagem: null, categoria: soleira },
      { requerMontagem: null, categoria: pia },
    ];

    expect(pedidoExigeMontagem(itens)).toBe(true);
  });

  it("pedido sem itens não exige montagem", () => {
    expect(pedidoExigeMontagem([])).toBe(false);
  });
});
