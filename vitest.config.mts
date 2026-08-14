import { fileURLToPath } from "node:url";

import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
    coverage: {
      provider: "v8",
      include: [
        // CLAUDE.md regra 5 — cobertura > 80% da lógica de negócio.
        "src/lib/pedido/**",
        "src/lib/producao/**",
        "src/lib/orcamento/**",
        "src/lib/prisma/guard.ts",
      ],
      thresholds: {
        statements: 80,
        branches: 80,
        functions: 80,
        lines: 80,
      },
    },
  },
});
