import { Prisma } from "@prisma/client";

// Único lugar autorizado a escrever `producoes.status` (regra 4.3) — por isso
// usa o cliente cru, sem o guard. A exceção ao no-restricted-imports está
// declarada em eslint.config.mjs; ver src/lib/prisma/guard.ts.
import { prismaBase } from "@/lib/prisma/base";

import { derivarStatusOs } from "./status-os";
import { recalcularStatusOperacionalNaTransacao } from "@/lib/pedido/recalcular-status";

/**
 * regra 4.3 — recalcula o status da OS a partir das suas etapas e cascateia
 * para o status operacional do pedido dono (premissa A2).
 *
 * Os dois recálculos rodam na MESMA transação: um pedido cujo status não
 * reflita o das suas OSs é um estado inválido que nunca deve ser observável.
 */
export async function recalcularStatusOs(idOs: number): Promise<void> {
  await prismaBase.$transaction(async (tx) => {
    await recalcularStatusOsNaTransacao(tx, idOs);
  });
}

/**
 * Versão que participa de uma transação já aberta — use quando o recálculo faz
 * parte de uma operação maior (ex: o GP finalizar uma etapa).
 */
export async function recalcularStatusOsNaTransacao(
  tx: Prisma.TransactionClient,
  idOs: number,
): Promise<void> {
  const os = await tx.producao.findUniqueOrThrow({
    where: { idOs },
    select: {
      idPedido: true,
      status: true,
      etapas: { select: { statusEtapa: true } },
    },
  });

  const novoStatus = derivarStatusOs(os.etapas, os.status);

  if (novoStatus !== os.status) {
    await tx.producao.update({
      where: { idOs },
      data: { status: novoStatus },
    });
  }

  // premissa A2 — o status do pedido é agregado das suas OSs; qualquer mudança
  // aqui pode mover o pedido, então o recálculo sempre cascateia.
  await recalcularStatusOperacionalNaTransacao(tx, os.idPedido);
}
