// GitHub Integration — raw fetch wrapper for creating branches, committing
// schema files, and opening PRs against the openinherit/standard repo.
// Uses fetch instead of Octokit to avoid library issues on Vercel.

function getToken(): string {
  const token = process.env.GITHUB_TOKEN?.trim();
  if (!token) throw new Error("GITHUB_TOKEN is not set");
  return token;
}

function getOwner(): string {
  const owner = process.env.GITHUB_OWNER?.trim();
  if (!owner) throw new Error("GITHUB_OWNER is not set");
  return owner;
}

function getRepo(): string {
  const repo = process.env.GITHUB_REPO?.trim();
  if (!repo) throw new Error("GITHUB_REPO is not set");
  return repo;
}

async function ghApi(
  path: string,
  options: { method?: string; body?: unknown } = {},
): Promise<unknown> {
  const token = getToken();
  const url = `https://api.github.com${path}`;
  const res = await fetch(url, {
    method: options.method ?? "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "Content-Type": "application/json",
      "X-GitHub-Api-Version": "2022-11-28",
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`GitHub API ${res.status}: ${text.substring(0, 200)}`);
  }

  return res.json();
}

// ------------------------------------------------------------------
// Read a file from the repo (returns null when the file doesn't exist)
// ------------------------------------------------------------------

export async function getFileContent(path: string): Promise<string | null> {
  const owner = getOwner();
  const repo = getRepo();

  try {
    const data = (await ghApi(
      `/repos/${owner}/${repo}/contents/${path}?ref=main`,
    )) as { content?: string };

    if (data.content) {
      return Buffer.from(data.content, "base64").toString("utf-8");
    }
    return null;
  } catch {
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
  const owner = getOwner();
  const repo = getRepo();

  console.log("[github] creating branch:", branchName, "files:", files.map((f) => f.path));

  // Get the SHA that main currently points at
  const ref = (await ghApi(
    `/repos/${owner}/${repo}/git/ref/heads/main`,
  )) as { object: { sha: string } };
  const baseSha = ref.object.sha;
  console.log("[github] base SHA:", baseSha);

  // Create the new branch
  await ghApi(`/repos/${owner}/${repo}/git/refs`, {
    method: "POST",
    body: { ref: `refs/heads/${branchName}`, sha: baseSha },
  });
  console.log("[github] branch created:", branchName);

  // Create blobs for every file
  const blobs = await Promise.all(
    files.map(async (file) => {
      const blob = (await ghApi(`/repos/${owner}/${repo}/git/blobs`, {
        method: "POST",
        body: { content: file.content, encoding: "utf-8" },
      })) as { sha: string };
      return {
        path: file.path,
        mode: "100644",
        type: "blob",
        sha: blob.sha,
      };
    }),
  );

  // Build a tree that layers the new blobs on top of the base
  const tree = (await ghApi(`/repos/${owner}/${repo}/git/trees`, {
    method: "POST",
    body: { base_tree: baseSha, tree: blobs },
  })) as { sha: string };

  // Create the commit
  const commit = (await ghApi(`/repos/${owner}/${repo}/git/commits`, {
    method: "POST",
    body: { message: commitMessage, tree: tree.sha, parents: [baseSha] },
  })) as { sha: string };

  // Point the branch at the new commit
  await ghApi(`/repos/${owner}/${repo}/git/refs/heads/${branchName}`, {
    method: "PATCH",
    body: { sha: commit.sha },
  });

  console.log("[github] committed:", commit.sha);
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
  const owner = getOwner();
  const repo = getRepo();

  const pr = (await ghApi(`/repos/${owner}/${repo}/pulls`, {
    method: "POST",
    body: { title, body, head: branchName, base: "main" },
  })) as { number: number; html_url: string };

  console.log("[github] PR created:", pr.number, pr.html_url);
  return { number: pr.number, url: pr.html_url };
}
