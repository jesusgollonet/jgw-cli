import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { spawn, spawnSync } from "child_process";
import { openPostPreview } from "./post-preview";
import { Config } from "../config";

vi.mock("child_process", () => ({
  spawn: vi.fn(),
  spawnSync: vi.fn(),
}));

const baseConfig: Config = {
  path: "/site",
  postsDirectory: "build/posts",
};

const variables = {
  title: "Test Post",
  slug: "test-post",
  date: "2026-06-08",
  filePath: "/site/build/posts/2026-06-08_test-post.md",
};

describe("post-preview", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(spawn).mockReturnValue({ unref: vi.fn() } as never);
    vi.mocked(spawnSync).mockReturnValue({ status: 0, signal: null } as never);
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(new Error("not running")),
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("does nothing when server and preview are not configured", async () => {
    await openPostPreview(baseConfig, variables);

    expect(spawn).not.toHaveBeenCalled();
    expect(spawnSync).not.toHaveBeenCalled();
  });

  it("starts the configured server in the background", async () => {
    await openPostPreview(
      {
        ...baseConfig,
        server: {
          command: "pnpm run dev",
          cwd: "/site",
        },
      },
      variables,
    );

    expect(spawn).toHaveBeenCalledWith("pnpm run dev", {
      cwd: "/site",
      detached: true,
      shell: true,
      stdio: "ignore",
    });
  });

  it("does not start the server when readyUrl is already responding", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true }));

    await openPostPreview(
      {
        ...baseConfig,
        server: {
          command: "pnpm run dev",
          readyUrl: "http://localhost:4321",
        },
      },
      variables,
    );

    expect(spawn).not.toHaveBeenCalled();
  });

  it("runs the preview command with templated values", async () => {
    await openPostPreview(
      {
        ...baseConfig,
        preview: {
          url: "http://localhost:4321/posts/{slug}",
          command: "open {url}",
        },
      },
      variables,
    );

    expect(spawnSync).toHaveBeenCalledWith("open http://localhost:4321/posts/test-post", {
      cwd: "/site",
      shell: true,
      stdio: "inherit",
    });
  });
});
