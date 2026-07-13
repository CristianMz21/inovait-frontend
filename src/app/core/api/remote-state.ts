/* Copyright (c) 2026. All rights reserved. */
import type { ApiProblem } from "./dtos/api-problem.dto";

/**
 * Estado remoto exclusivo que la UI usa para presentar el resultado de un
 * recorrido HTTP. Cada estado es mutuamente excluyente.
 *
 * - `idle`: nada solicitado todavía.
 * - `loading`: hay una solicitud en curso identificada por `requestKey`.
 * - `success`: la respuesta trajo datos no vacíos.
 * - `empty`: la respuesta fue válida pero vacía; `reason` explica por qué.
 * - `error`: el backend devolvió un `ApiProblem` y debe mostrarse contextual.
 */
export type RemoteState<T> =
  | { readonly status: "idle" }
  | { readonly status: "loading"; readonly requestKey: string }
  | { readonly status: "success"; readonly data: T }
  | {
      readonly status: "empty";
      readonly reason: "noResults" | "noGroups" | "noContracts";
    }
  | { readonly status: "error"; readonly problem: ApiProblem };

export const idle = <T>(): RemoteState<T> => ({ status: "idle" });

export const loading = <T>(requestKey: string): RemoteState<T> => ({
  status: "loading",
  requestKey,
});

export const success = <T>(data: T): RemoteState<T> => ({
  status: "success",
  data,
});

export const empty = <T>(
  reason: "noResults" | "noGroups" | "noContracts",
): RemoteState<T> => ({ status: "empty", reason });

export const errorState = <T>(problem: ApiProblem): RemoteState<T> => ({
  status: "error",
  problem,
});
