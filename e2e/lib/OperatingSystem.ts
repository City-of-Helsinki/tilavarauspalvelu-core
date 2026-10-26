/** Robot Framework OperatingSystem library keywords the suite uses, with the same names. */
import { existsSync, statSync } from "node:fs";
import { join } from "node:path";
import { appendFile, mkdir, readFile } from "node:fs/promises";
import { library } from "./robot";
import type { RobotValue } from "./robot";

export const OperatingSystem = library("OperatingSystem", {
  "Create Directory": async (path: RobotValue) => {
    await mkdir(String(path), { recursive: true });
  },

  "Directory Should Exist": (path: RobotValue, msg?: RobotValue) => {
    if (!existsSync(String(path)) || !statSync(String(path)).isDirectory()) {
      throw new Error(msg == null || msg === "" ? `Directory '${String(path)}' does not exist.` : String(msg));
    }
  },

  "File Should Exist": (path: RobotValue, msg?: RobotValue) => {
    if (!existsSync(String(path)) || !statSync(String(path)).isFile()) {
      throw new Error(msg == null || msg === "" ? `File '${String(path)}' does not exist.` : String(msg));
    }
  },

  "Get File": (path: RobotValue, encoding: RobotValue = "utf8") =>
    readFile(String(path), { encoding: /^utf-?8$/i.test(String(encoding)) ? "utf8" : "latin1" }),

  "Append To File": async (path: RobotValue, content: RobotValue) => {
    await appendFile(String(path), String(content), "utf8");
  },

  "Join Path": (base: RobotValue, ...parts: RobotValue[]) => join(String(base), ...parts.map(String)),
});
