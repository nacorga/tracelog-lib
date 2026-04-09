import { ChildProcessByStdio, spawn } from 'node:child_process';
import * as path from 'node:path';
import { Readable } from 'node:stream';

type ManagedServerChild = ChildProcessByStdio<null, Readable, Readable>;

interface ReadyPayload {
  port: number;
  host?: string;
  projectId?: string;
}

interface ManagedServer {
  child: ManagedServerChild;
  ready: ReadyPayload;
  getLogs(): { stdout: string; stderr: string };
}

function trimLogBuffer(input: string, maxChars = 8000): string {
  return input.length > maxChars ? input.slice(-maxChars) : input;
}

export interface IngestionStackState {
  events: Array<{
    id: string;
    type: string;
    source?: string;
    ingestion_path?: string;
    session_id?: string;
    user_id?: string;
    page_url?: string;
  }>;
  sessions: Array<{
    session_id?: string;
    user_id?: string;
    location?: {
      country?: string;
      country_code?: string;
    };
  }>;
  visitors: Array<{
    user_id?: string;
    first_location?: {
      country?: string;
      country_code?: string;
    };
  }>;
  sessionsCount: number;
  visitorsCount: number;
  capturedRequests: Array<{
    source?: string;
    session_id?: string;
    user_id?: string;
    _metadata?: {
      idempotency_token?: string;
    };
    events?: Array<{
      id?: string;
      type?: string;
      page_url?: string;
    }>;
  }>;
}

export interface IngestionStack {
  apiBaseUrl: string;
  middlewareCollectUrl: string;
  reset(): Promise<void>;
  configureMiddleware(config: {
    responseDelayMs?: number;
    geoDelayMs?: number;
    geoMode?: 'success' | 'null' | 'error';
    project?: {
      excludedIps?: string[];
      excludedUrlPaths?: string[];
      samplingRate?: number;
      excludedEventTypes?: string[];
    };
  }): Promise<void>;
  getApiState(): Promise<IngestionStackState>;
  setApiSessionBatchCount(sessionId: string, count: number): Promise<void>;
  stop(): Promise<void>;
}

const repoRoot = path.resolve(__dirname, '../../../..');
const apiCwd = path.join(repoRoot, 'tracelog-api');
const middlewareCwd = path.join(repoRoot, 'tracelog-middleware');

async function waitForReady(child: ManagedServerChild, token: string): Promise<ReadyPayload> {
  return new Promise((resolve, reject) => {
    let stdout = '';
    let stderr = '';

    const onStdout = (chunk: Buffer) => {
      const text = chunk.toString();
      stdout += text;

      const line = text
        .split('\n')
        .map((entry) => entry.trim())
        .find((entry) => entry.startsWith(token));

      if (!line) {
        return;
      }

      cleanup();
      resolve(JSON.parse(line.slice(token.length).trim()) as ReadyPayload);
    };

    const onStderr = (chunk: Buffer) => {
      stderr += chunk.toString();
    };

    const onExit = (code: number | null) => {
      cleanup();
      reject(
        new Error(
          `Managed server exited before ready (${token.trim()}): code=${code ?? 'null'}\nSTDOUT:\n${stdout}\nSTDERR:\n${stderr}`,
        ),
      );
    };

    const cleanup = () => {
      child.stdout.off('data', onStdout);
      child.stderr.off('data', onStderr);
      child.off('exit', onExit);
    };

    child.stdout.on('data', onStdout);
    child.stderr.on('data', onStderr);
    child.on('exit', onExit);
  });
}

async function spawnManagedServer(
  cwd: string,
  scriptRelativePath: string,
  readyToken: string,
  env: Record<string, string> = {},
): Promise<ManagedServer> {
  let stdoutLog = '';
  let stderrLog = '';
  const child = spawn(
    'node',
    ['-r', 'ts-node/register/transpile-only', '-r', 'tsconfig-paths/register', scriptRelativePath],
    {
      cwd,
      env: {
        ...process.env,
        TS_NODE_PROJECT: 'tsconfig.json',
        ...env,
      },
      stdio: ['ignore', 'pipe', 'pipe'],
    },
  );

  child.stdout.on('data', (chunk: Buffer) => {
    stdoutLog = trimLogBuffer(stdoutLog + chunk.toString());
  });
  child.stderr.on('data', (chunk: Buffer) => {
    stderrLog = trimLogBuffer(stderrLog + chunk.toString());
  });

  const ready = await waitForReady(child, readyToken);

  return {
    child,
    ready,
    getLogs: () => ({
      stdout: stdoutLog,
      stderr: stderrLog,
    }),
  };
}

async function stopManagedServer(child: ManagedServerChild): Promise<void> {
  if (child.killed || child.exitCode !== null) {
    return;
  }

  child.kill('SIGTERM');

  await new Promise<void>((resolve) => {
    const timeout = setTimeout(() => {
      if (child.exitCode === null) {
        child.kill('SIGKILL');
      }
    }, 5000);

    child.once('exit', () => {
      clearTimeout(timeout);
      resolve();
    });
  });
}

async function postJson(url: string, body?: unknown): Promise<void> {
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error(`Request failed: POST ${url} -> ${response.status}`);
  }
}

export async function startIngestionStack(): Promise<IngestionStack> {
  const apiServer = await spawnManagedServer(
    apiCwd,
    'test/support/ingestion-stack-api.server.ts',
    'INGESTION_TEST_API_READY ',
  );
  const apiBaseUrl = `http://127.0.0.1:${apiServer.ready.port}`;

  const middlewareServer = await spawnManagedServer(
    middlewareCwd,
    'test/support/ingestion-stack-middleware.server.ts',
    'INGESTION_TEST_MIDDLEWARE_READY ',
    {
      INGESTION_TEST_API_URL: apiBaseUrl,
    },
  );

  const middlewareCollectUrl = `http://${middlewareServer.ready.host}:${middlewareServer.ready.port}/collect`;

  return {
    apiBaseUrl,
    middlewareCollectUrl,
    async reset() {
      await postJson(`${apiBaseUrl}/__test/reset`);
      await postJson(`http://127.0.0.1:${middlewareServer.ready.port}/__test/reset`);
    },
    async configureMiddleware(config) {
      await postJson(`http://127.0.0.1:${middlewareServer.ready.port}/__test/config`, config);
    },
    async getApiState(): Promise<IngestionStackState> {
      const response = await fetch(`${apiBaseUrl}/__test/state`);
      if (!response.ok) {
        const responseBody = await response.text();
        const logs = apiServer.getLogs();
        throw new Error(
          `Request failed: GET ${apiBaseUrl}/__test/state -> ${response.status}\nResponse body:\n${responseBody}\nAPI stdout:\n${logs.stdout}\nAPI stderr:\n${logs.stderr}`,
        );
      }
      return (await response.json()) as IngestionStackState;
    },
    async setApiSessionBatchCount(sessionId: string, count: number) {
      await postJson(`${apiBaseUrl}/__test/session-batch-count`, { sessionId, count });
    },
    async stop() {
      await stopManagedServer(middlewareServer.child);
      await stopManagedServer(apiServer.child);
    },
  };
}
