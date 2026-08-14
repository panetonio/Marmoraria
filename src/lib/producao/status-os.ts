import { StatusEtapa, StatusOs } from "@prisma/client";

/**
 * regra 4.3 — o status global da OS é derivado/agregado do status das suas
 * etapas (regra 4.4/4.5), não é um campo editado diretamente pelo GP.
 *
 * Função pura: recebe as etapas, devolve o status. A persistência fica em
 * `recalcular-status-os.ts`.
 */

/** Só o que a derivação precisa saber sobre a etapa. */
export interface EtapaDerivacao {
  readonly statusEtapa: StatusEtapa;
}

/**
 * regra 4.3 — `bloqueada` e `cancelada` são ramos de ação do GP/administrador,
 * não estados deriváveis das etapas (StatusEtapa só conhece nao_iniciado,
 * em_andamento e finalizado). Uma OS nesses estados não é recalculada.
 */
export function statusEhAcaoExplicita(status: StatusOs): boolean {
  return status === StatusOs.bloqueada || status === StatusOs.cancelada;
}

/**
 * regra 4.3 — criada → em_andamento → finalizada.
 *
 * - todas as etapas `nao_iniciado`  → `criada`
 * - todas as etapas `finalizado`    → `finalizada`
 * - qualquer outra combinação       → `em_andamento`
 *
 * OS sem etapas permanece `criada`: o fluxo de etapas é herdado da categoria
 * (regra 5.5.3) e é criado junto com a OS, então isso só ocorre em transição.
 */
export function derivarStatusOs(
  etapas: readonly EtapaDerivacao[],
  statusAtual: StatusOs,
): StatusOs {
  // regra 4.3 — bloqueada/cancelada não voltam para o caminho derivado.
  if (statusEhAcaoExplicita(statusAtual)) return statusAtual;

  if (etapas.length === 0) return StatusOs.criada;

  const todasNaoIniciadas = etapas.every(
    (e) => e.statusEtapa === StatusEtapa.nao_iniciado,
  );
  if (todasNaoIniciadas) return StatusOs.criada;

  const todasFinalizadas = etapas.every(
    (e) => e.statusEtapa === StatusEtapa.finalizado,
  );
  if (todasFinalizadas) return StatusOs.finalizada;

  return StatusOs.em_andamento;
}
