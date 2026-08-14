/**
 * Regras derivadas da categoria do item (regra 5.2).
 *
 * A categoria determina automaticamente qual fluxo de OS o item vai gerar:
 *
 * | Categoria                  | Requer Produção | Requer Montagem  | Acabamento |
 * |----------------------------|-----------------|------------------|------------|
 * | Soleira/Peitoril           | Sim             | Nunca            | simples    |
 * | Pia/Lavatório/Balcão/Nicho | Sim             | Geralmente sim   | completo   |
 * | Pedra Decorativa           | Não             | Não              | N/A        |
 * | Padrão                     | Sim             | Depende do item  | por item   |
 */

/** Só o que as regras de fluxo precisam saber sobre a categoria. */
export interface CategoriaFluxo {
  readonly requerProducao: boolean;
  readonly requerMontagem: boolean;
}

/** Só o que as regras de fluxo precisam saber sobre o item. */
export interface ItemFluxo {
  /** null = herda a categoria; true/false = override explícito do item. */
  readonly requerMontagem: boolean | null;
  readonly categoria: CategoriaFluxo;
}

/**
 * regra 5.2 — a categoria "Padrão" tem montagem "dependendo do item", por isso
 * o item pode sobrescrever a categoria. `null` significa "herda a categoria".
 *
 * Nota: o override vale para qualquer categoria, não só "Padrão". Isso cobre o
 * "geralmente sim" da Pia (um balcão específico pode não precisar de montagem)
 * sem precisar de uma exceção codificada por nome de categoria.
 */
export function itemRequerMontagem(item: ItemFluxo): boolean {
  return item.requerMontagem ?? item.categoria.requerMontagem;
}

/**
 * regra 4.1 — 'montado' só é alcançável se o pedido contém item que requer
 * montagem; caso contrário 'entregue' é o teto operacional.
 */
export function pedidoExigeMontagem(itens: readonly ItemFluxo[]): boolean {
  return itens.some(itemRequerMontagem);
}
