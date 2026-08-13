import { StatusOperacionalPedido, StatusOs } from "@prisma/client";

/**
 * Fronteira de escrita dos campos derivados.
 *
 * regra 4.3 — o status da OS é DERIVADO/AGREGADO de `etapas_os`, não é um campo
 * editado diretamente pelo GP. A coluna existe como cache por performance de
 * query (modelo_relacional.md §5.4), mas só os recalculadores podem escrevê-la.
 *
 * premissa A2 — `pedidos.status_operacional` é agregado do status de todas as
 * OSs do pedido, e recebe o mesmo tratamento.
 *
 * A decisão é uma função pura (`verificarCamposDerivados`) para poder ser
 * testada sem banco; a extension em `client.ts` apenas a invoca.
 */

/**
 * regra 4.3 — dos 5 valores de StatusOs, só estes 3 são deriváveis das etapas.
 * `bloqueada` e `cancelada` não têm correspondente em StatusEtapa: no diagrama
 * da regra 4.3 são ramos de ação (do GP/administrador), não o caminho linear.
 * Por isso continuam graváveis — o RBAC delas é responsabilidade do route handler.
 */
export const STATUS_OS_DERIVADOS: readonly StatusOs[] = [
  StatusOs.criada,
  StatusOs.em_andamento,
  StatusOs.finalizada,
];

/** premissa A2 — todo o status operacional do pedido é agregado das OSs. */
export const STATUS_PEDIDO_DERIVADOS: readonly StatusOperacionalPedido[] = [
  StatusOperacionalPedido.aguardando_producao,
  StatusOperacionalPedido.em_producao,
  StatusOperacionalPedido.entregue,
  StatusOperacionalPedido.montado,
];

export class StatusDerivadoError extends Error {
  constructor(
    readonly model: string,
    readonly campo: string,
    readonly valor: string,
  ) {
    super(
      `${model}.${campo} = '${valor}' é um status derivado (regra 4.3) e não ` +
        `pode ser escrito diretamente. Use o recalculador correspondente em ` +
        `src/lib/${model === "Producao" ? "producao/recalcular-status-os" : "pedido/recalcular-status"}.ts.`,
    );
    this.name = "StatusDerivadoError";
  }
}

/** Model + campo protegido + valores que só o recalculador pode gravar. */
const CAMPOS_PROTEGIDOS: ReadonlyArray<{
  model: string;
  campo: string;
  derivados: readonly string[];
}> = [
  { model: "Producao", campo: "status", derivados: STATUS_OS_DERIVADOS },
  {
    model: "Pedido",
    campo: "statusOperacional",
    derivados: STATUS_PEDIDO_DERIVADOS,
  },
];

/**
 * Extrai o valor efetivo de um campo do `data` de uma operação Prisma.
 * O Prisma aceita tanto `{ status: 'x' }` quanto `{ status: { set: 'x' } }`.
 * `unknown` + narrowing explícito — CLAUDE.md regra 4, nada de `any`.
 */
function extrairValor(data: unknown, campo: string): string | undefined {
  if (typeof data !== "object" || data === null) return undefined;

  const registro: Record<string, unknown> = data as Record<string, unknown>;
  if (!(campo in registro)) return undefined;

  const bruto = registro[campo];
  if (typeof bruto === "string") return bruto;

  // forma `{ set: valor }`
  if (typeof bruto === "object" && bruto !== null && "set" in bruto) {
    const encapsulado = (bruto as { set: unknown }).set;
    if (typeof encapsulado === "string") return encapsulado;
  }

  return undefined;
}

/**
 * Lança `StatusDerivadoError` se o `data` tentar gravar um status derivado.
 * `data` pode ser um objeto ou um array (createMany), e é `unknown` porque
 * vem da fronteira dinâmica da extension do Prisma.
 */
export function verificarCamposDerivados(model: string, data: unknown): void {
  const protegido = CAMPOS_PROTEGIDOS.find((p) => p.model === model);
  if (!protegido) return;

  const registros: unknown[] = Array.isArray(data) ? data : [data];

  for (const registro of registros) {
    const valor = extrairValor(registro, protegido.campo);
    if (valor !== undefined && protegido.derivados.includes(valor)) {
      throw new StatusDerivadoError(protegido.model, protegido.campo, valor);
    }
  }
}
