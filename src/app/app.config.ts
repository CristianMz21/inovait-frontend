import {
  ApplicationConfig,
  provideBrowserGlobalErrorListeners,
  provideZonelessChangeDetection,
} from "@angular/core";
import {
  provideRouter,
  withComponentInputBinding,
  withInMemoryScrolling,
} from "@angular/router";
import {
  API_CONFIG,
  DEFAULT_API_CONFIG,
  provideApiHttpClient,
} from "./core/api";
import { routes } from "./app.routes";

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZonelessChangeDetection(),
    provideRouter(
      routes,
      withComponentInputBinding(),
      withInMemoryScrolling({
        scrollPositionRestoration: "enabled",
        anchorScrolling: "enabled",
      }),
    ),
    provideApiHttpClient(),
    { provide: API_CONFIG, useValue: DEFAULT_API_CONFIG },
  ],
};
