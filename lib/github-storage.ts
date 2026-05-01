type GitHubConfig = {
  token: string;
  owner: string;
  repo: string;
  branch: string;
  authorName: string;
  authorEmail: string;
};

type GitHubContent = {
  content?: string;
  sha?: string;
};

function getGitHubConfig(): GitHubConfig | null {
  const token = process.env.GITHUB_TOKEN;
  const owner = process.env.GITHUB_OWNER;
  const repo = process.env.GITHUB_REPO;
  const branch = process.env.GITHUB_BRANCH || "main";

  if (!token || !owner || !repo) return null;

  return {
    token,
    owner,
    repo,
    branch,
    authorName: process.env.GITHUB_AUTHOR_NAME || "Yokobo AI Lab Admin",
    authorEmail: process.env.GITHUB_AUTHOR_EMAIL || "noreply@users.noreply.github.com"
  };
}

export function isGitHubStorageEnabled() {
  return Boolean(process.env.VERCEL && getGitHubConfig());
}

async function githubRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const config = getGitHubConfig();
  if (!config) {
    throw new Error("GitHub storage is not configured.");
  }

  const response = await fetch(`https://api.github.com${path}`, {
    ...init,
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${config.token}`,
      "Content-Type": "application/json",
      "User-Agent": "yokobo-ai-lab-admin",
      "X-GitHub-Api-Version": "2022-11-28",
      ...init?.headers
    }
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`GitHub API error ${response.status}: ${body}`);
  }

  return response.json() as Promise<T>;
}

function contentPath(filePath: string) {
  const config = getGitHubConfig();
  if (!config) {
    throw new Error("GitHub storage is not configured.");
  }

  return `/repos/${config.owner}/${config.repo}/contents/${encodeURIComponent(filePath).replace(/%2F/g, "/")}`;
}

async function getFileSha(filePath: string) {
  const config = getGitHubConfig();
  if (!config) return null;

  try {
    const data = await githubRequest<GitHubContent>(`${contentPath(filePath)}?ref=${encodeURIComponent(config.branch)}`);
    return data.sha ?? null;
  } catch (error) {
    if (error instanceof Error && error.message.includes("GitHub API error 404")) {
      return null;
    }
    throw error;
  }
}

export async function readTextFromGitHub(filePath: string) {
  const config = getGitHubConfig();
  if (!config) {
    throw new Error("GitHub storage is not configured.");
  }

  const data = await githubRequest<GitHubContent>(`${contentPath(filePath)}?ref=${encodeURIComponent(config.branch)}`);
  if (!data.content) return "";

  return Buffer.from(data.content, "base64").toString("utf8");
}

export async function writeTextToGitHub(filePath: string, text: string, message: string) {
  await writeBufferToGitHub(filePath, Buffer.from(text, "utf8"), message);
}

export async function writeBufferToGitHub(filePath: string, buffer: Buffer, message: string) {
  const config = getGitHubConfig();
  if (!config) {
    throw new Error("GitHub storage is not configured.");
  }

  const sha = await getFileSha(filePath);
  await githubRequest(contentPath(filePath), {
    method: "PUT",
    body: JSON.stringify({
      message,
      content: buffer.toString("base64"),
      branch: config.branch,
      sha: sha ?? undefined,
      author: {
        name: config.authorName,
        email: config.authorEmail
      },
      committer: {
        name: config.authorName,
        email: config.authorEmail
      }
    })
  });
}
