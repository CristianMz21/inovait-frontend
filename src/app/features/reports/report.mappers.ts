/* Copyright (c) 2026. All rights reserved. */
import type {
  AgeBandResponse,
  AgeDistributionResponseDto,
} from "../../core/api/dtos/age-distribution.dto";
import type { TeacherCountsBySectorResponseDto } from "../../core/api/dtos/sector-counts.dto";
import type { TopSchoolResponseDto } from "../../core/api/dtos/top-schools.dto";
import {
  AGE_BAND_LABELS,
  SECTOR_LABELS,
  SECTOR_ORDER,
  TOP_SCHOOL_SECTOR_LABELS,
  type AgeBandId,
  type AgeBandVm,
  type AgeDistributionFiltersVm,
  type AgeDistributionVm,
  type SectorCountVm,
  type SectorId,
  type TeacherCountsBySectorFiltersVm,
  type TeacherCountsBySectorVm,
  type TopSchoolVm,
  type TopSchoolsFiltersVm,
  type TopSchoolsVm,
} from "./report.vm";

const EMPTY_ACADEMIC_YEAR_ID = 0;

/**
 * Determina si los filtros académicos permiten invocar
 * `getAgeDistribution`. El contrato declara `academicYearId` como
 * `required: true`; el resto son opcionales.
 */
export function ageDistributionFiltersAreValid(
  vm: AgeDistributionFiltersVm,
): boolean {
  return vm.academicYearId !== null;
}

/**
 * Convierte la `AgeDistributionFiltersVm` a los parámetros canónicos del
 * endpoint `getAgeDistribution`. Devuelve `null` cuando falta
 * `academicYearId`; el llamador debe bloquear el envío en ese caso.
 *
 * Los filtros opcionales (`asOfDate`, `schoolId`, `gradeId`) se incluyen
 * sólo cuando la operadora los define explícitamente; omitir `asOfDate`
 * deja al backend usar la fecha actual.
 */
export function ageDistributionFiltersToParams(vm: AgeDistributionFiltersVm): {
  academicYearId: number;
  asOfDate?: string;
  schoolId?: number;
  gradeId?: number;
} | null {
  if (vm.academicYearId === null) {
    return null;
  }

  const academicYearId = vm.academicYearId;
  const trimmedAsOf = vm.asOfDate?.trim();
  const params: {
    academicYearId: number;
    asOfDate?: string;
    schoolId?: number;
    gradeId?: number;
  } = {
    academicYearId,
  };
  if (trimmedAsOf) {
    params.asOfDate = trimmedAsOf;
  }
  if (vm.schoolId !== null) {
    params.schoolId = vm.schoolId;
  }
  if (vm.gradeId !== null) {
    params.gradeId = vm.gradeId;
  }
  return params;
}

/**
 * Normaliza una sub-banda (`AgeBandResponse`) del DTO canónico a la VM
 * de presentación. Conserva exactamente `minimumAge`, `maximumAge` y
 * `count`; el `id` y la `label` se asignan a partir de la posición del
 * campo en el DTO (`age3To7`, `age8To12`, `ageOver12`).
 *
 * El mapper no recalcula ni reagrupa: si el backend reporta `count=0`
 * para una banda, la VM lo refleja tal cual.
 */
function toBandVm(id: AgeBandId, band: AgeBandResponse): AgeBandVm {
  return {
    id,
    label: AGE_BAND_LABELS[id],
    minimumAge: band.minimumAge,
    maximumAge: band.maximumAge,
    count: band.count,
  };
}

/**
 * Aplana `AgeDistributionResponseDto` (DTO canónico) a
 * `AgeDistributionVm` (VM de presentación).
 *
 * La transformación es estructural:
 *
 * - Las tres bandas del DTO (`age3To7`, `age8To12`, `ageOver12`) se
 *   conservan como una lista ordenada `bands`, cada una con su `id`
 *   canónico y la etiqueta legible para el template.
 * - No agrega las bandas en un total: el backend no expone uno canónico.
 *
 * El orden de las bandas es fijo y coincide con el contrato canónico;
 * la UI las recorre por `bands[0..2]` sin reordenar.
 */
