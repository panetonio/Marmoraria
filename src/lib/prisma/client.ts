import { Prisma } from "@prisma/client";

import { prismaBase } from "./base";
import { verificarCamposDerivados } from "./guard";

/**
 * Cliente Prisma da aplicação. **Importe daqui, nunca de `base.ts`.**
 *
 * regra 4.3 / premissa A2 — bloqueia escrita direta nos status derivados
 * (`producoes.status` e `pedidos.status_operacional`). Só os recalculadores,
 * que usam `prismaBase`, conseguem gravá-los.
 */

const OPERACOES_DE_ESCRITA: ReadonlySet<string> = new Set([
  "create",
  "createMany",
  "createManyAndReturn",
  "update",
  "updateMany",
  "updateManyAndReturn",
  "upsert",
]);

export const guardCamposDerivados = Prisma.defineExtension({
  name: "guard-campos-derivados",
  query: {
    $allModels: {
      async $allOperations({ model, operation, args, query }) {
        if (OPERACOES_DE_ESCRITA.has(operation)) {
          // `args` vem da fronteira dinâmica da extension; narrowing explícito
          // em vez de `any` (CLAUDE.md regra 4).
          const argumentos = args as unknown as Record<string, unknown>;

          // `data` cobre create/createMany/update/updateMany;
          // `create`/`update` cobrem as duas metades do upsert.
          for (const chave of ["data", "create", "update"] as const) {
            if (chave in argumentos) {
              verificarCamposDerivados(model, argumentos[chave]);
            }
          }
        }

        return query(args);
      },
    },
  },
});

export const prisma = prismaBase.$extends(guardCamposDerivados);

export type PrismaEstendido = typeof prisma;
