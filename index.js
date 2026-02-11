#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import packageJson from "./package.js";
import importModule from "./importModule.js";
import log from "./log.js";
import { utils as codeUtils } from "./codeBase.js";
import prettier from "./prettier.js";
import gitignore from "./gitignore.js";
import destroy from "./destroy.js";

let modules = [];
let serviceNames = ["sharedService"];
let devModules = [];
let completed = false;

async function main() {
  const parentDir = process.cwd();
  await packageJson();
  const chalkMod = await importModule("chalk", true);
  const chalk = chalkMod.default;
  const readlineMod = await importModule("node:readline", true);
  const readline = readlineMod.default;
  let rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  function ask(question, defaultAnswer = "y") {
    return new Promise((resolve) =>
      rl.question(chalk.cyan(question), (answer) =>
        resolve(answer || defaultAnswer),
      ),
    );
  }
  log(chalk.green("Microservice Boilerplate Generator"));
  const projectName = await ask("Project name: ", "microservice");
  const rootDir = path.join(path.dirname(process.cwd()), projectName);
  if (!fs.existsSync(rootDir)) {
    fs.mkdirSync(rootDir);
    log(`→ Created project root: ${rootDir}`);
  } else {
    log(`→ Project root exists: ${rootDir}`);
  }
  process.chdir(rootDir);
  // Step 1: Prompt for package.json and modules
  // Step 2: Ask for services, DBs, config
  const numServices = Number.parseInt(await ask("How many microservices? "));

  for (let i = 0; i < numServices; i++) {
    serviceNames.push((await ask(`Name for service #${i + 1}: `)) + "Service");
  }
  const multiDb =
    (await ask("Use database? (y/n): ", "y")).toLowerCase() === "y";
  if (multiDb) {
    modules.push("prisma", "@prisma/client");
  }
  const useRedis =
    (await ask("Use Redis for caching? (y/n): ", "y")).toLowerCase() === "y";
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
  log("Adding dependencies asynchronously...");
  await Promise.all(modules.map((mod) => importModule(mod)));
  log("Adding dev dependencies asynchronously...");
  await Promise.all(devModules.map((mod) => importModule(mod)));

  log("Installing gitignore");
  gitignore();
  log("Adding env file for ease of access...");
  fs.writeFileSync(".env", "add ports, URIs for databse, redis and tokens");

  try {
    process.chdir(parentDir);
    log(chalk.green("Changed working directory to " + parentDir));
    completed = true;
    fs.rmSync(parentDir, { recursive: true, force: true });
    log(chalk.red(`Deleted project directory: ${parentDir}`));
  } catch (e) {
    log(
      chalk.red(
        "Failed to change directory or delete project dir: " + e.message,
      ),
    );
  }
  rl.close();
}

await main();
