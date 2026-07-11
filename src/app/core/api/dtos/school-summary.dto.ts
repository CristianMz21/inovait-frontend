export type SchoolSector = 'Public' | 'Private';

export interface SchoolSummary {
  readonly id: number;
  readonly name: string;
  readonly sector: SchoolSector;
}
