import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
  // regra 4.3 / premissa A2 — `src/lib/prisma/base.ts` é o cliente sem o guard
  // dos status derivados. Só os recalculadores podem usá-lo; o resto da
  // aplicação importa `src/lib/prisma/client.ts`.
  {
    files: ["src/**/*.{ts,tsx}"],
    ignores: ["src/lib/prisma/*.ts", "src/lib/**/recalcular-*.ts"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["**/lib/prisma/base", "**/prisma/base"],
              message:
                "Importe `prisma` de src/lib/prisma/client.ts. O cliente cru (base.ts) ignora o guard dos status derivados (regra 4.3) e só pode ser usado nos recalculadores.",
            },
          ],
        },
      ],
    },
  },
]);

export default eslintConfig;
