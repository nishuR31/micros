import { execSync } from "node:child_process";
import handler from "./handler.js";
import path from "path";
import fs from "fs";
import log from "./log.js";
const readline = await import("node:readline");

const ask = (rl, question, def) =>
  new Promise((resolve) => {
    const prompt = def ? `${question} default:${def}: ` : `${question}: `;
    rl.question(prompt, (ans) => resolve(ans || def));
  });

const packageJson = handler(async (pkgPath, pkgData = {}) => {
  let dir = pkgPath;
  if (!dir) dir = process.cwd();
  else if (fs.existsSync(dir) && fs.lstatSync(dir).isFile())
    dir = path.dirname(dir);

  const pkgPathFile = path.join(dir, "package.json");
  if (fs.existsSync(pkgPathFile)) {
    log(`package.json already exists in ${dir}, skipping creation.`);
    return;
  }

  // Prompt for fields
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  const name = await ask(rl, "Package name", path.basename(dir));
  const description = await ask(rl, "Description", "A microservice project");
  const keywords = await ask(
    rl,
    "Keywords (comma separated)",
    "microservices, javascript, typescript...",
  );
  const author = await ask(rl, "Author", "");
  const github = await ask(rl, "Github", "");
  const repository = await ask(rl, "Repository", "");

  rl.close();

  let success = false;
  let attempts = 0;
  while (!success && attempts < 3) {
    try {
        console.log("Getting your package.json\n")
      execSync("npm init -y", { cwd: dir, stdio: "inherit" });
      // Read, update, and write package.json
      const pkg = JSON.parse(fs.readFileSync(pkgPathFile, "utf8"));
      Object.assign(pkg, {
        name,
        description,
        github,
        repository,
        script: {
          dev: "npx nodemon index.js",
          start: "node index.js",
          format: "npx prettier --format .",
        },
        private: "true",
        files: [],
        bugs: "",
        homepage: "",
        contributors: [],
        engines: {},
        dependencies: {},
        devDependencies: {},
        peerDependencies: {},
        optionalDependencies: {},
        config: {},
        bin: "",
        directories: {},
        keywords:
          keywords ?
            keywords
              .split(",")
              .map((k) => k.trim())
              .filter(Boolean)
          : [],
        author,
        type: "module",
        ...pkgData,
      });
      fs.writeFileSync(pkgPathFile, JSON.stringify(pkg, null, 2));
      log(`package.json created and updated successfully in ${dir}`);
      log(`Kindly update your package.json later`);
      success = true;
    } catch (e) {
      attempts++;
      log(`npm init failed (attempt ${attempts}): ${e.message}`);
      if (attempts < 3) {
        log(`Retrying npm init...`);
      } else {
        log(`Failed to create package.json after 3 attempts.`);
        throw e;
      }
    }
  }
});

export default packageJson;
// packageJson();
