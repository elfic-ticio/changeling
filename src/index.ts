#!/usr/bin/env node
import { parseArgs } from 'node:util';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join, dirname } from 'node:path';
import process from 'node:process';

import { generate } from './commands/generate.js';
import { setDebug, logger } from './utils/logger.js';

const USAGE = `Usage: changeling [options]

Generate CHANGELOG.md from Conventional Commits in the current git repository.

Options:
  --from <ref>     Start ref (tag, branch, or SHA). Default: last tag or first commit.
  --to <ref>       End ref. Default: HEAD.
  --output <path>  Write to this file. Default: CHANGELOG.md.
  --dry-run        Print to stdout instead of writing the file.
  --no-stack       Disable stack detection (Next.js, Prisma, Vite, deps).
  --debug          Show debug output.
  -h, --help       Show this help message.
  -v, --version    Print the version number.
`;

function getVersion(): string {
  try {
    // At runtime dist/index.js lives one level below package.json.
    const pkgPath = join(dirname(fileURLToPath(import.meta.url)), '..', 'package.json');
    const pkg = JSON.parse(readFileSync(pkgPath, 'utf8')) as { version?: string };
    return pkg.version ?? 'unknown';
  } catch {
    return 'unknown';
  }
}

async function main(): Promise<void> {
  let parsed: ReturnType<typeof parseArgs>;

  const parseConfig = {
    options: {
      from: { type: 'string' },
      to: { type: 'string' },
      output: { type: 'string' },
      'dry-run': { type: 'boolean' },
      'no-stack': { type: 'boolean' },
      debug: { type: 'boolean' },
      help: { type: 'boolean', short: 'h' },
      version: { type: 'boolean', short: 'v' },
    },
    strict: true,
    allowPositionals: true,
  } as const;

  try {
    parsed = parseArgs(parseConfig);
  } catch (err) {
    if (err instanceof TypeError) {
      process.stderr.write(`error: ${err.message}\n\n${USAGE}`);
      process.exit(1);
    }
    throw err;
  }

  const { values } = parsed;

  if (values['debug']) setDebug(true);

  if (values['help']) {
    process.stdout.write(USAGE);
    process.exit(0);
  }

  if (values['version']) {
    process.stdout.write(`${getVersion()}\n`);
    process.exit(0);
  }

  await generate({
    from: values['from'] as string | undefined,
    to: values['to'] as string | undefined,
    output: values['output'] as string | undefined,
    dryRun: values['dry-run'] as boolean | undefined,
    noStack: values['no-stack'] as boolean | undefined,
  });
}

main().catch((err: unknown) => {
  const isDebug = process.argv.includes('--debug');
  if (err instanceof Error) {
    if (isDebug) {
      process.stderr.write(`${err.stack ?? err.message}\n`);
    } else {
      logger.error(err.message);
    }
  } else {
    logger.error(String(err));
  }
  process.exit(1);
});
