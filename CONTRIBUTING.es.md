# Contribuir a `@elfic/changeling`

Gracias por considerar contribuir. Este documento cubre lo que necesitas saber.

**Otros idiomas:** [English](./CONTRIBUTING.md)

## Antes de abrir un PR

1. **Abre un issue primero para cualquier cosa no trivial.** Una discusión de 5 minutos ahorra una reescritura de PR de 5 horas. Fixes de bugs y typos en documentación pueden saltarse esto.
2. **Revisa el [roadmap](./docs/ROADMAP.md).** Features fuera de la fase actual no serán mergeados en la fase actual — serán triados a la fase apropiada.
3. **Lee [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md).** Los límites entre módulos son intencionales. Cruzarlos necesita una razón.

## Setup de desarrollo

```bash
git clone https://github.com/elfic-ticio/changeling.git
cd changeling
npm install
npm run typecheck
npm test
```

Requiere Node.js 20 o superior. Recomendado: 24 LTS.

## Ejecutar el CLI localmente

```bash
npm run build           # compila a dist/
node dist/index.js      # corre el binario compilado
# o, durante desarrollo:
npm run dev -- --dry-run
```

## Mensajes de commit

Usamos [Conventional Commits](https://www.conventionalcommits.org/lang/es/). La herramienta que estamos construyendo los consume, así que debemos producirlos.

```
feat(parser): soportar footer de breaking change
fix(git): manejar repositorios vacíos
docs: clarificar comportamiento del flag --from
refactor(formatter): dividir renderizado de markdown en funciones más pequeñas
```

Tipos permitidos: `feat`, `fix`, `perf`, `refactor`, `docs`, `style`, `test`, `build`, `ci`, `chore`, `revert`.

Para breaking changes, incluye `BREAKING CHANGE:` en el cuerpo del commit o usa `!` después del tipo/scope.

## Changesets

Todo PR que cambie comportamiento visible para el usuario debe incluir un changeset. Corre:

```bash
npx changeset
```

Elige `patch`/`minor`/`major` y escribe una descripción de una línea. Commitea el archivo generado. El workflow de release usa estos para subir versiones y actualizar el propio `CHANGELOG.md` del proyecto.

PRs solo de documentación no necesitan changeset. CI no lo requerirá.

## Tests

- **Tests unitarios** viven junto al código que prueban (`src/core/parser.test.ts`).
- **Tests de integración** viven bajo `test/` y pueden spawn `git` contra repos de fixture.
- Correr todos los tests: `npm test`.
- Correr con coverage: `npm run test:coverage`.
- Features nuevas requieren tests. Fixes de bugs requieren un test que reproduzca el bug antes de ser corregido.

Meta de coverage: 80% en `src/core/` y `src/formatters/`. PRs que bajen el coverage debajo de esto en esos directorios serán pedidos de agregar tests.

## Estilo de código

- TypeScript en modo strict. No `any` sin un comentario explicando por qué.
- Preferir `async`/`await` sobre Promises crudas en código orientado al usuario.
- Errores lanzados al usuario deben tener mensajes accionables. No `Error: something went wrong`.
- Funciones sobre clases salvo que el estado genuinamente necesite encapsulamiento.
- ESLint y Prettier corren en CI. `npm run lint:fix` y `npm run format` manejan la mayoría de issues automáticamente.

## Checklist de pull request

Antes de pedir review:

- [ ] Tests agregados o actualizados y pasando
- [ ] Changeset agregado (o PR es solo de docs)
- [ ] `npm run lint` pasa
- [ ] `npm run typecheck` pasa
- [ ] Linkeado al issue que el PR aborda
- [ ] Cambio de comportamiento reflejado en `README.md` si es visible al usuario

## Proceso de review

- Una aprobación de maintainer es requerida para mergear.
- Los maintainers pueden pedir cambios. No lo tomes personal — los comentarios de review son sobre el código, no sobre quien contribuye.
- PRs esperando más de 7 días al contribuyente pueden ser cerrados con una nota amistosa. Reábrelo cuando quieras.

## Reportar bugs

Usa el template de bug report bajo [issues](https://github.com/elfic-ticio/changeling/issues/new/choose). Incluye:

- La versión de `@elfic/changeling`
- Versión de Node.js
- Sistema operativo
- Una reproducción mínima (un repo pequeño o comandos que lo reproduzcan)
- Lo que esperabas que pasara
- Lo que pasó realmente

## Problemas de seguridad

No abras issues públicos para vulnerabilidades de seguridad. Mira [`SECURITY.md`](./SECURITY.md) para el proceso de reporte.

## Licencia

Al contribuir, aceptas que tus contribuciones sean licenciadas bajo la Licencia MIT (la misma que el proyecto).
