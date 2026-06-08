import { spawnSync } from "child_process";
import { mkdtemp, readFile, rm, writeFile } from "fs/promises";
import { tmpdir } from "os";
import path from "path";

const splitEditorCommand = (command: string): string[] => {
  const pieces: string[] = [];
  let current = "";
  let quote: '"' | "'" | null = null;
  let escaped = false;

  for (const char of command) {
    if (escaped) {
      current += char;
      escaped = false;
      continue;
    }

    if (char === "\\") {
      escaped = true;
      continue;
    }

    if ((char === '"' || char === "'") && quote === null) {
      quote = char;
      continue;
    }

    if (char === quote) {
      quote = null;
      continue;
    }

    if (/\s/.test(char) && quote === null) {
      if (current.length > 0) {
        pieces.push(current);
        current = "";
      }
      continue;
    }

    current += char;
  }

  if (current.length > 0) {
    pieces.push(current);
  }

  return pieces;
};

export async function openInEditor(
  initialContent: string,
  postfix: string = ".md",
): Promise<string> {
  const tempDirectory = await mkdtemp(path.join(tmpdir(), "jgw-editor-"));
  const tempFile = path.join(tempDirectory, `post${postfix}`);

  try {
    await writeFile(tempFile, initialContent, "utf8");

    const editorCommand = process.env.VISUAL || process.env.EDITOR || "vim";
    const [bin, ...args] = splitEditorCommand(editorCommand);
    if (!bin) {
      throw new Error("No editor command configured.");
    }

    const result = spawnSync(bin, [...args, tempFile], { stdio: "inherit" });
    if (result.error) {
      throw result.error;
    }
    if (result.status !== 0) {
      throw new Error(`${bin} exited with status ${result.status}`);
    }
    if (result.signal) {
      throw new Error(`${bin} exited from signal ${result.signal}`);
    }

    return await readFile(tempFile, "utf8");
  } finally {
    await rm(tempDirectory, { recursive: true, force: true });
  }
}
