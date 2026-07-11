import type { Routes } from "@angular/router";

/**
 * Rutas P0 y P1 de la feature `001-school-enrollment-management`.
 *
 * - Las tres rutas P0 (`/enrollments`, `/student-search`, `/teacher-contracts`)
 *   están listas para bootstrap. `/enrollments` ya entrega el recorrido
 *   completo de creación de matrícula (WU02); `/student-search` y
 *   `/teacher-contracts` cargan placeholders accesibles hasta WU03/WU04.
 * - La ruta P1 `/reports` queda habilitada por `002-municipal-reports` y
 *   monta el shell operativo con tres reportes internos.
 * - La ruta P1 `/student-history` queda habilitada por `003-student-history`
 *   (WU11-STU) y monta el componente operativo que consume
 *   `getStudentHistory`. `P1LockedComponent` deja de usarse en esa ruta.
 * - `/` redirige a `/enrollments`.
 */
export const routes: Routes = [
  {
    path: "",
    pathMatch: "full",
    redirectTo: "enrollments",
  },
  {
    path: "enrollments",
    loadComponent: () =>
      import("./features/enrollments").then((m) => m.EnrollmentCreateComponent),
    title: "Matrículas · Inovait",
  },
  {
    path: "student-search",
    loadComponent: () =>
      import("./features/student-search").then((m) => m.StudentSearchComponent),
    title: "Consulta de estudiantes · Inovait",
  },
  {
    path: "teacher-contracts",
    loadComponent: () =>
      import("./features/teacher-contracts").then(
        (m) => m.TeacherContractsComponent,
      ),
    title: "Contratos docentes · Inovait",
  },
  {
    path: "reports",
    loadComponent: () =>
      import("./features/reports").then((m) => m.ReportsShellComponent),
    title: "Reportes · Inovait",
  },
  {
    path: "student-history",
    loadComponent: () =>
      import("./features/student-history").then(
        (m) => m.StudentHistoryComponent,
      ),
    title: "Historial del estudiante · Inovait",
  },
  {
    path: "**",
    redirectTo: "enrollments",
  },
];
