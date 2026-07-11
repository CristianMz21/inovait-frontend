import type { Routes } from '@angular/router';

/**
 * Rutas P0 y P1 de la feature `001-school-enrollment-management`.
 *
 * - Las tres rutas P0 (`/enrollments`, `/student-search`, `/teacher-contracts`)
 *   están listas para bootstrap. `/enrollments` ya entrega el recorrido
 *   completo de creación de matrícula (WU02); `/student-search` y
 *   `/teacher-contracts` cargan placeholders accesibles hasta WU03/WU04.
 * - Las rutas P1 (`/reports`, `/student-history`) existen pero están
 *   bloqueadas por gate P0: navegan a un componente `p1-locked` que no
 *   invoca endpoints P1.
 * - `/` redirige a `/enrollments`.
 */
export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'enrollments',
  },
  {
    path: 'enrollments',
    loadComponent: () =>
      import('./features/enrollments').then(
        (m) => m.EnrollmentCreateComponent,
      ),
    title: 'Matrículas · Inovait',
  },
  {
    path: 'student-search',
    loadComponent: () =>
      import('./features/student-search').then(
        (m) => m.StudentSearchComponent,
      ),
    title: 'Consulta de estudiantes · Inovait',
  },
  {
    path: 'teacher-contracts',
    loadComponent: () =>
      import(
        './layout/placeholders/teacher-contracts-placeholder.component'
      ).then((m) => m.TeacherContractsPlaceholderComponent),
    title: 'Contratos docentes · Inovait',
  },
  {
    path: 'reports',
    loadComponent: () =>
      import('./layout/placeholders/p1-locked.component').then(
        (m) => m.P1LockedComponent,
      ),
    data: { lockedFeature: 'reports' },
    title: 'Reportes · Inovait',
  },
  {
    path: 'student-history',
    loadComponent: () =>
      import('./layout/placeholders/p1-locked.component').then(
        (m) => m.P1LockedComponent,
      ),
    data: { lockedFeature: 'student-history' },
    title: 'Historia del estudiante · Inovait',
  },
  {
    path: '**',
    redirectTo: 'enrollments',
  },
];
