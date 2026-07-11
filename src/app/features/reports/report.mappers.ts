import type { AgeBandResponse, AgeDistributionResponseDto } from '../../core/api/dtos/age-distribution.dto';
import {
  AGE_BAND_LABELS,
  type AgeBandId,
  type AgeBandVm,
  type AgeDistributionFiltersVm,
  type AgeDistributionVm,
} from './report.vm';

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
  if (!ageDistributionFiltersAreValid(vm)) {
    return null;
  }
  const trimmedAsOf = vm.asOfDate?.trim();
  const params: {
    academicYearId: number;
    asOfDate?: string;
    schoolId?: number;
    gradeId?: number;
  } = {
    academicYearId: vm.academicYearId as number,
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
 * - `totalCount` se calcula como la suma de las tres bandas. La UI no
 *   recalcula totales derivados — sólo agrega lo que el backend ya
 *   agrupó. Si en el futuro el backend expone un campo `total`, el
 *   mapper debe cambiar para usarlo.
 *
 * El orden de las bandas es fijo y coincide con el contrato canónico;
 * la UI las recorre por `bands[0..2]` sin reordenar.
 */
export function ageDistributionResponseToVm(
  dto: AgeDistributionResponseDto,
): AgeDistributionVm {
  const bands: readonly AgeBandVm[] = [
    toBandVm('age3To7', dto.age3To7),
    toBandVm('age8To12', dto.age8To12),
    toBandVm('ageOver12', dto.ageOver12),
  ];
  return {
    academicYearId: dto.academicYearId,
    schoolId: dto.schoolId,
    gradeId: dto.gradeId,
    asOfDate: dto.asOfDate,
    bands,
    totalCount: bands.reduce((sum, band) => sum + band.count, 0),
  };
}