export function ageDistributionResponseToVm(
  dto: AgeDistributionResponseDto,
): AgeDistributionVm {
  const bands: readonly AgeBandVm[] = [
    toBandVm("age3To7", dto.age3To7),
    toBandVm("age8To12", dto.age8To12),
    toBandVm("ageOver12", dto.ageOver12),
  ];
  const {
    academicYearId,
    schoolId,
    gradeId,
    asOfDate,
  }: AgeDistributionResponseDto = dto;
  return {
    academicYearId,
    schoolId,
    gradeId,
    asOfDate,
    bands,
  };
}

/**
 * Determina si los filtros del período permiten invocar
 * `getDistinctTeacherCountsBySector`. El contrato declara `periodStart`
 * y `periodEnd` como opcionales pero **simétricos**: si se envía uno, el
 * backend rechaza con `400 invalid_request`. La UI bloquea el envío
 * cuando sólo uno de los dos extremos está definido, para mantener el
 * shape canónico de la solicitud.
 *
 * Reglas alineadas con el contrato:
 *
 * - Ambos `null` → válido (el backend usa la fecha actual).
 * - Ambos definidos → válido (la regla de rango
 *   `periodEnd >= periodStart` la aplica el backend como `422
 *   period_invalid`; la UI la delega para no reinventar el código de
 *   error).
 * - Sólo uno definido → inválido (la UI bloquea la consulta).
 */
export function teacherCountsBySectorFiltersAreValid(
  vm: TeacherCountsBySectorFiltersVm,
): boolean {
  const startDefined = vm.periodStart !== null;
  const endDefined = vm.periodEnd !== null;
  return startDefined === endDefined;
}

/**
 * Convierte la `TeacherCountsBySectorFiltersVm` a los parámetros
 * canónicos del endpoint `getDistinctTeacherCountsBySector`. Devuelve
 * `null` cuando los filtros son asimétricos (uno definido y el otro
 * `null`); el llamador debe bloquear el envío en ese caso.
 *
 * Los strings vacíos o sólo espacios se canonicalizan a `null` para no
 * contaminar la URL con valores triviales. El orden de inserción
 * coincide con la firma de `paths/reports.yaml` y se preserva verbatim
 * por `HttpParams`.
 */
export function teacherCountsBySectorFiltersToParams(
  vm: TeacherCountsBySectorFiltersVm,
): { periodStart?: string; periodEnd?: string } | null {
  if (!teacherCountsBySectorFiltersAreValid(vm)) {
    return null;
  }
  const params: { periodStart?: string; periodEnd?: string } = {};
  const trimmedStart = vm.periodStart?.trim();
  const trimmedEnd = vm.periodEnd?.trim();
  if (trimmedStart) {
    params.periodStart = trimmedStart;
  }
  if (trimmedEnd) {
    params.periodEnd = trimmedEnd;
  }
  return params;
}

/**
 * Aplana `TeacherCountsBySectorResponseDto` (DTO canónico) a
 * `TeacherCountsBySectorVm` (VM de presentación).
 *
 * Transformación estructural:
 *
 * - Conserva `periodStart` y `periodEnd` exactamente como los emite el
 *   backend, sin reordenar ni ajustar.
 * - Convierte los dos conteos escalares (`publicDistinctTeacherCount`,
 *   `privateDistinctTeacherCount`) en una lista ordenada por sector,
 *   respetando el orden fijo declarado en el contrato (público,
 *   privado).
 * - No suma los sectores en un total global: un mismo docente puede
 *   aparecer en ambos y el backend no expone un total deduplicado.
 *
 * El mapper **no** deduplica por `teacherId`: la deduplicación está
 * delegada al backend (per `proposal.md`).
 */
export function teacherCountsBySectorResponseToVm(
  dto: TeacherCountsBySectorResponseDto,
): TeacherCountsBySectorVm {
  const sectorCounts: Record<SectorId, number> = {
    public: dto.publicDistinctTeacherCount,
    private: dto.privateDistinctTeacherCount,
  };
  const sectors: readonly SectorCountVm[] = SECTOR_ORDER.map(id => ({
    id,
    label: SECTOR_LABELS[id],
    distinctTeacherCount: sectorCounts[id],
  }));
  const { periodStart, periodEnd }: TeacherCountsBySectorResponseDto = dto;
  return {
    periodStart,
    periodEnd,
    sectors,
  };
}

