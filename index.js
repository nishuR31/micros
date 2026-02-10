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
console.log("Installing modules for ${serviceName}...");
try {
  execSync("npm install", {{ stdio: "inherit" }});
  console.log("Modules installed.");
} catch (e) {
  console.error("Install failed:", e.message);
}
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
  const chalkMod = await importModule("chalk");
  const chalk = chalkMod.default;
  const readlineMod = await importModule("node:readline");
  const readline = readlineMod.default;
  let rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  function ask(question) {
    return new Promise((resolve) => rl.question(chalk.cyan(question), (answer) => resolve(answer)));
  }
  log(chalk.green("Microservice Boilerplate Generator"));
  // Step 1: Prompt for package.json and modules
  // Step 2: Ask for services, DBs, config
  const numServices = Number.parseInt(await ask("How many microservices? "));

  for (let i = 0; i < numServices; i++) {
    serviceNames.push((await ask(`Name for service #${i + 1}: `)) + "Service");
  }
  const multiDb = (await ask("Use multiple databases? (y/n): ")).toLowerCase() === "y";
  let dbType = "";
  if (multiDb) {
    const dbCount = Number.parseInt((await ask("How many databases? (default 1): ")) || "1");
    for (let i = 0; i < dbCount; i++) {
      const dbPrompt = "Database #" + (i + 1) + " name (e.g. postgres, mongodb): ";
      dbType = await ask(dbPrompt); // Use last entered DB as dbType
    }
  } else {
    dbType = await ask("Database name: (eg: mongodb) ");
  }
  const useRedis = (await ask("Use Redis for caching? (y/n): ")).toLowerCase() === "y";
  if (useRedis) {
    modules.push("ioredis");
  }
  serviceNames.push("gatewayService");
  for (const name of serviceNames) {
    const serviceDir = path.join(rootDir, name);
    try {
      fs.mkdirSync(serviceDir);
      ["config", "controller", "middleware", "routes", "repo", "src", "utils"].forEach((folder) => {
        fs.mkdirSync(path.join(serviceDir, folder));
      });
      let readme = "# " + name + " service";
      if (multiDb)
        readme += "\n\nThis service is configured for multiple databases. See config/dbs.js.";
      if (useRedis)
        readme +=
          "\n\nThis service uses Redis for caching. See config/redis.js and utils/cache.js.";
      fs.writeFileSync(path.join(serviceDir, "README.md"), readme);
      fs.writeFileSync(
        path.join(serviceDir, "schema.prisma"),
        "// Prisma schema for " + name + " (" + dbType + ")",
      );
      const sharedService = path.join("./sharedService", "utils");
      fs.writeFileSync(sharedService + "/time.js", codeUtils.time);
      fs.writeFileSync(sharedService + "/qr.js", codeUtils.qr);
      fs.writeFileSync(sharedService + "/handler.js", codeUtils.handler);
      fs.writeFileSync(sharedService + "/jwt.js", codeUtils.jwt);
      fs.writeFileSync(sharedService + "/logger.js", codeUtils.logger);
      fs.writeFileSync(path.join(sharedService, "crypto.js"), codeUtils.crypto);
      fs.writeFileSync(path.join(sharedService, "cookieOptions.js"), codeUtils.cookieOptions);
      fs.writeFileSync(path.join(sharedService, "codes.js"), codeUtils.codes);
      fs.writeFileSync(
        path.join(sharedService, "asyncHandler.js"),
        "const asyncHandler = (func) => (req, res, next) => Promise.resolve(func(req, res, next)).catch(next);\nexport default asyncHandler;\n",
      );
      log(chalk.blueBright(`Created service ${name}`));
    } catch (err) {
      log(chalk.red(`Error creating service ${name} : ${err.message}`));
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
  modules = [...new Set(...modules)];
  devModules = [...new Set(...devModules)];
  log("Adding prettierrc");
  prettier();
  log("Adding dependencies...");
    await importModule(module.join(" "));
  
  log("Adding dev dependencies...");
    await importModule(module.join(" "));
  

  log("Installing gitignore");
  gitignore();
  log("Adding env file for ease of access...");
  fs.writeFileSync(".env");

  try {
    process.chdir(rootDir);
    log(chalk.green("Changed working directory to " + rootDir));
  } catch (e) {
    log(chalk.red("Failed to change directory: " + e.message));
  }
  rl.close();
}

await main();
