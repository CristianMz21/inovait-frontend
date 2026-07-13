/* Copyright (c) 2026. All rights reserved. */
import type { TeacherContractResponse } from "../../core/api/dtos/teacher-contract-response.dto";

/**
 * Tipos de la capa de vista del recorrido de **Contratos docentes**
 * (US3). Mantiene paridad con el contrato canónico (`paths/teacher-contracts.yaml`)
 * pero aplana los datos anidados en estructuras planas para la presentación.
 *
 * - `TeacherContractsFormVm` describe el estado mutable del formulario
 *   antes de ser enviado. La identidad docente se selecciona desde el
 *   catálogo canónico; las escuelas se eligen entre el catálogo de
 *   escuelas; las fechas son strings `YYYY-MM-DD` alineados con el
 *   `format: date` del contrato.
 * - `TeacherContractResultVm` aplana `TeacherContractResponse` para
 *   mostrar una tarjeta por contrato con su escuela, fechas, estado
 *   persistido y estado efectivo como campos separados. La anidación
 *   queda reservada al mapper, que es el único punto que conoce el
 *   shape DTO.
 * - `TeacherContractsFieldVm` modela las opciones que pueblan los
 *   `<select>`.
 */

/** Forma mutable del formulario de creación multiescuela. */
export interface TeacherContractsFormVm {
  readonly teacherId: number | null;
  /** Escuelas elegidas para crear contratos independientes. */
  readonly schoolIds: readonly number[];
  /** Fecha de inicio (`YYYY-MM-DD`). */
  readonly startDate: string;
  /** Fecha de fin opcional (`YYYY-MM-DD`). `null` = contrato vigente. */
  readonly endDate: string | null;
}

/** Forma aplanada de un contrato creado o listado. */
export interface TeacherContractResultVm {
  readonly id: number;
  readonly teacherId: number;
  readonly schoolId: number;
  readonly schoolName: string;
  readonly schoolSector: string;
  readonly startDate: string;
  readonly endDate: string | null;
  readonly persistedStatus: TeacherContractResponse["persistedStatus"];
  readonly effectiveStatus: TeacherContractResponse["effectiveStatus"];
  readonly evaluatedAt: string;
}

/** Etiqueta legible del estado persistido para la UI. */
export type TeacherContractPersistedLabel = "Vigente" | "Cancelado";

/** Etiqueta legible del estado efectivo para la UI. */
export type TeacherContractEffectiveLabel =
  "Próximo" | "Vigente" | "Vencido" | "Cancelado";

export interface TeacherContractsFieldVm<TValue extends number | string> {
  readonly value: TValue;
  readonly label: string;
}
