import type { TeacherContractResponse } from "../../app/core/api/dtos/teacher-contract-response.dto";

/**
 * Fixture de respuesta canónica de
 * `POST /api/teachers/{teacherId}/contracts` (operationId
 * `createTeacherContracts`) cuando el backend responde 201 con dos
 * contratos Confirmed en escuelas distintas. Refleja el `example`
 * declarado en `paths/teacher-contracts.yaml`.
 */
export const teacherContractsCreatedFixture: readonly TeacherContractResponse[] =
  [
    {
      id: 20,
      teacherId: 5,
      school: { id: 1, name: "Escuela Río Claro", sector: "Public" },
      startDate: "2026-03-01",
      endDate: null,
      persistedStatus: "Confirmed",
      effectiveStatus: "Effective",
      evaluatedAt: "2026-07-10",
    },
    {
      id: 21,
      teacherId: 5,
      school: { id: 2, name: "Instituto Horizonte", sector: "Private" },
      startDate: "2026-03-01",
      endDate: null,
      persistedStatus: "Confirmed",
      effectiveStatus: "Effective",
      evaluatedAt: "2026-07-10",
    },
  ];

/**
 * Fixture de respuesta canónica de
 * `GET /api/teachers/{teacherId}/contracts` (operationId
 * `listTeacherContracts`) cuando el backend responde 200 con dos
 * contratos históricos del docente. Refleja el `example` declarado en
 * `paths/teacher-contracts.yaml` para el método GET.
 */
export const teacherContractsListedFixture: readonly TeacherContractResponse[] =
  [
    {
      id: 20,
      teacherId: 5,
      school: { id: 1, name: "Escuela Río Claro", sector: "Public" },
      startDate: "2025-03-03",
      endDate: "2025-12-19",
      persistedStatus: "Cancelled",
      effectiveStatus: "Expired",
      evaluatedAt: "2026-07-10",
    },
    {
      id: 21,
      teacherId: 5,
      school: { id: 2, name: "Instituto Horizonte", sector: "Private" },
      startDate: "2026-03-02",
      endDate: null,
      persistedStatus: "Confirmed",
      effectiveStatus: "Effective",
      evaluatedAt: "2026-07-10",
    },
  ];

/**
 * Fixture del payload canónico `200 []` — docente sin contratos
 * registrados. Refleja el escenario "Consulta inicial sin contratos"
 * de `FR-TC-003`.
 */
export const emptyTeacherContractsListedFixture: readonly TeacherContractResponse[] =
  [];
