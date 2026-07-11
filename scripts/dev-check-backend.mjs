#!/usr/bin/env node
/**
 * dev-check-backend.mjs
 *
 * Verificación previa de alcanzabilidad y CORS del backend de
 * Inovait para la feature `001-school-enrollment-management`.
 *
 * Comprobaciones realizadas:
 *
 *   1. `GET http://localhost:5000/health` (o el endpoint configurado).
 *      Reporta PASS si responde 2xx dentro del timeout, FAIL en caso
 *      contrario con el código de error de bajo nivel.
 *
 *   2. `OPTIONS http://localhost:5000/api/catalogs/schools` con los
 *      headers de un preflight CORS desde
 *      `Origin: http://localhost:4200`. Reporta PASS si el backend
 *      responde con `Access-Control-Allow-Origin` que cubra el origen,
 *      FAIL si el preflight es rechazado o el header no está presente.
 *
 * El script usa exclusivamente la biblioteca estándar de Node y no
 * añade dependencias al `package.json`. Está pensado para ser invocado
 * antes de iniciar el walkthrough de T034; **no sustituye** la
 * verificación funcional manual — sólo automatiza el gate de
 * alcanzabilidad.
 *
 * Códigos de salida:
 *   0 — todas las verificaciones PASS
 *   1 — al menos una verificación FAIL
 *   2 — configuración inválida (sin endpoint ni origen)
 */

import { request } from 'node:http';

const DEFAULT_HEALTH_URL = 'http://localhost:5000/health';
const DEFAULT_PREFLIGHT_URL = 'http://localhost:5000/api/catalogs/schools';
const DEFAULT_ORIGIN = 'http://localhost:4200';
const DEFAULT_TIMEOUT_MS = 5000;

/** @type {{ url: string, method?: string, headers?: Record<string,string>, body?: string, timeoutMs?: number }} */
const options = {
  url: DEFAULT_HEALTH_URL,
  method: 'GET',
  headers: {},
  timeoutMs: DEFAULT_TIMEOUT_MS,
};

/** @type {{ url: string, headers: Record<string,string>, timeoutMs: number }} */
const preflight = {
  url: DEFAULT_PREFLIGHT_URL,
  headers: {
    Origin: DEFAULT_ORIGIN,
    'Access-Control-Request-Method': 'GET',
    'Access-Control-Request-Headers': 'accept,content-type',
  },
  timeoutMs: DEFAULT_TIMEOUT_MS,
};

// Parseo mínimo de flags --url= / --preflight= / --origin= / --timeout=
// (sin dependencias externas, argparse manual).
for (const arg of process.argv.slice(2)) {
  if (arg.startsWith('--url=')) {
    options.url = arg.slice('--url='.length);
  } else if (arg.startsWith('--preflight=')) {
    preflight.url = arg.slice('--preflight='.length);
  } else if (arg.startsWith('--origin=')) {
    preflight.headers.Origin = arg.slice('--origin='.length);
  } else if (arg.startsWith('--timeout=')) {
    const parsed = Number.parseInt(
      arg.slice('--timeout='.length),
      10,
    );
    if (!Number.isNaN(parsed) && parsed > 0) {
      options.timeoutMs = parsed;
      preflight.timeoutMs = parsed;
    }
  } else if (arg === '--help' || arg === '-h') {
    process.stdout.write(
      [
        'Uso: node scripts/dev-check-backend.mjs [opciones]',
        '',
        'Opciones:',
        `  --url=<url>           Endpoint de health (default: ${DEFAULT_HEALTH_URL})`,
        `  --preflight=<url>     Endpoint para CORS preflight (default: ${DEFAULT_PREFLIGHT_URL})`,
        `  --origin=<url>        Origen del frontend (default: ${DEFAULT_ORIGIN})`,
        '  --timeout=<ms>        Timeout por request (default: 5000)',
        '',
        'Códigos de salida: 0 PASS, 1 FAIL, 2 config inválida.',
        '',
      ].join('\n'),
    );
    process.exit(0);
  } else {
    process.stderr.write(`Argumento desconocido: ${arg}\n`);
    process.exit(2);
  }
}

if (!options.url) {
  process.stderr.write('Config inválida: --url vacío\n');
  process.exit(2);
}

let exitCode = 0;

/**
 * Ejecuta un request HTTP plano y resuelve con un descriptor del
 * resultado. No lanza: cualquier error se reporta en `error`.
 *
 * @param {string} url
 * @param {string} method
 * @param {Record<string,string>} headers
 * @param {number} timeoutMs
 * @returns {Promise<{
 *   status: number,
 *   headers: Record<string, string|string[]>,
 *   body: string,
 *   error?: string,
 *   timedOut?: boolean,
 * }>}
 */
