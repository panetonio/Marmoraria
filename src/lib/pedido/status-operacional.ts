import {
  NomeEtapa,
  StatusEtapa,
  StatusOperacionalPedido,
  StatusOs,
  TipoOs,
} from "@prisma/client";

/**
 * premissa A2 (Consolidado §9) — o status operacional do PEDIDO é agregado a
 * partir do status de todas as suas OSs. regra 4.1 — 'montado' só é alcançável
 * se o pedido contém item que requer montagem; senão 'entregue' é o teto.
 *
 * Função pura: recebe as OSs e se o pedido exige montagem, devolve o status.
 * A persistência fica em `recalcular-status.ts`.
 */

export interface EtapaPedido {
  readonly nomeEtapa: NomeEtapa;
  readonly statusEtapa: StatusEtapa;
}

export interface OsPedido {
  readonly tipo: TipoOs;
  readonly status: StatusOs;
  readonly etapas: readonly EtapaPedido[];
}

/** Consolidado §4.4 — tipos de OS que terminam em "Entrega Confirmada". */
const TIPOS_QUE_ENTREGAM: readonly TipoOs[] = [TipoOs.entrega, TipoOs.decorativa];

function temEtapaFinalizada(os: OsPedido, nome: NomeEtapa): boolean {
  return os.etapas.some(
    (e) => e.nomeEtapa === nome && e.statusEtapa === StatusEtapa.finalizado,
  );
}

/**
 * premissa A2 — agrega o status das OSs do pedido.
 *
 * - `aguardando_producao`: nenhuma OS relevante saiu de `criada`
 * - `em_producao`: alguma OS já andou, mas a entrega ainda não fechou
 * - `entregue`: toda OS de produção está `finalizada` E toda OS que entrega
 *   (entrega/decorativa) tem `entrega_confirmada` finalizada — e existe ao
 *   menos uma OS que entrega
 * - `montado`: além de entregue, o pedido exige montagem (regra 4.1) e toda OS
 *   de montagem tem `confirmacao_cliente` finalizada
 *
 * OSs `cancelada` são ignoradas — não seguram nem antecipam o pedido.
 */
export function derivarStatusOperacional(
  ordens: readonly OsPedido[],
  exigeMontagem: boolean,
): StatusOperacionalPedido {
  const relevantes = ordens.filter((os) => os.status !== StatusOs.cancelada);

  if (relevantes.length === 0) {
    return StatusOperacionalPedido.aguardando_producao;
  }

  const producaoCompleta = relevantes
    .filter((os) => os.tipo === TipoOs.producao)
    .every((os) => os.status === StatusOs.finalizada);

  const ordensQueEntregam = relevantes.filter((os) =>
    TIPOS_QUE_ENTREGAM.includes(os.tipo),
  );

  const entregaCompleta =
    ordensQueEntregam.length > 0 &&
    ordensQueEntregam.every((os) =>
      temEtapaFinalizada(os, NomeEtapa.entrega_confirmada),
    );

  if (producaoCompleta && entregaCompleta) {
    // regra 4.1 — sem item que requeira montagem, 'entregue' é o teto.
    if (!exigeMontagem) return StatusOperacionalPedido.entregue;

    const ordensDeMontagem = relevantes.filter(
      (os) => os.tipo === TipoOs.montagem,
    );

    const montagemCompleta =
      ordensDeMontagem.length > 0 &&
      ordensDeMontagem.every((os) =>
        temEtapaFinalizada(os, NomeEtapa.confirmacao_cliente),
      );

    return montagemCompleta
      ? StatusOperacionalPedido.montado
      : StatusOperacionalPedido.entregue;
  }

  const nadaComecou = relevantes.every((os) => os.status === StatusOs.criada);

  return nadaComecou
    ? StatusOperacionalPedido.aguardando_producao
    : StatusOperacionalPedido.em_producao;
}
