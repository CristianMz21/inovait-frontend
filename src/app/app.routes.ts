import type { Routes } from "@angular/router";

/**
 * Rutas P0 y P1 de la feature `001-school-enrollment-management`.
 *
 * - Las tres rutas P0 (`/enrollments`, `/student-search`, `/teacher-contracts`)
 *   entregan sus recorridos operativos completos.
 * - La ruta P1 `/reports` queda habilitada por `002-municipal-reports` y
 *   monta el shell operativo con tres reportes internos.
 * - La ruta P1 `/student-history` queda habilitada por `003-student-history`
 *   (WU11-STU) y monta el componente operativo que consume
 *   `getStudentHistory`.
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
    title: "Matrículas · EduCore",
  },
  {
    path: "student-search",
    loadComponent: () =>
      import("./features/student-search").then((m) => m.StudentSearchComponent),
    title: "Consulta de estudiantes · EduCore",
  },
  {
    path: "teacher-contracts",
    loadComponent: () =>
      import("./features/teacher-contracts").then(
        (m) => m.TeacherContractsComponent,
      ),
    title: "Contratos docentes · EduCore",
  },
  {
    path: "reports",
    loadComponent: () =>
      import("./features/reports").then((m) => m.ReportsShellComponent),
    title: "Reportes · EduCore",
  },
  {
    path: "student-history",
    loadComponent: () =>
      import("./features/student-history").then(
        (m) => m.StudentHistoryComponent,
      ),
    title: "Historial del estudiante · EduCore",
  },
  {
    path: "**",
    redirectTo: "enrollments",
  },
];