function probe(url, method, headers, timeoutMs) {
  return new Promise((resolve) => {
    let parsed;
    try {
      parsed = new URL(url);
    } catch (err) {
      resolve({
        status: 0,
        headers: {},
        body: '',
        error: `URL inválida: ${err instanceof Error ? err.message : String(err)}`,
      });
      return;
    }

    const req = request(
      {
        method,
        hostname: parsed.hostname,
        port: parsed.port || 80,
        path: `${parsed.pathname}${parsed.search}`,
        headers,
      },
      (res) => {
        const chunks = [];
        res.on('data', (chunk) => chunks.push(chunk));
        res.on('end', () => {
          resolve({
            status: res.statusCode ?? 0,
            headers: res.headers,
            body: Buffer.concat(chunks).toString('utf8'),
          });
        });
        res.on('error', (err) => {
          resolve({
            status: res.statusCode ?? 0,
            headers: res.headers,
            body: '',
            error: err.message,
          });
        });
      },
    );

    req.setTimeout(timeoutMs, () => {
      req.destroy(new Error(`timeout después de ${timeoutMs}ms`));
    });

    req.on('error', (err) => {
      resolve({
        status: 0,
        headers: {},
        body: '',
        error: err.message,
        timedOut: err.message.includes('timeout'),
      });
    });

    req.end();
  });
}

/** Devuelve true si el header cubre el origen solicitado. */
function allowsOrigin(headers, origin) {
  const allow = headers['access-control-allow-origin'];
  if (!allow) {
    return false;
  }
  if (allow === '*' || allow === origin) {
    return true;
  }
  // El backend puede devolver el origen exacto entre comillas.
  if (allow === `"${origin}"`) {
    return true;
  }
  return false;
}

function logSection(title) {
  process.stdout.write(`\n• ${title}\n`);
}

function logPass(msg) {
  process.stdout.write(`  ✓ ${msg}\n`);
}

function logFail(msg) {
  process.stderr.write(`  ✗ ${msg}\n`);
}

// 1) Health check ---------------------------------------------------------

logSection(`Health check: ${options.method ?? 'GET'} ${options.url}`);

const healthResult = await probe(
  options.url,
  options.method ?? 'GET',
  options.headers,
  options.timeoutMs,
);

if (healthResult.error) {
  logFail(
    healthResult.timedOut
      ? `Timeout: ${healthResult.error}`
      : `Conexión rechazada o error: ${healthResult.error}`,
  );
  exitCode = 1;
} else if (healthResult.status < 200 || healthResult.status >= 300) {
  logFail(
    `HTTP ${healthResult.status} (esperado 2xx). Body: ${healthResult.body.slice(0, 200)}`,
  );
  exitCode = 1;
} else {
  logPass(`HTTP ${healthResult.status}`);
  if (healthResult.body) {
    const preview = healthResult.body.replace(/\s+/g, ' ').trim().slice(0, 120);
    process.stdout.write(`    body: ${preview}\n`);
  }
}

// 2) CORS preflight -------------------------------------------------------

logSection(
  `CORS preflight: OPTIONS ${preflight.url} (Origin ${preflight.headers.Origin})`,
);

const preflightResult = await probe(
  preflight.url,
  'OPTIONS',
  preflight.headers,
  preflight.timeoutMs,
);

if (preflightResult.error) {
  logFail(
    preflightResult.timedOut
      ? `Timeout: ${preflightResult.error}`
      : `Conexión rechazada o error: ${preflightResult.error}`,
  );
  exitCode = 1;
} else if (preflightResult.status < 200 || preflightResult.status >= 300) {
  logFail(
    `HTTP ${preflightResult.status} (esperado 2xx). El preflight fue rechazado.`,
  );
  exitCode = 1;
} else if (!allowsOrigin(preflightResult.headers, preflight.headers.Origin)) {
  const allow = preflightResult.headers['access-control-allow-origin'];
  logFail(
    `Access-Control-Allow-Origin ausente o no cubre ${preflight.headers.Origin} (recibido: ${allow ?? '(vacío)'}).`,
  );
  exitCode = 1;
} else {
  logPass(
    `HTTP ${preflightResult.status}, Access-Control-Allow-Origin=${preflightResult.headers['access-control-allow-origin']}`,
  );
}

// Resumen -----------------------------------------------------------------

process.stdout.write('\n');
if (exitCode === 0) {
  process.stdout.write('dev-check-backend: PASS\n');
} else {
  process.stderr.write(
    'dev-check-backend: FAIL — el walkthrough manual (T034) no puede continuar hasta corregir los puntos anteriores.\n',
  );
}

process.exit(exitCode);