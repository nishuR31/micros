#!/usr/bin/env node

import fs, { read } from "node:fs";
import path from "node:path";
import packageJson from "./package.js";
import importModule from "./importModule.js";
import log from "./log.js";
import { utils as codeUtils } from "./codeBase.js";
import prettier from "./prettier.js";
import gitignore from "./gitignore.js";

let modules = [];
let serviceNames = ["sharedService"];
let devModules = [];

function generateInstallerScript(serviceName, selfDestruct = false) {
  return `#!/usr/bin/env node
import fs from "fs";
import {{ execSync }} from "child_process";
import path from "path";
/* Self-destruct switch: set to true to delete installer after run, false to keep it */
const selfDestruct = ${selfDestruct};
if (selfDestruct) {
  process.on("SIGINT", () => {
    try {
      fs.unlinkSync(import.meta.url.replace('file://', ''));
      console.log("Installer deleted on SIGINT.");
    } catch (e) {}
    process.exit();
  });
  try {
    fs.unlinkSync(import.meta.url.replace('file://', ''));
    console.log("Installer deleted after install.");
  } catch (e) {}
} else {
  console.log("Self-destruct is off: installer not deleted.");
}
`;
}

async function main() {
  const rootDir = process.cwd();
  await packageJson();
  const chalkMod = await importModule("chalk", true);
  const chalk = chalkMod.default;
  const readlineMod = await importModule("node:readline", true);
  const readline = readlineMod.default;
  let rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  function ask(question) {
    return new Promise((resolve) =>
      rl.question(chalk.cyan(question), (answer) => resolve(answer)),
    );
  }
  log(chalk.green("Microservice Boilerplate Generator"));
  // Step 1: Prompt for package.json and modules
  // Step 2: Ask for services, DBs, config
  const numServices = Number.parseInt(await ask("How many microservices? "));

  for (let i = 0; i < numServices; i++) {
    serviceNames.push((await ask(`Name for service #${i + 1}: `)) + "Service");
  }
  const multiDb =
    (await ask("Use  database? (y/n): ")).toLowerCase() === "y";
  if (multiDb) { modules.push("prisma","@prisma/client")
  }
  const useRedis =
    (await ask("Use Redis for caching? (y/n): ")).toLowerCase() === "y";
  if (useRedis) {
    modules.push("ioredis");
  }
  serviceNames.push("gatewayService");
  for (const name of serviceNames) {
    const serviceDir = path.join(rootDir, name);
    try {
      if (!fs.existsSync(serviceDir)) {
        fs.mkdirSync(serviceDir);
        log(`→ Created directory: ${serviceDir}`);
      } else {
        log(`→ Directory exists: ${serviceDir}`);
      }
      [
        "config",
        "controller",
        "middleware",
        "routes",
        "repo",
        "src",
        "utils",
      ].forEach((folder) => {
        const folderPath = path.join(serviceDir, folder);
        if (!fs.existsSync(folderPath)) {
          fs.mkdirSync(folderPath);
          log(`   ↳ Created folder: ${folderPath}`);
        } else {
          log(`   ↳ Folder exists: ${folderPath}`);
        }
      });
      const schemaPath = path.join(serviceDir, "schema.prisma");
      if (!fs.existsSync(schemaPath)) {
        fs.writeFileSync(schemaPath, "// Prisma schema\n");
        log(`   ↳ Created file: ${schemaPath}`);
      } else {
        log(`   ↳ File exists: ${schemaPath}`);
      }
      const sharedService = path.join("./sharedService", "utils");
      const sharedFiles = [
        ["/time.js", codeUtils.time],
        ["/qr.js", codeUtils.qr],
        ["/handler.js", codeUtils.handler],
        ["/jwt.js", codeUtils.jwt],
        ["/logger.js", codeUtils.logger],
        ["/crypto.js", codeUtils.crypto],
        ["/cookieOptions.js", codeUtils.cookieOptions],
        ["/codes.js", codeUtils.codes],
        [
          "/asyncHandler.js",
          "const asyncHandler = (func) => (req, res, next) => Promise.resolve(func(req, res, next)).catch(next);\nexport default asyncHandler;\n",
        ],
      ];
      for (const [file, data] of sharedFiles) {
        const filePath =
          file.startsWith("/") ?
            sharedService + file
          : path.join(sharedService, file);
        if (!fs.existsSync(filePath)) {
          fs.writeFileSync(filePath, data || "");
          log(`   ↳ Created shared util: ${filePath}`);
        } else {
          log(`   ↳ Shared util exists: ${filePath}`);
        }
      }
      log(`✔ Service ready: ${name}`);
    } catch (err) {
      log(chalk.red(`✖ Error creating service ${name} : ${err.message}`));
    }
  }
  log(chalk.green("\nBoilerplate generated in " + rootDir));
  log(chalk.yellow("\nNext steps:"));
  log(`Configure your databases in config/dbs.js of each service`);
  log(`Start coding your microservice!`);
  log("Installing required modules in project root now.");
  // Only add core modules if not already present
  modules.push(
    ...[
      "winston",
      "jsonwebtoken",
      "bcrypt",
      "qrcode",
      "status-map",
      "cors",
      "express",
      "dotenv",
      "envf",
    ],
  );
  devModules.push(...["morgan", "nodemon", "prettier"]);
  // Only install actual npm packages, not DB names
  log("Removing duplicate modules if any...");
  modules = [...new Set(modules)];
  devModules = [...new Set(devModules)];
  log("Adding prettierrc");
  prettier();
  log("Adding dependencies...");
  for(let mod of modules){await importModule(mod)};

  log("Adding dev dependencies...");
  for(let mod of devModules){await importModule(mod)};

  log("Installing gitignore");
  gitignore();
  log("Adding env file for ease of access...");
  fs.writeFileSync(".env","add ports, URIs for databse, redis and tokens");

  try {
    process.chdir(rootDir);
    log(chalk.green("Changed working directory to " + rootDir));
  } catch (e) {
    log(chalk.red("Failed to change directory: " + e.message));
  }
  rl.close();
}

await main();
