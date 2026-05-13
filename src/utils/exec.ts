import { spawn } from 'node:child_process';

export interface ExecResult {
  stdout: string;
  stderr: string;
  exitCode: number;
}

export interface ExecOptions {
  allowNonZero?: boolean;
  cwd?: string;
}

export function exec(cmd: string, args: string[], options: ExecOptions = {}): Promise<ExecResult> {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, {
      cwd: options.cwd,
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (chunk: Buffer) => {
      stdout += chunk.toString('utf8');
    });

    child.stderr.on('data', (chunk: Buffer) => {
      stderr += chunk.toString('utf8');
    });

    child.on('close', (code: number | null) => {
      const exitCode = code ?? 1;
      if (exitCode !== 0 && !options.allowNonZero) {
        reject(
          new Error(`Command failed (exit ${exitCode}): ${cmd} ${args.join(' ')}\n${stderr.trim()}`),
        );
        return;
      }
      resolve({ stdout, stderr, exitCode });
    });

    child.on('error', (err: Error) => {
      reject(err);
    });
  });
}
