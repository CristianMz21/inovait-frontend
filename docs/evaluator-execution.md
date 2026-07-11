# Registro de ejecución del evaluador: WU00 (Governance / prereq)

## Alcance y estado

- Cambio: `001-school-enrollment-management`
- Slice objetivo: `WU00` (Governance + prereq)
- Modo: Frontend-only
- Estado: **Baseline creado (pre-ejecución)**
- Fecha: 2026-07-11

## Referencia contractual (inmutable)

- Backend source of truth: `../inovait-backend/specs/001-school-enrollment-management/contracts/openapi.yaml`
- Commit autorizado: `1223630ab99bf1bfaa4f5919fccf5ff539379c8e`
- Checksum combinado (10 YAML): `802c13b91bf5c6425d24c540b6841a2abe134e084ea310fc2b7041e32c24a81a`
- Orden de verificación (canonical):

```bash
sha256sum openapi.yaml \
  paths/catalogs.yaml paths/enrollments.yaml paths/teacher-contracts.yaml paths/reports.yaml \
  components/catalogs.yaml components/enrollments.yaml components/teacher-contracts.yaml components/reports.yaml components/problems.yaml |
  sha256sum
```

## Estado de tareas WU00

| Tarea | Estado | Evidencia | Observaciones |
|---|---|---|---|
| T001 | ✅ Completada | `angular.json`, `package.json` y `src/` no existen en la raíz del repo | Validación realizada contra el FS del cambio |
| T002 | ✅ Completada | `docs/evaluator-execution.md` creado como baseline | Matriz vacía (placeholders) lista para llenado posterior |
| T003 | ✅ Completada (predefinida) | Cadena elegida: `stacked-to-main` | Registrada en `tasks.md` y plan de PRs |
| T004 | ✅ Completada | SHA + checksum autorizados registrados como referencia base | Valores congelados en esta sección |

## Matriz P0 (placeholder inicial)

> Esta matriz define la estructura base. Durante las WU posteriores se completan
> columnas `Estado`, `Resultado`, `Prueba` y `Evidencia` con captura temporal.

### 1) Matrículas (`/enrollments`)

| Escenario | Estado remoto esperado | Errores canónicos | Indicador de evidencia |
|---|---|---|---|
| Alta válida de nuevo estudiante | loading / success | 400/404/409/422 (según contrato) | [ ] Pendiente |
| Identidad reutilizable por año distinto | loading / success | 400/404/409/422 (según contrato) | [ ] Pendiente |
| Segundo alta del mismo año | error canónico, no mutación parcial | 409 + ProblemDetails | [ ] Pendiente |
| Selectores dependientes | estados excluyentes + limpieza descendente | 400/404/409/422 si aplica | [ ] Pendiente |

### 2) Consulta (`/student-search`)

| Escenario | Estado remoto esperado | Errores canónicos | Indicador de evidencia |
|---|---|---|---|
| Búsqueda con resultados válidos | loading / success | 404 si referencia inexistente | [ ] Pendiente |
| Sin resultados | loading / empty | no-resultado no es error | [ ] Pendiente |
| Combinación sin grupos | loading / no-groups | 200 con estado `noGroups` | [ ] Pendiente |
| Cambios de filtros activos | loading -> success/error/empty según sea | error recopiado al contexto correcto | [ ] Pendiente |
| Reintento | reload remoto con reset de estado | error recuperable y posterior success/empty | [ ] Pendiente |

### 3) Contratos docentes (`/teacher-contracts`)

| Escenario | Estado remoto esperado | Errores canónicos | Indicador de evidencia |
|---|---|---|---|
| Solicitud válida multiescuela | loading / success | 422/409/400/404 (según contrato) | [ ] Pendiente |
| Fallo parcial en backend | no creación visible | error canónico y estado conservado para corrección | [ ] Pendiente |
| Validación local de rango | validación bloqueante local | 422 evitado por validación local | [ ] Pendiente |
| Consulta por docente | loading / success / empty | 404 por identidad inexistente | [ ] Pendiente |

## Secciones de evidencia (para completar más adelante)

### E01 — Estados remotos y consistencia

- [ ] Enlace de evidencia pendiente.

### E02 — Accesibilidad y usabilidad P0

- [ ] Enlace de evidencia pendiente.

### E03 — Contract + contrato canónico

- [ ] Enlace de evidencia pendiente.

### E04 — Integración con backend real / CORS

- [ ] Enlace de evidencia pendiente.

## Notas operativas

- Antes de ejecutar WU01+, el contrato debe mantenerse bajo seguimiento y la línea
  base de backend validada contra el `checksum` registrado.
- Los P1 (`/reports`, `/student-history`) permanecen bloqueados hasta cierre de la
  puerta P0.
