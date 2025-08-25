import * as constants from "../../constants";

export function print(message: string, symboul: string = " "): void {
  message = format(message);

  console.log(`\x1b[0;35;47m ${symboul[0] || " "} \x1b[0m ${message}\x1b[0m`);
}

export function printError(message: string): void {
  console.error(message);
}

function format(message: string): string {
  message = replaceVariables(message, constants);

  return message;
}

function replaceVariables(
  message: string,
  matches: Record<string, string>
): string {
  const regex = /\{(.+?)\}/g;

  return message.replace(regex, (match, group) => matches[group] || match);
}
