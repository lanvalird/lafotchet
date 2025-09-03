import { Octokit } from "octokit";
import {
  getFirstDayInWeek,
  getIsoWithoutTime,
  getLastDayInWeek,
} from "./utils/week";
import { FETCHED_REPO_OWNER } from "./constants";
import { print } from "./utils/console/print";
import type { InfoBranch, InfoCommit } from "./types";
const octokit = new Octokit({ auth: process.env.GITHUB_ACCESS_TOKEN });
const {
  data: { login },
} = await octokit.rest.users.getAuthenticated();

print(`Привет, ${login}!`, "!");

const now = new Date(); // Etc. "2025-08-23"
function getIsoWithToString(func: (date: number | string | Date) => Date) {
  return getIsoWithoutTime(func(now).toISOString());
}
const params = {
  since: getIsoWithToString(getFirstDayInWeek),
  until: getIsoWithToString(getLastDayInWeek),
};

const since = new Date(params.since).getUTCDate();
const until = new Date(params.until).getUTCDate();
print(`Так-с, мне надо подтянуть данные с ${since} по ${until}?`, "?");

print("Инициализирую виртуальное хранилище...", "»");
print("");

type Data = {
  branches: InfoBranch[];
  commits: InfoCommit[];
};

const data: Data = {
  branches: [],
  commits: [],
};

print("");
print("Подтягиваю репозитории...", "»");

const repos = await octokit
  .request("GET /users/{owner}/repos", {
    owner: FETCHED_REPO_OWNER,
  })
  .then((res) => res.data);

print(`В общейм сумме их выходит ${repos.length}...`, "^");
print("");

for (let index = 0; index < repos.length; index++) {
  const repo = repos[index];
  if (!repo) continue;
  const number = index + 1;

  print(`Подтягиваю ${number}-й: ${repo.name}...`, "»");

  const branches = await branchesExec(repo.owner.login, repo.name);

  print(`Описываю: ${repo.name}...`, "*");

  for (let index = 0; index < branches.length; index++) {
    const branch = branches[index];
    if (!branch) continue;

    const commits = await commitsExec(
      repo.owner.login,
      repo.name,
      branch.name,
      params
    );
    if (commits.length === 0) break;
    print(`Найдена ветвь: ${branch.name}`);
    data.branches.push({
      repo: repo.name,
      name: branch.name,
    });

    for (let index = 0; index < commits.length; index++) {
      const commit = commits[index];

      if (!commit) continue;

      data.commits.push({
        branch: { name: branch.name },
        sha: commit.sha,
        message: commit.commit.message,
      });
    }
  }

  print(`${number}-й репозиторий готов`, "^");
  print("");
}

async function branchesExec(ownerLogin: string, repoName: string) {
  return await octokit.rest.repos
    .listBranches({
      owner: ownerLogin,
      repo: repoName,
    })
    .then((res) => res.data);
}

async function commitsExec(
  ownerLogin: string,
  repoName: string,
  branchName: string,
  params?: any
) {
  return await octokit.rest.repos
    .listCommits({
      owner: ownerLogin,
      repo: repoName,
      branch: branchName,

      ...params,
    })
    .then((res) => res.data);
}

const out: Data & {
  repos: { name: string }[];
} = {
  repos: [],
  commits: [],
  branches: [],
};

for (let index = 0; index < data.commits.length; index++) {
  const commit = data.commits[index];
  if (!commit) continue;

  if (out.commits.find(({ sha }) => sha === commit.sha)) continue;
  out.commits.push(commit);

  const branch = data.branches.find(
    (branch) => branch.name === commit.branch.name
  );
  if (!branch || out.branches.find(({ name }) => name === branch.name))
    continue;
  out.branches.push(branch);
}

for (let index = 0; index < out.branches.length; index++) {
  const branch = out.branches[index];
  if (!branch) continue;

  if (!out.repos.find(({ name }) => name === branch.repo)) {
    out.repos.push({ name: branch.repo });
  }
}

const logs = Bun.file("logs/latest.txt");
await Bun.write(logs, "");
const logsWriter = logs.writer();

let logContent = "";

for (let index = 0; index < out.repos.length; index++) {
  const repo = out.repos[index];
  if (!repo) continue;

  logContent += `\n\n( ${repo.name} )\n`;

  for (let index = 0; index < out.branches.length; index++) {
    const branch = out.branches[index];
    if (!branch) continue;

    if (branch.repo !== repo.name) continue;

    logContent += `\n^ ${branch.name}\n\n`;

    for (let index = 0; index < out.commits.length; index++) {
      const commit = out.commits[index];
      if (!commit) continue;

      if (commit.branch.name !== branch.name) continue;

      logContent += `${commit.sha.slice(0, 7)}: ${
        commit.message.split("\n")[0]
      }\n`;
    }
  }
}

// Записываем все содержимое одним вызовом
await Bun.write("logs/latest.txt", logContent);

logsWriter.end();

print("");
print("Завершено!", "+");

process.exit();
