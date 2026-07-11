/**
 * Tipos HTTP canónicos que el backend declara en `components/problems.yaml`.
 * La UI clasifica el error por `code` cuando el `status` es ambiguo.
 */
export type ApiProblemCode =
  | 'invalid_request'
  | 'resource_not_found'
  | 'enrollment_conflict'
  | 'history_conflict'
  | 'academic_context_invalid'
  | 'teacher_contract_conflict'
  | 'business_rule_violation'
  | 'student_not_found';

export interface ApiProblemWithCode extends ApiProblem {
  readonly code: ApiProblemCode;
}
