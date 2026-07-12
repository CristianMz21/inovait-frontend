/// <reference types="node" />
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * CT-A11Y-TOKENS — Fundación EduCore (Fase 1 del re-skin).
 *
 * Verifica el contrato de tokens de `src/styles.scss` tras la adopción del
 * sistema de diseño EduCore. Lee el código fuente de la hoja de estilos
 * directamente (los tokens EduCore nuevos no se referencian todavía desde
 * ningún componente, así que no aparecerían en el CSS con encapsulación de
 * vista compilado que las demás specs de `a11y/` inspeccionan vía
 * `document.head`):
 *
 *   - Los nombres heredados (`--app-muted`, `--app-accent`, `--app-border`)
 *     permanecen estables: las fases siguientes del re-skin (shell, sidebar,
 *     features) dependen de esos nombres literales.
 *   - Las nuevas familias de tokens EduCore (paleta, forma, tipografía)
 *     están presentes con sus nombres definitivos.
 *   - Los invariantes de accesibilidad ya cubiertos por otras specs
 *     (media query 320 px, `prefers-reduced-motion`, contención responsiva)
 *     no se pierden con el cambio de paleta.
 */
describe("CT-A11Y-TOKENS — Contrato de tokens EduCore", () => {
  function readStyles(): string {
    // Resuelto desde la raíz del workspace (no desde `import.meta.url`):
    // el bundler de specs de Vitest reubica los módulos de test al
    // empaquetar la suite completa, por lo que una ruta relativa al
    // propio archivo no es estable entre una corrida enfocada (`--include`)
    // y la corrida completa (`ng test`).
    const stylesPath = resolve(process.cwd(), "src/styles.scss");
    return readFileSync(stylesPath, "utf-8");
  }

  it("mantiene el contrato heredado de tokens de contraste", () => {
    const css = readStyles();
    expect(css).toContain("--app-muted");
    expect(css).toContain("--app-accent");
    expect(css).toContain("--app-border");
  });

  it("expone las nuevas familias de tokens EduCore (paleta, forma, tipografía)", () => {
    const css = readStyles();
    expect(css).toContain("--app-primary");
    expect(css).toContain("--app-sidebar-bg");
    expect(css).toContain("--app-accent-teal");
    expect(css).toContain("--app-warning");
    expect(css).toContain("--app-info");
    expect(css).toContain("--app-font-heading");
    expect(css).toContain("--app-font-body");
  });

  it("conserva la media query de 320 px y prefers-reduced-motion", () => {
    const css = readStyles();
    expect(css).toContain("max-width: 320px");
    expect(css).toContain("prefers-reduced-motion");
  });

  it("conserva el invariante de contención responsiva (min-inline-size)", () => {
    const css = readStyles();
    expect(css).toContain("min-inline-size");
  });
});
