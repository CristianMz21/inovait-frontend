/// <reference types="node" />
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

/**
 * Lee `src/styles.scss` para los contratos de a11y (`src/app/a11y/*.spec.ts`)
 * que verifican tokens y media queries directamente en la hoja global — los
 * tokens EduCore no se referencian todavía desde ningún componente, así que
 * no aparecerían en el CSS con encapsulación de vista compilado que otras
 * specs inspeccionan vía `document.head`.
 *
 * La raíz del repo se resuelve subiendo desde `process.cwd()` hasta
 * encontrar `package.json`, en vez de:
 *   - asumir que `process.cwd()` ES la raíz (frágil si el runner se invoca
 *     desde otro directorio de trabajo), o
 *   - usar `import.meta.url` — el bundler de specs de Vitest reubica los
 *     módulos de test al empaquetar la suite completa, así que una ruta
 *     relativa al propio archivo no es estable entre una corrida enfocada
 *     (`--include`) y la corrida completa (`ng test`).
 */
function findRepoRoot(startDir: string): string {
  let dir = startDir;
  while (!existsSync(resolve(dir, "package.json"))) {
    const parent = dirname(dir);
    if (parent === dir) {
      return startDir;
    }
    dir = parent;
  }
  return dir;
}

export function readGlobalStyles(): string {
  const repoRoot = findRepoRoot(process.cwd());
  const stylesPath = resolve(repoRoot, "src/styles.scss");
  return readFileSync(stylesPath, "utf-8");
}