/**
 * Determina si los filtros académicos permiten invocar
 * `getTopSchoolsByEnrollment`. El contrato declara `academicYearId` como
 * `required: true`; la UI bloquea el envío en cualquier otro caso.
 */
export function topSchoolsFiltersAreValid(vm: TopSchoolsFiltersVm): boolean {
  return vm.academicYearId !== null;
}

/**
 * Convierte la `TopSchoolsFiltersVm` a los parámetros canónicos del
 * endpoint `getTopSchoolsByEnrollment`. Devuelve `null` cuando falta
 * `academicYearId`; el llamador debe bloquear el envío en ese caso.
 */
export function topSchoolsFiltersToParams(
  vm: TopSchoolsFiltersVm,
): { academicYearId: number } | null {
  if (!topSchoolsFiltersAreValid(vm)) {
    return null;
  }
  const academicYearId = vm.academicYearId;
  if (academicYearId === null) {
    return null;
  }
  return { academicYearId };
}

/**
 * Aplana una entrada individual `TopSchoolResponseDto` a `TopSchoolVm`.
 * Conserva el shape canónico:
 *
 * - `schoolId`, `schoolName` y `sector` se toman verbatim de
 *   `school.*` (no se recomputan ni se normalizan).
 * - `sectorLabel` se asigna a partir de la tabla `TOP_SCHOOL_SECTOR_LABELS`
 *   para mantener los literales de UI centralizados en `report.vm`.
 * - `enrollmentCount` se conserva verbatim (el contrato declara
 *   `minimum: 1`).
 *
 * El mapper **no** reordena ni empata/desempata: la lista se itera en el
 * orden de llegada del backend (estable por `school.name` ASC y
 * `school.id`).
 */
function toTopSchoolVm(dto: TopSchoolResponseDto): TopSchoolVm {
  return {
    schoolId: dto.school.id,
    schoolName: dto.school.name,
    sector: dto.school.sector,
    sectorLabel: TOP_SCHOOL_SECTOR_LABELS[dto.school.sector],
    enrollmentCount: dto.enrollmentCount,
  };
}

/**
 * Aplana la respuesta canónica `TopSchoolResponse[]` a `TopSchoolsVm`
 * (VM de presentación).
 *
 * Transformación estructural:
 *
 * - `academicYearId` se toma del primer elemento cuando la lista no es
 *   vacía; cuando lo es, devuelve `null` y el caller (la fachada) emite
 *   `empty` antes de invocar este mapper. Conservar este contrato
 *   permite que el mapper nunca reciba un array vacío en el flujo real
 *   — la rama `[]` se trata aguas arriba.
 * - La lista `schools` preserva el orden estable del backend sin
 *   reordenar ni podar. Los empates (`enrollmentCount` máximo repetido)
 *   se conservan tal cual: la UI los renderiza como una tabla con
 *   varias filas del mismo conteo.
 * - El mapper NO calcula totales: los empates implican que todas las
 *   entradas comparten el mismo `enrollmentCount`, y agregar conteos
 *   iguales perdería el significado de "líderes empatados". El conteo
 *   visible por escuela es el dato canónico.
 *
 * La función está tipada como `readonly TopSchoolResponseDto[]` para
 * reflejar exactamente la forma del response canónico (array). El
 * caller (`ReportFacade.dispatchTop`) la trata como tal.
 */
export function topSchoolsResponseToVm(
  dto: readonly TopSchoolResponseDto[],
): TopSchoolsVm {
  const firstEntry = dto[0];
  let academicYearId = EMPTY_ACADEMIC_YEAR_ID;
  if (firstEntry) {
    academicYearId = firstEntry.academicYearId;
  }
  return {
    academicYearId,
    schools: dto.map(toTopSchoolVm),
  };
}
