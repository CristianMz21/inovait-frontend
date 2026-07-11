<!--
Sync Impact Report
- Cambio de versión: plantilla sin ratificar → 1.0.0
- Principios definidos:
  - I. MVP P0 simple y acotado
  - II. Integridad funcional y autoridad del backend
  - III. Trazabilidad y contrato entre repositorios
  - IV. Código legible, pruebas útiles y entrega reproducible
  - V. Experiencia accesible, responsive y predecible
- Secciones añadidas:
  - Restricciones técnicas y límites
  - Flujo de trabajo y puertas de calidad
- Secciones eliminadas: ninguna; se reemplazaron los espacios de la plantilla.
- Plantillas sincronizadas:
  - ✅ .specify/templates/plan-template.md
  - ✅ .specify/templates/spec-template.md
  - ✅ .specify/templates/tasks-template.md
- Documentación de ejecución sincronizada:
  - ✅ README.md
- Comandos inspeccionados: no existe .specify/templates/commands/ en esta instalación.
- Seguimientos pendientes: ninguno.
-->
# Constitución de inovait-frontend

## Principios fundamentales

### I. MVP P0 simple y acotado

El proyecto DEBE optimizarse para una evaluación técnica de un día y resolver
primero, de extremo a extremo, estos entregables P0:

1. Crear un estudiante junto con su matrícula en `school`, `grade`, `group` y
   `year`.
2. Consultar estudiantes conjuntamente por `school`, `grade` y `year`.
3. Asignar un `teacher` precargado a más de una escuela y consultar después los
   contratos almacenados.

Los P0 DEBEN estar completos, ejecutables y validados antes de iniciar los
reportes P1: rangos de edad, docentes distintos por sector público/privado,
escuela o escuelas con más estudiantes e historial de un estudiante con sus
docentes. Cada decisión DEBE preferir la solución más pequeña que conserve
claridad, integridad y capacidad de demostración. Quedan fuera la administración
de catálogos, autenticación, multiciudad y cualquier funcionalidad no solicitada.

**Razón**: un MVP de un día fracasa cuando distribuye esfuerzo entre extras y
deja incompletos los recorridos evaluados.

### II. Integridad funcional y autoridad del backend

La interfaz DEBE impedir combinaciones incoherentes mediante selecciones
dependientes de `school`, `year`, `grade` y `group`; al cambiar una selección
superior DEBE limpiar o revalidar las dependientes. Los formularios DEBEN usar
`Reactive Forms`, mostrar validación visible y bloquear envíos evidentemente
inválidos. Los servicios HTTP DEBEN ser tipados y validar la forma necesaria en
la frontera de integración.

La validación del cliente mejora la experiencia, pero NO DEBE duplicar ni
reemplazar la autoridad del servidor sobre reglas de negocio, relaciones o
persistencia. Una respuesta rechazada por la API DEBE prevalecer sobre el estado
optimista de la interfaz. Los errores `ProblemDetails` DEBEN presentarse de forma
predecible usando su información disponible, asociando errores de campo cuando
corresponda y mostrando un mensaje general accionable en los demás casos.

**Razón**: las ayudas del cliente reducen errores; solo el backend puede proteger
de manera canónica la integridad compartida.

### III. Trazabilidad y contrato entre repositorios

Todo requisito DEBE conservar un identificador estable y una cadena verificable
desde el objetivo de la evaluación hasta el escenario de aceptación, recorrido
de UI, operación de API, tarea y prueba o evidencia manual. Los cambios sin esa
trazabilidad NO DEBEN entrar al alcance.

Frontend y backend son repositorios independientes, con ramas, historial y
entregas separados. El OpenAPI publicado por el backend es el contrato canónico.
El frontend NO DEBE inventar rutas, payloads, nombres, reglas ni errores
divergentes. Los cambios de contrato DEBEN coordinar nombres técnicos en inglés,
compatibilidad y versión antes de implementarse en cualquiera de los dos
repositorios.

**Razón**: la independencia operativa solo es segura cuando existe una fuente de
verdad explícita y cada requisito puede auditarse de extremo a extremo.

### IV. Código legible, pruebas útiles y entrega reproducible

El código futuro DEBE priorizar lectura directa, responsabilidades delimitadas y
nombres técnicos consistentes en inglés. TypeScript DEBE operar en modo estricto;
no se admiten `any`, supresiones ni abstracciones sin una necesidad demostrable.
Las pruebas DEBEN proteger comportamiento de negocio y recorridos críticos,
incluidos casos de error relevantes; NO DEBEN escribirse para alcanzar una cifra
artificial de cobertura ni acoplarse a detalles internos sin valor observable.

