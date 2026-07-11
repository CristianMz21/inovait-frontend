import type { ApiProblem } from '../../app/core/api/dtos/api-problem.dto';

export const apiProblemBadRequestFixture: ApiProblem = {
  type: 'https://inovait.local/problems/invalid-request',
  title: 'La solicitud no es válida',
  status: 400,
  code: 'invalid_request',
  detail: null,
  instance: '/api/enrollments',
  errors: {
    academicYearId: ['El campo es obligatorio.'],
  },
};

export const apiProblemNotFoundFixture: ApiProblem = {
  type: 'https://inovait.local/problems/resource-not-found',
  title: 'No se encontró el recurso',
  status: 404,
  code: 'resource_not_found',
};

export const apiProblemEnrollmentConflictFixture: ApiProblem = {
  type: 'https://inovait.local/problems/enrollment-conflict',
  title: 'La inscripción entra en conflicto con la historia existente',
  status: 409,
  code: 'enrollment_conflict',
  detail: 'El estudiante ya tiene una inscripción para el año académico indicado.',
};

export const apiProblemTeacherContractConflictFixture: ApiProblem = {
  type: 'https://inovait.local/problems/teacher-contract-conflict',
  title: 'La solicitud contractual entra en conflicto',
  status: 409,
  code: 'teacher_contract_conflict',
  detail: 'La solicitud repite una escuela o superpone un contrato existente.',
  errors: {
    schoolIds: ['No puede contener identificadores repetidos.'],
  },
};

export const apiProblemBusinessRuleViolationFixture: ApiProblem = {
  type: 'https://inovait.local/problems/business-rule-violation',
  title: 'La solicitud incumple una regla de negocio',
  status: 422,
  code: 'business_rule_violation',
};
