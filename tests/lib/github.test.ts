import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createBranchAndCommit, getFileContent, getMainSha } from "@/lib/github";

function respond(status: number, body: unknown) {
  return new Response(typeof body === "string" ? body : JSON.stringify(body), { status });
}

beforeEach(() => {
  vi.stubEnv("GITHUB_TOKEN", "test-token");
  vi.stubEnv("GITHUB_OWNER", "o");
  vi.stubEnv("GITHUB_REPO", "r");
  vi.spyOn(console, "log").mockImplementation(() => {});
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("getFileContent", () => {
  it("returns the decoded file when it exists", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => respond(200, { content: Buffer.from("{}\n").toString("base64") })),
    );
    await expect(getFileContent("v3/extensions/a/a.json")).resolves.toBe("{}\n");
  });

  it("returns null only when the file is absent (404)", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => respond(404, { message: "Not Found" })));
    await expect(getFileContent("v3/extensions/a/a.json")).resolves.toBeNull();
  });

  // A dead credential must not make every file look new in the diff preview.
  it("throws on 401 instead of reporting the file as absent", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => respond(401, { message: "Bad credentials" })));
    await expect(getFileContent("v3/extensions/a/a.json")).rejects.toThrow(/401/);
  });

  it("throws on 403 and on server errors", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => respond(403, "Forbidden")));
    await expect(getFileContent("v3/extensions/a/a.json")).rejects.toThrow(/403/);
    vi.stubGlobal("fetch", vi.fn(async () => respond(502, "Bad gateway")));
    await expect(getFileContent("v3/extensions/a/a.json")).rejects.toThrow(/502/);
  });

  it("throws when the network call itself fails", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new TypeError("fetch failed");
      }),
    );
    await expect(getFileContent("v3/extensions/a/a.json")).rejects.toThrow(/fetch failed/);
  });

  it("throws when the response carries no content (e.g. a directory)", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => respond(200, [{ name: "a.json" }])));
    await expect(getFileContent("v3/extensions/a")).rejects.toThrow(/no file content/);
  });
});

describe("createBranchAndCommit — path allowlist", () => {
  // The target repo is public: a pushed branch is published before any review.
  // Only extension schema files may ever be written.
  it.each([
    "README.md",
    "v3/common/money.json",
    ".github/workflows/publish.yml",
    "v3/extensions/scotland/other.json",
    "v3/extensions/scotland/../../../README.md",
    "v3/extensions/scotland/scotland.json/x",
  ])("refuses %s before any GitHub call", async (path) => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    await expect(
      createBranchAndCommit("backoffice/publish-1", [{ path, content: "{}" }], "m"),
    ).rejects.toThrow(/not an extension schema path/);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("refuses an empty file list", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    await expect(createBranchAndCommit("b", [], "m")).rejects.toThrow(/no files/);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("allows v3/extensions/<slug>/<slug>.json", async () => {
    const fetchMock = vi.fn(async () => respond(200, { object: { sha: "s" }, sha: "s" }));
    vi.stubGlobal("fetch", fetchMock);
    await expect(
      createBranchAndCommit(
        "backoffice/publish-1",
        [{ path: "v3/extensions/uk-england-wales/uk-england-wales.json", content: "{}" }],
        "m",
      ),
    ).resolves.toBe("s");
    expect(fetchMock).toHaveBeenCalled();
  });
});

describe("pinning reads and the commit to one base commit", () => {
  // The file the generator merged into must be the file the commit replaces.
  // If main moves in between, reading at "main" twice would silently revert it.
  it("getFileContent reads at the given ref", async () => {
    const fetchMock = vi.fn(async (_url: string, _init?: RequestInit) =>
      respond(200, { content: Buffer.from("{}").toString("base64") }),
    );
    vi.stubGlobal("fetch", fetchMock);
    await getFileContent("v3/extensions/a/a.json", "abc123");
    expect(String(fetchMock.mock.calls[0][0])).toContain("?ref=abc123");
  });

  it("createBranchAndCommit builds on the given base SHA without re-reading main", async () => {
    const fetchMock = vi.fn(async (_url: string, _init?: RequestInit) =>
      respond(200, { sha: "new" }),
    );
    vi.stubGlobal("fetch", fetchMock);
    await createBranchAndCommit(
      "backoffice/publish-1",
      [{ path: "v3/extensions/a/a.json", content: "{}" }],
      "m",
      "base999",
    );
    const urls = fetchMock.mock.calls.map((c) => String(c[0]));
    expect(urls.some((u) => u.includes("/git/ref/heads/main"))).toBe(false);
    const refCall = fetchMock.mock.calls.find((c) => String(c[0]).endsWith("/git/refs"));
    expect(JSON.parse(String(refCall![1]!.body)).sha).toBe("base999");
  });

  it("getMainSha returns the SHA main points at", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => respond(200, { object: { sha: "m1" } })));
    await expect(getMainSha()).resolves.toBe("m1");
  });
});
