import { spawn, spawnSync } from "child_process";
import { Config } from "../config";

export type PreviewVariables = {
  title: string;
  slug: string;
  date: string;
  filePath: string;
};

const DEFAULT_READY_TIMEOUT_MS = 15_000;
const READY_POLL_INTERVAL_MS = 300;

function applyTemplate(template: string, variables: Record<string, string>) {
  return template.replace(/\{(\w+)\}/g, (match, key) => {
    return variables[key] ?? match;
  });
}

async function isUrlReady(url: string): Promise<boolean> {
  try {
    const response = await fetch(url, { method: "GET" });
    return response.ok;
  } catch {
    return false;
  }
}

async function waitForUrl(url: string, timeoutMs: number): Promise<boolean> {
  const startedAt = Date.now();

  while (Date.now() - startedAt < timeoutMs) {
    if (await isUrlReady(url)) {
      return true;
    }

    await new Promise((resolve) => setTimeout(resolve, READY_POLL_INTERVAL_MS));
  }

  return false;
}

async function startServer(config: Config) {
  const server = config.server;
  if (!server?.command) {
    return;
  }

  if (server.readyUrl && (await isUrlReady(server.readyUrl))) {
    return;
  }

  const child = spawn(server.command, {
    cwd: server.cwd ?? config.path,
    detached: true,
    shell: true,
    stdio: "ignore",
  });
  child.unref();

  if (!server.readyUrl) {
    return;
  }

  const isReady = await waitForUrl(
    server.readyUrl,
    server.timeoutMs ?? DEFAULT_READY_TIMEOUT_MS,
  );

  if (!isReady) {
    console.warn(`Server did not become ready at ${server.readyUrl}.`);
  }
}

export async function openPostPreview(
  config: Config,
  variables: PreviewVariables,
) {
  await startServer(config);

  if (!config.preview?.command) {
    return;
  }

  const url = config.preview.url
    ? applyTemplate(config.preview.url, variables)
    : undefined;
  const commandVariables = {
    ...variables,
    url: url ?? "",
  };
  const command = applyTemplate(config.preview.command, commandVariables);
  const result = spawnSync(command, {
    cwd: config.preview.cwd ?? config.path,
    shell: true,
    stdio: "inherit",
  });

  if (result.error) {
    throw result.error;
  }
  if (result.status !== 0) {
    throw new Error(`Preview command exited with status ${result.status}`);
  }
  if (result.signal) {
    throw new Error(`Preview command exited from signal ${result.signal}`);
  }
}
