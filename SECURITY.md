# Security Policy

> 🇬🇧 English version below · [🇪🇸 Versión en español más abajo](#política-de-seguridad-español)

---

## Security Policy (English)

### Why this file exists

`@elfic/changeling` is a developer tool. It reads your git history, your `package.json`, and writes a Markdown file. It does not connect to the network, does not collect telemetry, and does not require credentials.

That said, supply-chain attacks against npm packages are real. This document explains how we reduce that risk and how to report a vulnerability if you find one.

### Reporting a vulnerability

**Do not open a public GitHub issue for security vulnerabilities.**

Email **omarjunior11@gmail.com** with:

- A description of the vulnerability
- Steps to reproduce
- Affected versions
- Your name and affiliation (if you want to be credited)

Expected response times:

| Step | Time |
|------|------|
| Acknowledgement of receipt | Within 72 hours |
| Initial assessment | Within 7 days |
| Resolution or status update | Within 30 days |

If the report is valid, we will work on a fix, coordinate a disclosure date with you, and publish a patched version. We will credit you in the release notes unless you prefer to remain anonymous.

### Supported versions

| Version | Supported |
|---------|-----------|
| 1.x     | ✅ |
| < 1.0   | ❌ (alpha/beta, please upgrade) |

Security patches are issued for the latest minor release of the current major version. We do not backport to older majors.

### Security practices in this project

These are the concrete controls we apply. They are inspired by [OpenSSF Best Practices](https://www.bestpractices.dev/) and the [npm package security guidance](https://docs.npmjs.com/packages-and-modules/securing-your-code). This is not a certification — it is a public statement of what we do.

**Supply chain**

- Zero runtime dependencies. The published package depends on no third-party code beyond Node.js built-ins.
- Development dependencies are pinned via `package-lock.json`.
- We use `npm audit` in CI on every PR. Builds fail on high or critical vulnerabilities.
- Dependabot is enabled for security updates on dev dependencies.

**Publishing**

- npm 2FA is required for the publishing account.
- Releases are published only via GitHub Actions using a scoped automation token with publish-only permission.
- [npm provenance](https://docs.npmjs.com/generating-provenance-statements) is enabled, so each published version has a cryptographic link back to the GitHub Actions workflow that built it.
- Tags are signed (`git tag -s`).

**Code**

- All code is TypeScript with strict mode enabled.
- ESLint is configured to flag dangerous patterns (`eval`, dynamic `require`, child process with shell expansion).
- We do not spawn shells. All `child_process` calls use `spawn` with array arguments, never `exec` with strings.

**Repository**

- Branch protection on `main`: required reviews, required status checks, no force push, no direct push.
- All commits are signed by maintainers.
- Secrets (npm token, etc.) live in GitHub Actions secrets, never in code.

### Threat model

What we explicitly defend against:

- A malicious dependency in our dev tools attempting to inject code into the published artifact (mitigated by zero runtime deps + provenance).
- A compromised maintainer account (mitigated by 2FA + scoped automation tokens).
- A typosquatting attack (we use the `@elfic` scope; the scope is reserved).

What we do **not** defend against (out of scope):

- A user running `changeling` on a malicious repository whose commit messages are crafted to inject content into the generated Markdown. The Markdown output is meant to be reviewed by a human before committing; we treat the changelog as untrusted user input from `changeling`'s perspective.
- A user running an outdated version with a known vulnerability after a patched version is available.

### About ISO 27001 and similar standards

`changeling` is not certified to ISO 27001, SOC 2, or any other organizational security standard. Those standards apply to organizations, not to individual open-source projects. The controls listed above are the project-level equivalents that genuinely apply to a CLI tool.

If you are evaluating `changeling` for use inside an organization that has ISO 27001 requirements, the relevant questions are typically:

- Is the source code auditable? Yes — MIT-licensed, public repository.
- Are dependencies controlled? Yes — zero runtime dependencies.
- Is the supply chain attested? Yes — npm provenance.
- Is there a vulnerability disclosure process? Yes — this document.

---

## Política de Seguridad (Español)

### Por qué existe este archivo

`@elfic/changeling` es una herramienta de desarrollo. Lee tu historial git, tu `package.json`, y escribe un archivo Markdown. No se conecta a la red, no recolecta telemetría, y no requiere credenciales.

Dicho eso, los ataques a la cadena de suministro contra paquetes npm son reales. Este documento explica cómo reducimos ese riesgo y cómo reportar una vulnerabilidad si encuentras una.

### Reportar una vulnerabilidad

**No abras un issue público en GitHub por vulnerabilidades de seguridad.**

Envía un correo a **omarjunior11@gmail.com** con:

- Una descripción de la vulnerabilidad
- Pasos para reproducirla
- Versiones afectadas
- Tu nombre y afiliación (si quieres ser acreditado)

Tiempos de respuesta esperados:

| Paso | Tiempo |
|------|--------|
| Acuse de recibo | En 72 horas |
| Evaluación inicial | En 7 días |
| Resolución o actualización de estado | En 30 días |

Si el reporte es válido, trabajaremos en una corrección, coordinaremos una fecha de divulgación contigo, y publicaremos una versión parcheada. Te acreditaremos en las notas de release a menos que prefieras permanecer anónimo.

### Versiones soportadas

| Versión | Soporte |
|---------|---------|
| 1.x     | ✅ |
| < 1.0   | ❌ (alpha/beta, por favor actualiza) |

Los parches de seguridad se emiten para el último release minor de la versión major actual. No hacemos backport a majors anteriores.

### Prácticas de seguridad en este proyecto

Estos son los controles concretos que aplicamos. Están inspirados en [OpenSSF Best Practices](https://www.bestpractices.dev/) y la [guía de seguridad de paquetes npm](https://docs.npmjs.com/packages-and-modules/securing-your-code). Esto no es una certificación — es una declaración pública de lo que hacemos.

**Cadena de suministro**

- Cero dependencias en runtime. El paquete publicado no depende de código de terceros más allá de los módulos built-in de Node.js.
- Las dependencias de desarrollo están fijadas vía `package-lock.json`.
- Usamos `npm audit` en CI en cada PR. Los builds fallan ante vulnerabilidades altas o críticas.
- Dependabot está habilitado para actualizaciones de seguridad en dependencias de desarrollo.

**Publicación**

- 2FA en npm es obligatorio para la cuenta de publicación.
- Los releases se publican únicamente vía GitHub Actions usando un token de automación con permisos limitados a publicar.
- [npm provenance](https://docs.npmjs.com/generating-provenance-statements) está habilitado, así que cada versión publicada tiene un enlace criptográfico de vuelta al workflow de GitHub Actions que la construyó.
- Los tags están firmados (`git tag -s`).

**Código**

- Todo el código es TypeScript con modo strict habilitado.
- ESLint está configurado para marcar patrones peligrosos (`eval`, `require` dinámico, child process con expansión de shell).
- No invocamos shells. Todas las llamadas a `child_process` usan `spawn` con argumentos como array, nunca `exec` con strings.

**Repositorio**

- Branch protection en `main`: reviews requeridas, status checks requeridos, sin force push, sin push directo.
- Todos los commits de maintainers están firmados.
- Los secretos (npm token, etc.) viven en GitHub Actions secrets, nunca en el código.

### Modelo de amenazas

Contra qué defendemos explícitamente:

- Una dependencia maliciosa en nuestras dev tools que intente inyectar código en el artefacto publicado (mitigado por cero deps en runtime + provenance).
- Una cuenta de maintainer comprometida (mitigado por 2FA + tokens de automación con scope limitado).
- Un ataque de typosquatting (usamos el scope `@elfic`; el scope está reservado).

Contra qué **no** defendemos (fuera de scope):

- Un usuario corriendo `changeling` contra un repositorio malicioso cuyos mensajes de commit estén crafteados para inyectar contenido en el Markdown generado. La salida Markdown está pensada para ser revisada por un humano antes de commitearla; tratamos el changelog como input no confiable desde la perspectiva de `changeling`.
- Un usuario corriendo una versión desactualizada con una vulnerabilidad conocida después de que una versión parcheada esté disponible.

### Sobre ISO 27001 y estándares similares

`changeling` no está certificado en ISO 27001, SOC 2, ni ningún otro estándar de seguridad organizacional. Esos estándares aplican a organizaciones, no a proyectos open source individuales. Los controles listados arriba son los equivalentes a nivel de proyecto que genuinamente aplican a una herramienta CLI.

Si estás evaluando `changeling` para uso dentro de una organización con requerimientos de ISO 27001, las preguntas relevantes típicamente son:

- ¿Es auditable el código fuente? Sí — licencia MIT, repositorio público.
- ¿Están controladas las dependencias? Sí — cero dependencias en runtime.
- ¿Está atestada la cadena de suministro? Sí — npm provenance.
- ¿Hay un proceso de divulgación de vulnerabilidades? Sí — este documento.
