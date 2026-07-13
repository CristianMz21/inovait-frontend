/* Copyright (c) 2026. All rights reserved. */
import { isValidDateOnly } from "./date-only";

export type MockFieldErrors = Readonly<Record<string, readonly string[]>>;

const DOCUMENT_TYPE_MAX_LENGTH = 20;
const DOCUMENT_NUMBER_MAX_LENGTH = 32;
const PERSON_NAME_MAX_LENGTH = 120;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const hasOnlyKeys = (
  value: Record<string, unknown>,
  allowed: readonly string[],
  errors: Record<string, readonly string[]>,
): void => {
  for (const key of Object.keys(value)) {
    if (!allowed.includes(key)) {
      errors[key] = ["El campo no está permitido."];
    }
  }
};

const validateRequiredString = (
  value: unknown,
  field: string,
  maximumLength: number,
  errors: Record<string, readonly string[]>,
): void => {
  if (
    typeof value !== "string" ||
    value.trim().length === 0 ||
    value.length > maximumLength
  ) {
    errors[field] = [`Debe contener entre 1 y ${maximumLength} caracteres.`];
  }
};

const isPositiveInteger = (value: unknown): value is number =>
  typeof value === "number" && Number.isInteger(value) && value > 0;

const validationResult = (
  errors: Record<string, readonly string[]>,
): MockFieldErrors | null => {
  if (Object.keys(errors).length === 0) {
    return null;
  }
  return errors;
};

export const validateEnrollmentBody = (
  body: unknown,
): MockFieldErrors | null => {
  const errors: Record<string, readonly string[]> = {};
  if (!isRecord(body)) {
    return { body: ["Debe ser un objeto JSON."] };
  }
  hasOnlyKeys(
    body,
    ["student", "schoolId", "academicYearId", "gradeId", "classGroupId"],
    errors,
  );
  const student = body["student"];
  if (isRecord(student)) {
    hasOnlyKeys(
      student,
      [
        "documentType",
        "documentNumber",
        "firstNames",
        "lastNames",
        "birthDate",
      ],
      errors,
    );
    validateRequiredString(
      student["documentType"],
      "student.documentType",
      DOCUMENT_TYPE_MAX_LENGTH,
      errors,
    );
    validateRequiredString(
      student["documentNumber"],
      "student.documentNumber",
      DOCUMENT_NUMBER_MAX_LENGTH,
      errors,
    );
    validateRequiredString(
      student["firstNames"],
      "student.firstNames",
      PERSON_NAME_MAX_LENGTH,
      errors,
    );
    validateRequiredString(
      student["lastNames"],
      "student.lastNames",
      PERSON_NAME_MAX_LENGTH,
      errors,
    );
    if (!isValidDateOnly(student["birthDate"])) {
      errors["student.birthDate"] = ["Debe ser una fecha válida YYYY-MM-DD."];
    }
  } else {
    errors["student"] = ["El campo es obligatorio."];
  }
  for (const field of [
    "schoolId",
    "academicYearId",
    "gradeId",
    "classGroupId",
  ] as const) {
    if (!isPositiveInteger(body[field])) {
      errors[field] = ["Debe ser un entero mayor o igual a 1."];
    }
  }
  return validationResult(errors);
};

export const validateTeacherContractBody = (
  body: unknown,
): MockFieldErrors | null => {
  const errors: Record<string, readonly string[]> = {};
  if (!isRecord(body)) {
    return { body: ["Debe ser un objeto JSON."] };
  }
  hasOnlyKeys(body, ["schoolIds", "startDate", "endDate"], errors);
  const schoolIds = body["schoolIds"];
  if (
    !Array.isArray(schoolIds) ||
    schoolIds.length === 0 ||
    !schoolIds.every(isPositiveInteger)
  ) {
    errors["schoolIds"] = [
      "Debe contener al menos un entero mayor o igual a 1.",
    ];
  }
  if (!isValidDateOnly(body["startDate"])) {
    errors["startDate"] = ["Debe ser una fecha válida YYYY-MM-DD."];
  }
  const endDate = body["endDate"];
  if (endDate !== undefined && endDate !== null && !isValidDateOnly(endDate)) {
    errors["endDate"] = ["Debe ser null o una fecha válida YYYY-MM-DD."];
  }
  return validationResult(errors);
};
