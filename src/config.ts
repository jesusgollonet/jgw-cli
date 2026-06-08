import { homedir } from "os";
import fs from "node:fs/promises";

export type ServerConfig = {
  command?: string;
  cwd?: string;
  readyUrl?: string;
  timeoutMs?: number;
};

export type PreviewConfig = {
  url?: string;
  command?: string;
  cwd?: string;
};

export type Config = {
  path: string;
  postsDirectory?: string;
  server?: ServerConfig;
  preview?: PreviewConfig;
};

export async function loadConfig(): Promise<Config> {
  const jgbPath = JSON.parse(
    await fs.readFile(homedir() + "/.jgbrc.json", "utf8"),
  );

  return {
    path: jgbPath.path,
    postsDirectory: jgbPath.postsDirectory ?? "build/posts",
    server: jgbPath.server,
    preview: jgbPath.preview,
  };
}
