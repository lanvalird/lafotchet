import { Octokit } from "octokit";
import {
  getFirstDayInWeek,
  getIsoWithoutTime,
  getLastDayInWeek,
} from "./utils/week";
import { FETCHED_REPO_OWNER } from "./constants";
import { print } from "./utils/console/print";
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

print("");
print("Подтягиваю репозитории...", "»");

const repos = await octokit
  .request("GET /users/{owner}/repos", {
    owner: FETCHED_REPO_OWNER,
  })
  .then((res) => res.data);

print(`В общейм сумме их выходит ${repos.length}...`, "^");
print("");

Bun.write("logs/latest.txt", "");
const logs = Bun.file("logs/latest.txt");
const logsWriter = logs.writer();
logsWriter.start();

for (let index = 0; index < repos.length; index++) {
  const repo = repos[index];
  if (!repo) continue;
  const number = index + 1;

  print(`Подтягиваю ${number}-й: ${repo.name}...`, "»");
  logsWriter.write(`\n\n● ${repo.name}\n\n`);

  const branches = await branchesExec(repo.owner.login, repo.name);

  print(`Описываю: ${repo.name}...`, "*");
  logsWriter.write(`\n\n● ${repo.name}\n\n`);

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

    for (let i = 0; i < commits.length; i++) {
      const commit = commits[i];

      if (!commit) continue;

      logsWriter.write(
        `${commit.sha.slice(0, 7)}: ${commit.commit.message.split("\n")[0]}\n`
      );
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

logsWriter.end();

// Надо ещё форматирование добавить

print("");
print("Завершено!", "+");

process.exit();
