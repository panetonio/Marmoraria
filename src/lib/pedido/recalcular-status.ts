import { Prisma } from "@prisma/client";

// Único lugar autorizado a escrever `pedidos.status_operacional` (premissa A2)
// — por isso usa o cliente cru, sem o guard. A exceção ao no-restricted-imports
// está declarada em eslint.config.mjs; ver src/lib/prisma/guard.ts.
import { prismaBase } from "@/lib/prisma/base";
import { pedidoExigeMontagem } from "@/lib/orcamento/regras-categoria";

import { derivarStatusOperacional } from "./status-operacional";

/**
 * premissa A2 — recalcula o status operacional do pedido agregando o status de
 * todas as suas OSs. regra 4.1 — o teto aplicável depende de o pedido conter
 * algum item que exija montagem.
 */
export async function recalcularStatusOperacional(
  idPedido: number,
): Promise<void> {
  await prismaBase.$transaction(async (tx) => {
    await recalcularStatusOperacionalNaTransacao(tx, idPedido);
  });
}

/** Versão que participa de uma transação já aberta. */
export async function recalcularStatusOperacionalNaTransacao(
  tx: Prisma.TransactionClient,
  idPedido: number,
): Promise<void> {
  const pedido = await tx.pedido.findUniqueOrThrow({
    where: { idPedido },
    select: {
      statusOperacional: true,
      ordens: {
        select: {
          tipo: true,
          status: true,
          etapas: { select: { nomeEtapa: true, statusEtapa: true } },
        },
      },
      orcamento: {
        select: {
          itens: {
            select: {
              requerMontagem: true,
              categoria: {
                select: { requerProducao: true, requerMontagem: true },
              },
            },
          },
        },
      },
    },
  });

  // regra 4.1 — 'montado' só é alcançável se algum item exigir montagem;
  // regra 5.2 — o item pode sobrescrever a categoria ("depende do item").
  const exigeMontagem = pedidoExigeMontagem(pedido.orcamento.itens);

  const novoStatus = derivarStatusOperacional(pedido.ordens, exigeMontagem);

  if (novoStatus !== pedido.statusOperacional) {
    await tx.pedido.update({
      where: { idPedido },
      data: { statusOperacional: novoStatus },
    });
  }
}
