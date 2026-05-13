# About `@elfic/changeling`

> 🇬🇧 English version below · [🇪🇸 Versión en español más abajo](#-acerca-de-elficchangeling-español)

---

## 🇬🇧 About `@elfic/changeling` (English)

### The problem

Most TypeScript projects on GitHub today share the same release ritual:

1. Someone writes good commits.
2. Someone else has to translate those commits into a release note before publishing.
3. The release note ends up being either copy-pasted commit titles or a free-form summary that loses information.

There are tools that automate this — `conventional-changelog`, `changesets`, `release-please` — but they make tradeoffs that don't fit small and medium projects well:

- **They require setup.** Config files, plugins, presets. By the time you've configured the tool you could have written the changelog by hand.
- **They are framework-agnostic to a fault.** They treat every project like a generic Node library, when most modern TypeScript work happens in Next.js, Vite, Astro, with Prisma underneath. A changelog that doesn't know `app/api/users/route.ts` is a route reads worse than one that does.
- **Output assumes English.** Spanish-speaking teams (and others) end up with mixed-language changelogs or with a manual translation step.

### The hypothesis

A focused tool that:

- Assumes the project is a modern TypeScript project (without requiring it).
- Runs with no config but reads `.changelingrc.json` if present.
- Detects common stack patterns (Next.js routes, Prisma schemas, new dependencies) and annotates entries accordingly.
- Speaks both English and Spanish natively.

...will be useful enough to a specific slice of developers to be adopted, even though the space already has incumbents.

### What this project is *not* trying to be

- **Not a release orchestrator.** It does not bump versions, tag commits, or publish to npm. Use `changesets` or `semantic-release` for that. `changeling` produces the human-readable artifact; you choose how to ship it.
- **Not a monorepo manager.** It generates one changelog for one repository. Monorepo support may come later if there is demand, but it is not the goal.
- **Not a Conventional Commits enforcer.** If your commits don't follow the convention, they are placed in a generic "Other changes" group. The tool degrades gracefully.

### Design principles

1. **Zero config should produce useful output.** Defaults must be sensible. A first-time user runs `npx @elfic/changeling` and gets something they can commit.
2. **Speed of output over breadth of features.** A changelog should generate in under a second on a typical repo. No network calls during generation.
3. **No vendor lock-in.** Output is plain Markdown following Keep a Changelog. You can stop using `changeling` tomorrow and your `CHANGELOG.md` keeps working.
4. **Honesty about origin.** Each entry links back to its commit. Reviewers can verify what `changeling` claims.
5. **Bilingual from day one.** Not a translation layer added later. The output strings live in language files and the format is identical in both languages.

### Why this is worth building publicly

This project exists in part as portfolio work. That is a legitimate motivation and worth stating openly. The choice of an open-source CLI was deliberate:

- It demonstrates Node.js work outside of a framework.
- It is publishable to npm, which is a concrete artifact.
- It has a small, well-defined scope that can ship without scope creep.
- It uses the same conventions (Conventional Commits, SemVer, Keep a Changelog) that the tool itself produces — the project is built using its own output.

The goal is a tool that is small enough to ship, useful enough to be installed by someone who isn't the author, and well-documented enough to be contributed to.

---

## 🇪🇸 Acerca de `@elfic/changeling` (Español)

### El problema

La mayoría de proyectos TypeScript en GitHub comparten el mismo ritual de release:

1. Alguien escribe buenos commits.
2. Otra persona tiene que traducir esos commits en una release note antes de publicar.
3. La release note termina siendo o títulos de commits copiados, o un resumen libre que pierde información.

Existen herramientas que automatizan esto — `conventional-changelog`, `changesets`, `release-please` — pero hacen elecciones que no encajan bien con proyectos pequeños y medianos:

- **Requieren configuración.** Archivos de config, plugins, presets. Para cuando configuras la herramienta ya pudiste haber escrito el changelog a mano.
- **Son agnósticas de framework al extremo.** Tratan cada proyecto como una librería Node genérica, cuando la mayoría del trabajo TypeScript moderno pasa en Next.js, Vite, Astro, con Prisma por debajo. Un changelog que no sabe que `app/api/users/route.ts` es una ruta se lee peor que uno que sí lo sabe.
- **La salida asume inglés.** Equipos hispanohablantes (y otros) terminan con changelogs en idiomas mezclados o con un paso manual de traducción.

### La hipótesis

Una herramienta enfocada que:

- Asume que el proyecto es TypeScript moderno (sin requerirlo).
- Corre sin configuración pero lee `.changelingrc.json` si existe.
- Detecta patrones comunes de stack (rutas Next.js, esquemas Prisma, nuevas dependencias) y anota las entradas acorde.
- Habla inglés y español de forma nativa.

...será útil para un segmento específico de desarrolladores hasta el punto de ser adoptada, aunque el espacio ya tenga competidores establecidos.

### Lo que este proyecto *no* intenta ser

- **No es un orquestador de releases.** No sube versiones, no crea tags ni publica en npm. Usa `changesets` o `semantic-release` para eso. `changeling` produce el artefacto legible para humanos; tú eliges cómo publicarlo.
- **No es un gestor de monorepos.** Genera un changelog por un repositorio. Soporte de monorepos puede venir después si hay demanda, pero no es el objetivo.
- **No es un enforcer de Conventional Commits.** Si tus commits no siguen la convención, se ubican en un grupo genérico "Otros cambios". La herramienta degrada con elegancia.

### Principios de diseño

1. **Cero configuración debe producir salida útil.** Los defaults deben ser sensatos. Un usuario nuevo corre `npx @elfic/changeling` y obtiene algo que puede commitear.
2. **Velocidad de salida sobre amplitud de features.** Un changelog debe generarse en menos de un segundo en un repo típico. Sin llamadas de red durante la generación.
3. **Sin lock-in.** La salida es Markdown puro siguiendo Keep a Changelog. Puedes dejar de usar `changeling` mañana y tu `CHANGELOG.md` sigue funcionando.
4. **Honestidad sobre el origen.** Cada entrada enlaza de vuelta a su commit. Quien revisa puede verificar lo que `changeling` afirma.
5. **Bilingüe desde el día uno.** No es una capa de traducción agregada después. Los strings de salida viven en archivos de idioma y el formato es idéntico en ambos.

### Por qué vale la pena construirlo en público

Este proyecto existe en parte como pieza de portafolio. Esa es una motivación legítima y vale la pena decirla abiertamente. La elección de un CLI open source fue deliberada:

- Demuestra trabajo Node.js fuera de un framework.
- Es publicable en npm, lo que es un artefacto concreto.
- Tiene un alcance pequeño y bien definido que puede entregarse sin scope creep.
- Usa las mismas convenciones (Conventional Commits, SemVer, Keep a Changelog) que la herramienta produce — el proyecto está construido usando su propia salida.

La meta es una herramienta lo suficientemente pequeña para entregarla, lo suficientemente útil para que alguien que no es el autor la instale, y lo suficientemente documentada para que alguien contribuya.
