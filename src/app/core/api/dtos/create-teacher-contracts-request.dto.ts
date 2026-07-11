export interface CreateTeacherContractsRequest {
  readonly schoolIds: readonly number[];
  readonly startDate: string;
  readonly endDate?: string | null;
}
