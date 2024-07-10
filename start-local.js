// loads path from .jgbrc.json
import { homedir } from "os";
import fs from "node:fs/promises";

const jgbPath = JSON.parse(
  await fs.readFile(homedir() + "/.jgbrc.json", "utf8"),
);

// executes script in build folder
import { exec } from "child_process";
import path from "path";

const child = exec("yarn run dev", {
  cwd: path.join(jgbPath.path, "build"),
});

child.stdout.on("data", (data) => {
  console.log(`stdout: ${data}`);
});

child.stderr.on("data", (data) => {
  console.error(`stderr: ${data}`);
});

child.on("close", (code) => {
  console.log(`child process exited with code ${code}`);
});
