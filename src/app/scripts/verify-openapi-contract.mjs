#!/usr/bin/env node
/**
 * verify-openapi-contract.mjs
 *
 * Verifica que el contrato canónico del backend disponible en
 * `../inovait-backend/specs/001-school-enrollment-management/contracts`
 * coincide con el baseline contractual autorizado para esta feature.
 *
 * Reglas de validación (alineadas con `specs/.../quickstart.md`):
 *   1. Los 10 archivos YAML esperados existen bajo el directorio contractual.
 *   2. Cada uno de esos archivos está bajo seguimiento en git (tracked).
 *   3. El directorio contractual está limpio (no hay cambios sin commit).
 *   4. El HEAD apunta al commit autorizado o a un sucesor aprobado.
 *   5. El checksum combinado coincide con el SHA-256 registrado.
 *   6. Los `operationId` canónicos coinciden con los esperados para P0.
 *
 * No se mantiene una copia local del OpenAPI: el script solo lee del path
 * indicado y falla si algo no encaja. No modifica archivos.
 */

import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = resolve(__filename, '..');
const FRONTEND_ROOT = resolve(__dirname, '..', '..', '..');

// Baseline contractual autorizado en `docs/evaluator-execution.md`.
const AUTHORIZED_COMMIT = '1223630ab99bf1bfaa4f5919fccf5ff539379c8e';
const AUTHORIZED_CHECKSUM =
  '802c13b91bf5c6425d24c540b6841a2abe134e084ea310fc2b7041e32c24a81a';

// Sucesores aprobados explícitamente. Vacío por defecto; sólo se añaden
// commits verificados manualmente por mantenimiento.
const APPROVED_SUCCESSORS = new Set([
  // 'abc123...', // ejemplo: commit sucesor explícitamente aprobado
]);

// Orden canónico declarado en `quickstart.md`.
const CONTRACT_FILES = [
  'openapi.yaml',
  'paths/catalogs.yaml',
  'paths/enrollments.yaml',
  'paths/teacher-contracts.yaml',
  'paths/reports.yaml',
  'components/catalogs.yaml',
  'components/enrollments.yaml',
  'components/teacher-contracts.yaml',
  'components/reports.yaml',
  'components/problems.yaml',
];

// operationIds que la UI consume en runtime (P0 + esqueleto P1 para gate).
const REQUIRED_OPERATION_IDS = [
  // Catálogos
  'listSchools',
  'listGrades',
  'listAcademicYears',
  'listClassGroups',
  'listTeachers',
  'listSubjects',
  'listTeachersBySchool',
  // Matrículas
  'createEnrollment',
  'listEnrollments',
  // Contratos docentes
  'createTeacherContracts',
  'listTeacherContracts',
  // Reportes (P1, pero el contrato debe estar presente)
  'getAgeDistribution',
  'getTeacherCountsBySector',
  'getTopSchools',
  // Historia (P1)
  'getStudentHistory',
];

class VerificationError extends Error {
  constructor(message) {
    super(message);
    this.name = 'VerificationError';
  }
}

function logStep(message) {
  process.stdout.write(`• ${message}\n`);
}

function logOk(message) {
  process.stdout.write(`  ✓ ${message}\n`);
}

function logFail(message) {
  process.stderr.write(`  ✗ ${message}\n`);
}

function resolveContractsDir(arg) {
  if (arg) {
    return resolve(process.cwd(), arg);
  }
  // Default: ruta relativa esperada para esta feature.
  return resolve(FRONTEND_ROOT, '..', 'inovait-backend', 'specs', '001-school-enrollment-management', 'contracts');
}

function git(cwd, args) {
  return execFileSync('git', args, {
    cwd,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  }).trim();
}

function gitOrNull(cwd, args) {
  try {
    return git(cwd, args);
  } catch {
    return null;
  }
}

function assertFilesTracked(contractsDir) {
  logStep('Verificando que los 10 archivos contractuales están bajo seguimiento');
  const repoRoot = resolve(contractsDir, '..', '..', '..');
  for (const rel of CONTRACT_FILES) {
    const absolute = resolve(contractsDir, rel);
    if (!existsSync(absolute)) {
      throw new VerificationError(
        `Falta archivo contractual: ${rel} (${absolute})`,
      );
    }
    const tracked = gitOrNull(repoRoot, [
      'ls-files',
      '--error-unmatch',
      '--',
      `specs/001-school-enrollment-management/contracts/${rel}`,
    ]);
    if (tracked === null) {
      throw new VerificationError(
        `Archivo contractual fuera del índice git: ${rel}`,
      );
    }
    logOk(`${rel} presente y bajo seguimiento`);
  }
}

