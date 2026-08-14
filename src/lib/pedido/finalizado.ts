import { StatusFinanceiroPedido, StatusOperacionalPedido } from "@prisma/client";

/**
 * regra 4.1 — "Finalizado" é uma condição DERIVADA, não um status armazenado:
 *
 *   Finalizado = status_operacional atingiu seu teto aplicável
 *                (entregue, ou montado quando exigido)
 *                E status_financeiro = pago
 *
 * CLAUDE.md regra 7 — se a UI precisar desse estado, ela calcula; não existe
 * coluna "finalizado" e não deve existir.
 */

export interface PedidoFinalizacao {
  readonly statusOperacional: StatusOperacionalPedido;
  readonly statusFinanceiro: StatusFinanceiroPedido;
}

/**
 * regra 4.1 — teto operacional aplicável ao pedido: `montado` quando algum
 * item exige montagem, `entregue` caso contrário.
 */
export function tetoOperacional(
  exigeMontagem: boolean,
): StatusOperacionalPedido {
  return exigeMontagem
    ? StatusOperacionalPedido.montado
    : StatusOperacionalPedido.entregue;
}

/** regra 4.1 — condição derivada de "Finalizado". */
export function estaFinalizado(
  pedido: PedidoFinalizacao,
  exigeMontagem: boolean,
): boolean {
  return (
    pedido.statusOperacional === tetoOperacional(exigeMontagem) &&
    pedido.statusFinanceiro === StatusFinanceiroPedido.pago
  );
}
