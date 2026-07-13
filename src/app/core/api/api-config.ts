/* Copyright (c) 2026. All rights reserved. */
import { InjectionToken } from "@angular/core";

/**
 * Configuración base de la API consumida por los servicios HTTP.
 * Por defecto apunta al backend local declarado en el contrato OpenAPI.
 */
export interface ApiConfig {
  readonly apiBaseUrl: string;
}

export const API_CONFIG = new InjectionToken<ApiConfig>("inovait.api.config");

export const DEFAULT_API_CONFIG: ApiConfig = {
  apiBaseUrl: "http://localhost:5000",
};
