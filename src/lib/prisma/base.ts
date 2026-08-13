import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

/**
 * Cliente Prisma CRU, sem o guard de campos derivados.
 *
 * ⚠️ NÃO IMPORTE ESTE ARQUIVO NA APLICAÇÃO. Use `src/lib/prisma/client.ts`.
 *
 * O único uso legítimo é dentro dos recalculadores (`recalcular-*.ts`), que
 * precisam escrever os campos que o guard bloqueia:
 *   - regra 4.3 — `producoes.status`, agregado de `etapas_os`
 *   - premissa A2 — `pedidos.status_operacional`, agregado das OSs do pedido
 *
 * A restrição é aplicada pelo `no-restricted-imports` em eslint.config.mjs.
 */

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL não definida — ver prisma.config.ts e .env");
}

const adapter = new PrismaPg({ connectionString });

// Em dev o hot reload do Next recria os módulos a cada edição; sem o cache
// global cada reload abriria um novo pool de conexões até estourar o Postgres.
const globalParaPrisma = globalThis as unknown as {
  prismaBase?: PrismaClient;
};

export const prismaBase: PrismaClient =
  globalParaPrisma.prismaBase ?? new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") {
  globalParaPrisma.prismaBase = prismaBase;
}
