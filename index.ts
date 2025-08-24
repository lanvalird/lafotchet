import { Octokit } from "octokit";
import {
  getFirstDayInWeek,
  getIsoWithoutTime,
  getLastDayInWeek,
} from "./utils/week";

// Create a personal access token at https://github.com/settings/tokens/new?scopes=repo
const octokit = new Octokit({ auth: process.env.GITHUB_ACCESS_TOKEN });

// Compare: https://docs.github.com/en/rest/reference/users#get-the-authenticated-user
const {
  data: { login },
} = await octokit.rest.users.getAuthenticated();

console.log(`Привет, ${login}!`);

const now = new Date();

const params = {
  since: getIsoWithoutTime(getFirstDayInWeek(now).toISOString()),
  until: getIsoWithoutTime(getLastDayInWeek(now).toISOString()),
};
console.log(
  `Так-с, мне надо подтянуть данные с ${new Date(
    params.since
  ).getUTCDate()} по ${new Date(params.until).getUTCDate()}?`
);

console.log("Подтягиваю...");

const repos = await octokit
  .request("GET /users/{owner}/repos", {
    owner: "Lazy-And-Focused",
  })
  .then((res) => res.data);

console.log(`Получается ${repos.length} репозиториев...`);

Bun.write("logs/latest.txt", "");
const logs = Bun.file("logs/latest.txt");
const logsWriter = logs.writer();

logsWriter;

logsWriter.start();
for (let i = 0; i < repos.length; i++) {
  const repo = repos[i];

  console.log(`Подтягиваю ${i + 1}-й: ${repo.name}...`);

  const commits = await octokit.rest.repos
    .listCommits({
      owner: repo.owner.login,
      repo: repo.name,
      ...params,
    })
    .then((res) => res.data);

  if (commits.length === 0) continue;
  console.log(`Описываю ${i + 1}-й: ${repo.name}...`);

  logsWriter.write("● " + repo.name + "\n");
  commits.forEach((commit) =>
    logsWriter.write(
      `${commit.sha.slice(0, 6)}: ${commit.commit.message.split("\n")[0]}\n`
    )
  );
  logsWriter.write("\n");
}
logsWriter.end();

console.log("Завершено!");

process.abort();
