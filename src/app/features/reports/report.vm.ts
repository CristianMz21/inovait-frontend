/**
 * Tipos de la capa de vista del recorrido de **Reportes municipales**
 * (P1). Mantiene paridad con el contrato canónico
 * (`paths/reports.yaml` + `components/reports.yaml`) pero aplana los
 * datos anidados en estructuras planas para la presentación.
 *
 * WU07 implementa el slot `ageDistribution`; WU08 el slot `sector`;
 * WU09 el slot `topSchools`.
 */
export type AgeBandId = 'age3To7' | 'age8To12' | 'ageOver12';

/**
 * Vista normalizada de una banda de edad. Aplana `AgeBandResponse` con
 * una etiqueta legible para el template y conserva el `id` canónico del
 * backend.
 */
export interface AgeBandVm {
  readonly id: AgeBandId;
  readonly label: string;
  readonly minimumAge: number;
  readonly maximumAge: number | null;
  readonly count: number;
}

/**
 * Estado mutable del formulario de consulta de distribución por edad.
 * `academicYearId` es obligatorio por contrato; `asOfDate` y los filtros
 * opcionales `schoolId` / `gradeId` pueden ser `null` cuando la
 * operadora no los define.
 */
export interface AgeDistributionFiltersVm {
  readonly academicYearId: number | null;
  readonly asOfDate: string | null;
  readonly schoolId: number | null;
  readonly gradeId: number | null;
}

/**
 * Forma aplanada del DTO canónico para la presentación. Conserva
 * exactamente los campos `minimumAge`, `maximumAge`, `count` por banda;
 * la UI no debe recalcular ni reagrupar — sólo etiqueta y ordena.
 */
export interface AgeDistributionVm {
  readonly academicYearId: number;
  readonly schoolId: number | null;
  readonly gradeId: number | null;
  readonly asOfDate: string;
  readonly bands: readonly AgeBandVm[];
  readonly totalCount: number;
}

/**
 * Etiquetas legibles por banda para el template de la vista. Se
 * centralizan aquí para que la UI no duplique literales.
 */
export const AGE_BAND_LABELS: Readonly<Record<AgeBandId, string>> = {
  age3To7: '3 a 7 años',
  age8To12: '8 a 12 años',
  ageOver12: 'Mayores de 12 años',
};

/**
 * Forma genérica de un option poblado en un `<select>`. Replica el
 * patrón de `TeacherContractsFieldVm` para mantener consistencia con
 * los features P0.
 */
export interface AgeDistributionFieldVm<TValue extends number | string> {
  readonly value: TValue;
  readonly label: string;
}

/**
 * Tipos de la capa de vista del recorrido de **Docentes distintos por
 * sector** (FR-RPT-003, WU08).
 *
 * El DTO canónico no devuelve un array: expone dos campos escalares
 * por sector (`publicDistinctTeacherCount`, `privateDistinctTeacherCount`).
 * La VM los conserva como dos entradas ordenadas del sector
 * correspondiente, lo que simplifica el render del template y la
 * internacionalización sin perder el shape canónico.
 */
export type SectorId = 'public' | 'private';

/**
 * Vista normalizada de un sector reportada por
 * `getDistinctTeacherCountsBySector`. Aplana el conteo canónico
 * (`publicDistinctTeacherCount` / `privateDistinctTeacherCount`) en una
 * entrada por sector con etiqueta legible para el template.
 */
export interface SectorCountVm {
  readonly id: SectorId;
  readonly label: string;
  readonly distinctTeacherCount: number;
}

/**
 * Estado mutable del formulario de consulta por sector. Ambos extremos
 * del período son opcionales: si la operadora los omite, el backend usa
 * la fecha actual. El backend rechaza el envío con sólo uno de los dos
 * (`400 invalid_request`).
 */
export interface TeacherCountsBySectorFiltersVm {
  readonly periodStart: string | null;
  readonly periodEnd: string | null;
}

/**
 * Forma aplanada del DTO canónico para la presentación. Conserva
 * exactamente `periodStart`, `periodEnd` y los dos conteos por sector; la
 * UI los etiqueta y los ordena sin recalcular ni deduplicar — la
 * deduplicación por `teacherId` la realiza el backend.
 */
export interface TeacherCountsBySectorVm {
  readonly periodStart: string;
  readonly periodEnd: string;
  readonly sectors: readonly SectorCountVm[];
  readonly totalDistinctTeacherCount: number;
}

/**
 * Etiquetas legibles para los dos sectores canónicos del reporte. Se
 * centralizan aquí para que la UI no duplique literales.
 */
export const SECTOR_LABELS: Readonly<Record<SectorId, string>> = {
  public: 'Público',
  private: 'Privado',
};

/**
 * Orden fijo de los sectores en el DTO canónico. El backend garantiza
 * "dos sectores en orden fijo" (`paths/reports.yaml` descripción del
 * response `200`); la UI debe respetar ese orden sin reordenar.
 */
export const SECTOR_ORDER: readonly SectorId[] = ['public', 'private'];

/**
 * Tipos de la capa de vista del recorrido de **Escuelas líderes por
 * matrícula** (FR-RPT-003, WU09).
 *
 * El DTO canónico es un array `TopSchoolResponse[]`; cada entrada
 * incluye una escuela anidada (`SchoolSummary`) más `academicYearId` y
 * `enrollmentCount`. La VM aplana esa estructura conservando
 * exactamente el shape canónico:
 *
 * - `TopSchoolsVm.schools` mantiene el orden estable que el backend
 *   emite (ordenado por `school.name` ascendente y luego `school.id`);
 *   la UI NO reordena ni empata/desempata.
 * - `TopSchoolVm` aísla los datos de una escuela líder, conservando el
 *   `sector` canónico y añadiendo una `sectorLabel` legible para la
 *   plantilla. La escuela se referencia por `schoolId` (canónico) para
 *   evitar aliasing en enlaces futuros.
 *
 * El recorrido es el primero en admitir un estado `empty` real (200 `[]`
 * cuando el año académico no tiene inscripciones). La fachada convierte
 * esa respuesta al estado canónico `empty` de `RemoteState`.
 */
export interface TopSchoolVm {
  readonly schoolId: number;
  readonly schoolName: string;
  readonly sector: 'Public' | 'Private';
  readonly sectorLabel: string;
  readonly enrollmentCount: number;
}

/**
 * Estado mutable del formulario de consulta de escuelas líderes. Sólo
 * `academicYearId` es obligatorio por contrato; el resto de filtros no
 * aplica.
 */
export interface TopSchoolsFiltersVm {
  readonly academicYearId: number | null;
}

/**
 * Forma aplanada del DTO canónico (array `TopSchoolResponse[]`) para la
 * presentación. Conserva exactamente `academicYearId` y la lista de
 * escuelas líderes (posiblemente vacía); no recalcula totales ni
 * reordena.
 */
export interface TopSchoolsVm {
  readonly academicYearId: number;
  readonly schools: readonly TopSchoolVm[];
}

/**
 * Etiquetas legibles para los sectores del reporte de escuelas líderes.
 * Coinciden con `SECTOR_LABELS` (los sectores canónicos son los mismos
 * dos del reporte `sector`), pero se referencian de forma independiente
 * para que un cambio futuro en el catálogo de sectores no rompa
 * accidentalmente esta vista.
 */
export const TOP_SCHOOL_SECTOR_LABELS: Readonly<Record<
  'Public' | 'Private',
  string
>> = {
  Public: 'Público',
  Private: 'Privado',
};