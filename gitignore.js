import { execSync } from "node:child_process";
import fs from "fs";
import path from "path";
import log from "./log.js";

const gitignore = async (targetDir = process.cwd()) => {
  const repoUrl = "https://github.com/nishur31/gitignore";
  const cloneDir = path.join(targetDir, "gitignore");
  if (fs.existsSync(cloneDir)) {
    log(`Removing existing temp directory: ${cloneDir}`);
    fs.rmSync(cloneDir, { recursive: true, force: true });
  }
  log(`Cloning gitignore generator repo...`);
  execSync(`git clone ${repoUrl} ${cloneDir}`, { stdio: "inherit" });
  process.chdir(cloneDir);
  log(`Running npm start to generate .gitignore...`);
  execSync(`npm start`, { stdio: "inherit" });
  // Move .gitignore to targetDir if created
  const gitignorePath = path.join(cloneDir, ".gitignore");
  if (fs.existsSync(gitignorePath)) {
    fs.copyFileSync(gitignorePath, path.join(targetDir, ".gitignore"));
    log(`.gitignore created in ${targetDir}`);
  } else {
    log(`.gitignore not found after running script.`);
  }
  // Cleanup
};

export default gitignore;