function assertContractsClean(contractsDir) {
  logStep('Verificando que el directorio contractual está limpio');
  const repoRoot = resolve(contractsDir, '..', '..', '..');
  const porcelain = git(repoRoot, ['status', '--porcelain', '--', 'specs/001-school-enrollment-management/contracts']);
  if (porcelain.length > 0) {
    throw new VerificationError(
      `El directorio contractual tiene cambios sin commit:\n${porcelain}`,
    );
  }
  logOk('Directorio contractual limpio');
}

function assertAuthorizedCommit(contractsDir) {
  logStep('Verificando commit autorizado o sucesor aprobado');
  const repoRoot = resolve(contractsDir, '..', '..', '..');
  const head = git(repoRoot, ['rev-parse', 'HEAD']);
  if (head !== AUTHORIZED_COMMIT && !APPROVED_SUCCESSORS.has(head)) {
    throw new VerificationError(
      `HEAD no autorizado: ${head}. ` +
        `Autorizado: ${AUTHORIZED_COMMIT}. ` +
        `Aprobados: ${[...APPROVED_SUCCESSORS].join(', ') || '(ninguno)'}`,
    );
  }
  logOk(`Commit autorizado: ${head}`);
}

function computeChecksum(contractsDir) {
  const sha = createHash('sha256');
  for (const rel of CONTRACT_FILES) {
    const absolute = resolve(contractsDir, rel);
    const buffer = readFileSync(absolute);
    const fileHash = createHash('sha256').update(buffer).digest('hex');
    sha.update(fileHash);
  }
  return sha.digest('hex');
}

function assertChecksum(contractsDir) {
  logStep('Verificando checksum combinado (orden canónico)');
  const observed = computeChecksum(contractsDir);
  if (observed !== AUTHORIZED_CHECKSUM) {
    throw new VerificationError(
      `Checksum combinado no coincide.\n` +
        `  observado:  ${observed}\n` +
        `  autorizado: ${AUTHORIZED_CHECKSUM}`,
    );
  }
  logOk(`Checksum combinado verificado: ${observed}`);
}

function extractOperationIds(contractsDir) {
  const openapiPath = resolve(contractsDir, 'openapi.yaml');
  const source = readFileSync(openapiPath, 'utf8');
  // Solo captura líneas `operationId: foo` dentro de openapi.yaml.
  // No usamos un parser YAML para mantener el script 100% Node estándar
  // y sin dependencias de runtime.
  const matches = source.matchAll(/operationId:\s*([A-Za-z0-9_]+)/g);
  return new Set(Array.from(matches, (m) => m[1]));
}

function assertOperationIds(contractsDir) {
  logStep('Verificando operationIds canónicos en openapi.yaml');
  const declared = extractOperationIds(contractsDir);
  const missing = REQUIRED_OPERATION_IDS.filter((id) => !declared.has(id));
  if (missing.length > 0) {
    throw new VerificationError(
      `Faltan operationIds en openapi.yaml: ${missing.join(', ')}`,
    );
  }
  logOk(
    `${REQUIRED_OPERATION_IDS.length} operationIds canónicos presentes`,
  );
}

function assertContractsDirIsDirectory(contractsDir) {
  const stat = statSync(contractsDir);
  if (!stat.isDirectory()) {
    throw new VerificationError(
      `La ruta contractual no es un directorio: ${contractsDir}`,
    );
  }
}

function main() {
  const arg = process.argv[2];
  const contractsDir = resolveContractsDir(arg);

  process.stdout.write(
    `\nverify-openapi-contract — baseline ${AUTHORIZED_COMMIT.slice(0, 12)}\n`,
  );
  process.stdout.write(`Directorio contractual: ${contractsDir}\n\n`);

  if (!existsSync(contractsDir)) {
    throw new VerificationError(
      `No se encontró el directorio contractual: ${contractsDir}`,
    );
  }
  assertContractsDirIsDirectory(contractsDir);
  assertFilesTracked(contractsDir);
  assertContractsClean(contractsDir);
  assertAuthorizedCommit(contractsDir);
  assertChecksum(contractsDir);
  assertOperationIds(contractsDir);

  process.stdout.write('\nContrato verificado correctamente.\n');
}

try {
  main();
} catch (error) {
  if (error instanceof VerificationError) {
    logFail(error.message);
    process.exit(1);
  }
  throw error;
}
