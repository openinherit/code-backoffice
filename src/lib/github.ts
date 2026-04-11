// GitHub Integration — Octokit wrapper for creating branches, committing
// schema files, and opening PRs against the openinherit/standard repo.

import { Octokit } from "octokit";

// Lazy-initialised so the module can be imported in tests without a token.
let _octokit: Octokit | null = null;

function getOctokit(): Octokit {
  if (!_octokit) {
    const token = process.env.GITHUB_TOKEN;
    if (!token) throw new Error("GITHUB_TOKEN is not set");
    _octokit = new Octokit({ auth: token });
  }
  return _octokit;
}

function getOwner(): string {
  const owner = process.env.GITHUB_OWNER;
  if (!owner) throw new Error("GITHUB_OWNER is not set");
  return owner;
}

function getRepo(): string {
  const repo = process.env.GITHUB_REPO;
  if (!repo) throw new Error("GITHUB_REPO is not set");
  return repo;
}

// ------------------------------------------------------------------
// Read a file from the repo (returns null when the file doesn't exist)
// ------------------------------------------------------------------

export async function getFileContent(path: string): Promise<string | null> {
  const octokit = getOctokit();
  const owner = getOwner();
  const repo = getRepo();

  try {
    const { data } = await octokit.rest.repos.getContent({
      owner,
      repo,
      path,
      ref: "main",
    });

    if ("content" in data) {
      return Buffer.from(data.content, "base64").toString("utf-8");
    }
    return null;
  } catch {
    // 404 = file doesn't exist yet
    return null;
  }
}

// ------------------------------------------------------------------
// Create a branch, commit files, and return the commit SHA
// ------------------------------------------------------------------

export async function createBranchAndCommit(
  branchName: string,
  files: Array<{ path: string; content: string }>,
  commitMessage: string,
): Promise<string> {
  const octokit = getOctokit();
  const owner = getOwner();
  const repo = getRepo();

  const tokenPrefix = process.env.GITHUB_TOKEN?.substring(0, 15) ?? "MISSING";
  console.log("[github] createBranchAndCommit:", { branchName, owner, repo, fileCount: files.length, tokenPrefix });

  // Get the SHA that main currently points at
  let baseSha: string;
  try {
    const { data: ref } = await octokit.rest.git.getRef({
      owner,
      repo,
      ref: "heads/main",
    });
    baseSha = ref.object.sha;
    console.log("[github] base SHA:", baseSha);
  } catch (e: unknown) {
    const err = e as { status?: number; message?: string };
    console.error("[github] getRef failed:", err.status, err.message);
    throw e;
  }

  // Create the new branch
  await octokit.rest.git.createRef({
    owner,
    repo,
    ref: `refs/heads/${branchName}`,
    sha: baseSha,
  });

  // Create blobs for every file
  const blobs = await Promise.all(
    files.map(async (file) => {
      const { data: blob } = await octokit.rest.git.createBlob({
        owner,
        repo,
        content: file.content,
        encoding: "utf-8",
      });
      return {
        path: file.path,
        mode: "100644" as const,
        type: "blob" as const,
        sha: blob.sha,
      };
    }),
  );

  // Build a tree that layers the new blobs on top of the base
  const { data: tree } = await octokit.rest.git.createTree({
    owner,
    repo,
    base_tree: baseSha,
    tree: blobs,
  });

  // Create the commit
  const { data: commit } = await octokit.rest.git.createCommit({
    owner,
    repo,
    message: commitMessage,
    tree: tree.sha,
    parents: [baseSha],
  });

  // Point the branch at the new commit
  await octokit.rest.git.updateRef({
    owner,
    repo,
    ref: `heads/${branchName}`,
    sha: commit.sha,
  });

  return commit.sha;
}

// ------------------------------------------------------------------
// Open a pull request
// ------------------------------------------------------------------

export async function createPullRequest(
  branchName: string,
  title: string,
  body: string,
): Promise<{ number: number; url: string }> {
  const octokit = getOctokit();
  const owner = getOwner();
  const repo = getRepo();

  const { data: pr } = await octokit.rest.pulls.create({
    owner,
    repo,
    title,
    body,
    head: branchName,
    base: "main",
  });

  return { number: pr.number, url: pr.html_url };
}
