import { Octokit } from "octokit";
import {
  getFirstDayInWeek,
  getIsoWithoutTime,
  getLastDayInWeek,
} from "./utils/week";
import { FETCHED_REPO_OWNER } from "./constants";
import { print } from "./utils/console/print";

// Create a personal access token at https://github.com/settings/tokens/new?scopes=repo
const octokit = new Octokit({ auth: process.env.GITHUB_ACCESS_TOKEN });

// Compare: https://docs.github.com/en/rest/reference/users#get-the-authenticated-user
const {
  data: { login },
} = await octokit.rest.users.getAuthenticated();

print(`Привет, ${login}!`, "!");

const now = new Date(); // Etc. "2025-08-23"

const params = {
  since: getIsoWithoutTime(getFirstDayInWeek(now).toISOString()),
  until: getIsoWithoutTime(getLastDayInWeek(now).toISOString()),
};
print(
  `Так-с, мне надо подтянуть данные с ${new Date(
    params.since
  ).getUTCDate()} по ${new Date(params.until).getUTCDate()}?`,
  "?"
);

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

logsWriter;

logsWriter.start();
for (let i = 0; i < repos.length; i++) {
  const repo = repos[i];

  print(`Подтягиваю ${i + 1}-й: ${repo.name}...`, "»");

  const branches = await octokit.rest.repos
    .listBranches({
      owner: repo.owner.login,
      repo: repo.name,
    })
    .then((res) => res.data);

  print(`Описываю ${i + 1}-й: ${repo.name}...`, "*");
  print("");
  logsWriter.write(`\n\n● ${repo.name}\n`);

  branches.forEach((branch: { name: any }) => {
    async function execute() {
      const commits = await octokit.rest.repos
        .listCommits({
          owner: repo.owner.login,
          repo: repo.name,
          branch: branch.name,

          ...params,
        })
        .then((res) => res.data);

      if (commits.length === 0) return;
      print(`${branch.name}...`);

      commits.forEach(
        (commit: { sha: string | any[]; commit: { message: string } }) =>
          logsWriter.write(
            `${commit.sha.slice(0, 6)}: ${
              commit.commit.message.split("\n")[0]
            }\n`
          )
      );
    }

    execute();
  });
}
logsWriter.end();

// Надо ещё форматирование добавить

print("");
print("Завершено!", "+");

process.exit();