El repositorio DEBE documentar versiones, configuración, instalación, ejecución,
pruebas y dependencia del backend de modo que un evaluador pueda reproducir la
demostración desde un entorno limpio. Solo se permiten datos mostrados o
sembrados ficticios. NO DEBEN almacenarse secretos, credenciales ni datos
personales reales en código, configuración, ejemplos, fixtures o documentación.

**Razón**: la calidad evaluable combina comprensión, evidencia conductual y una
entrega que otra persona puede ejecutar sin conocimiento implícito.

### V. Experiencia accesible, responsive y predecible

La UI DEBE ofrecer una experiencia profesional, responsive y orientada a WCAG
2.2 nivel AA. Toda función DEBE poder operarse con teclado, mantener foco visible
y orden lógico, usar elementos semánticos, nombres accesibles y etiquetas
programáticamente asociadas. Los errores NO DEBEN comunicarse solo por color;
la validación DEBE ser visible, comprensible y anunciable por tecnologías de
asistencia.

Cada recorrido con datos remotos DEBE definir estados de carga, error, éxito y
vacío. Las tablas DEBEN conservar encabezados claros, lectura y navegación en
pantallas pequeñas. La retroalimentación DEBE ser no intrusiva, persistir el
tiempo suficiente para comprenderse y anunciar cambios dinámicos importantes sin
mover el foco de manera inesperada.

**Razón**: una interfaz clara no es decoración; es parte del comportamiento
correcto y de la capacidad del evaluador para completar los recorridos.

## Restricciones técnicas y límites

- La aplicación futura DEBE usar Angular con componentes standalone, TypeScript
  estricto, `Reactive Forms`, servicios HTTP tipados y rutas organizadas por
  feature.
- Angular Material DEBE ser la biblioteca UI predeterminada, salvo que una
  investigación posterior documente una incompatibilidad bloqueante. NO DEBEN
  incorporarse bibliotecas UI adicionales para resolver necesidades ya cubiertas.
- El estado DEBE mantenerse lo más local posible. El estado global solo se
  permite con una necesidad transversal demostrada; NO DEBE adoptarse por
  anticipación.
- La representación de errores DEBE consumir `ProblemDetails` del backend de
  forma consistente y tolerar campos opcionales sin inventar contratos alternos.
- NO DEBEN añadirse capas, patrones, dependencias, administración de catálogos o
  infraestructura sin impacto directo en P0 o en un P1 autorizado.
- Los entregables globales de la evaluación son fuente frontend, fuente backend,
  modelo ER y script mínimo de base de datos. Este repositorio DEBE mantener su
  fuente y documentación ejecutables, y referenciar con claridad las piezas que
  pertenecen al repositorio backend.

## Flujo de trabajo y puertas de calidad

1. **Constitución**: en la fase actual solo se permite gobernanza y
   sincronización de plantillas. NO se crearán scaffold Angular, carpetas de
   código fuente, componentes, servicios, dependencias, commits ni pushes.
2. **Especificación futura**: cada historia DEBE clasificarse como P0, P1 o fuera
   de alcance; definir estados de interfaz, accesibilidad, validación, frontera
   API y trazabilidad mediante identificadores estables.
3. **Plan futuro**: DEBE confirmar el OpenAPI canónico, la estrategia
   `ProblemDetails`, las selecciones dependientes, las pruebas de comportamiento,
   el setup reproducible y la ausencia de complejidad injustificada.
4. **Tareas futuras**: DEBEN mapearse a requisitos y recorridos. Las tareas P1 NO
   DEBEN comenzar hasta que todos los P0 tengan evidencia de ejecución y
   validación.
5. **Entrega futura**: DEBE verificarse desde un entorno limpio, con datos
   ficticios, operación por teclado, estados remotos visibles y recorridos P0
   completos contra el backend contratado.

Toda excepción a una puerta DEBE registrarse en la sección de complejidad del
plan con necesidad concreta, alternativa simple rechazada y efecto sobre la
evaluación. Una preferencia personal NO constituye justificación.

## Gobernanza

Esta constitución prevalece sobre README, planes, tareas y convenciones locales
que la contradigan. Una enmienda requiere: motivación escrita, análisis de
impacto, actualización del Sync Impact Report y sincronización de plantillas y
documentación dependientes antes de aprobarse.

La versión sigue SemVer aplicado a gobernanza: MAJOR para retirar o redefinir de
forma incompatible principios; MINOR para añadir principios o ampliar
materialmente obligaciones; PATCH para aclaraciones sin cambio normativo. Cada
plan DEBE ejecutar el Constitution Check antes de investigar y repetirlo después
del diseño. Cada revisión y entrega DEBE comprobar alcance, trazabilidad,
contrato, accesibilidad, pruebas relevantes, seguridad de datos y
reproducibilidad. Las desviaciones sin justificar bloquean el avance.

**Versión**: 1.0.0 | **Ratificada**: 2026-07-10 | **Última enmienda**: 2026-07-10
