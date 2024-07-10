import { homedir } from "os";
import fs from "node:fs/promises";

type Config = {
  path: string;
};

export async function loadConfig(): Promise<Config> {
  const jgbPath = JSON.parse(
    await fs.readFile(homedir() + "/.jgbrc.json", "utf8"),
  );

  return {
    path: jgbPath.path,
  };
}
