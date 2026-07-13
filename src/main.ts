/* Copyright (c) 2026. All rights reserved. */
import { bootstrapApplication } from "@angular/platform-browser";
import { appConfig } from "./app/app.config";
import { App } from "./app/app.component";

await bootstrapApplication(App, appConfig);
