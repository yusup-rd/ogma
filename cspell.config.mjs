import { readFileSync } from "node:fs";

const settings = JSON.parse(
  readFileSync(new URL("./.vscode/settings.json", import.meta.url), "utf8"),
);

export default {
  version: "0.2",
  words: settings["cSpell.words"],
  ignorePaths: settings["cSpell.ignorePaths"],
  ignoreRegExpList: ["/[\\p{Script=Cyrillic}]+/gu"],
};
