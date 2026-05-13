# @elfic/changeling

> El generador de changelogs para proyectos TypeScript modernos.

[![npm version](https://img.shields.io/npm/v/@elfic/changeling.svg)](https://www.npmjs.com/package/@elfic/changeling)
[![CI](https://github.com/elfic-ticio/changeling/actions/workflows/ci.yml/badge.svg)](https://github.com/elfic-ticio/changeling/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)
[![Conventional Commits](https://img.shields.io/badge/Conventional%20Commits-1.0.0-yellow.svg)](https://conventionalcommits.org)

**Leer en otros idiomas:** [English](./README.md)

`changeling` lee el historial de git, agrupa los commits por tipo, enlaza cada entrada con su commit y pull request, y escribe un `CHANGELOG.md` que sigue [Keep a Changelog](https://keepachangelog.com/) y [Versionado Semántico](https://semver.org/lang/es/).

Funciona con cualquier proyecto Node.js, y activa detección extra cuando ve Next.js, React, Vite, Astro o Prisma en tu `package.json` — anotando entradas que tocan rutas, esquemas o nuevas dependencias para que quien revise el cambio sepa qué cambió realmente.

---

## ¿Por qué otra herramienta de changelogs?

Existen herramientas excelentes en este espacio: `conventional-changelog`, `changesets`, `release-please`. Son potentes y configurables. También tienen opiniones fuertes sobre flujos de trabajo, requieren archivos de configuración y asumen que ya elegiste una estrategia de releases.

`changeling` hace una elección distinta: **cero configuración, un comando, salida legible.** Lo corres, te da un `CHANGELOG.md`. Si quieres más, las opciones están. Si no, los defaults son sensatos.

Además asume que trabajas en un stack TypeScript moderno y usa ese contexto para producir entradas más ricas de las que una herramienta genérica puede dar.

## Instalación

```bash
# Uso puntual (recomendado)
npx @elfic/changeling

# Como dependencia de desarrollo
npm install --save-dev @elfic/changeling
# o
pnpm add -D @elfic/changeling
```

Requiere **Node.js 20 o superior**. Probado en 20, 22 y 24 LTS.

## Inicio rápido

Desde la raíz de cualquier repositorio git con un `package.json`:

```bash
npx @elfic/changeling
```

Esto genera un `CHANGELOG.md` con entradas desde el último tag git (o desde el primer commit si no hay tags).

Para generar un rango específico:

```bash
npx @elfic/changeling --from v1.0.0 --to HEAD
```

Para previsualizar sin escribir el archivo:

```bash
npx @elfic/changeling --dry-run
```

## Qué produce

Dado un repositorio con Conventional Commits, la salida se ve así:

```markdown
## [1.2.0] - 2026-05-13

### Añadido
- **auth**: agregar proveedor OAuth para GitHub ([a1b2c3d](https://github.com/user/repo/commit/a1b2c3d)) ([#42](https://github.com/user/repo/pull/42))
- **api**: nuevo endpoint `/users/me` ([e4f5g6h](https://github.com/user/repo/commit/e4f5g6h))

### Corregido
- **dashboard**: prevenir crash en estado vacío ([i7j8k9l](https://github.com/user/repo/commit/i7j8k9l))

### Cambiado
- **deps**: actualizar `next` de 14.2.0 a 14.3.0

### 🔍 Cambios de stack (Next.js detectado)
- Nueva ruta: `app/api/users/me/route.ts`
- Esquema de base de datos modificado: `prisma/schema.prisma`
```

Esa última sección solo aparece cuando `changeling` detecta un stack relevante y encuentra cambios de archivos que coinciden en el rango de commits.

## Comandos

| Comando | Qué hace |
|---------|----------|
| `changeling` | Genera `CHANGELOG.md` desde el último tag hasta `HEAD` |
| `changeling --from <ref>` | Empieza desde un tag, rama o commit específico |
| `changeling --to <ref>` | Termina en un ref específico (default `HEAD`) |
| `changeling --dry-run` | Imprime a stdout sin escribir archivo |
| `changeling --output <ruta>` | Escribe en una ruta personalizada |
| `changeling --no-stack` | Salta la detección específica de framework |
| `changeling --lang <es\|en>` | Idioma de salida (default: `en`) |
| `changeling init` | Crea un archivo de configuración `.changelingrc.json` |

## Configuración

Cero configuración funciona para la mayoría de casos. Si necesitas ajustar el comportamiento, crea `.changelingrc.json`:

```json
{
  "lang": "es",
  "groups": {
    "feat": "Añadido",
    "fix": "Corregido",
    "perf": "Rendimiento",
    "refactor": "Cambiado",
    "docs": "Documentación"
  },
  "stack": {
    "detectNextJs": true,
    "detectPrisma": true
  },
  "skipTypes": ["chore", "ci", "test"]
}
```

## Cómo funciona

1. **Lee el historial git** entre dos refs usando `git log` con un formato estructurado.
2. **Parsea Conventional Commits** (`feat:`, `fix:`, `feat(scope):` …) en registros estructurados.
3. **Detecta el stack** inspeccionando las dependencias en `package.json`.
4. **Empareja cambios de archivos** contra patrones específicos del stack (ej. `app/**` para Next.js).
5. **Formatea** como Markdown agrupado por tipo, con enlaces a commits y PRs.

Mira [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md) para el diseño completo.

## Contribuir

Las contribuciones son bienvenidas. Por favor lee [`CONTRIBUTING.es.md`](./CONTRIBUTING.es.md) y [`CODE_OF_CONDUCT.md`](./CODE_OF_CONDUCT.md) antes de abrir un PR.

Para problemas de seguridad, mira [`SECURITY.md`](./SECURITY.md).

## Licencia

[MIT](./LICENSE) © [Omar Sanchez](https://github.com/elfic-ticio)
