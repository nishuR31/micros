// modules.js
// Dynamically generates the npm install command based on user choices and runs it
// Usage: import and call runModuleInstall(selectedModules)

import { execSync } from "node:child_process";
import chalk from "chalk";

export const allModules = {
  express: "Express (web server)",
  cors: "CORS (cross-origin resource sharing)",
  dotenv: "Dotenv (env config)",
  winston: "Winston (logging)",
  jsonwebtoken: "JWT (auth tokens)",
  qrcode: "QR Code generator",
  bcrypt: "Bcrypt (password hashing)",
  bullmq: "BullMQ (queues)",
  nodemailer: "Nodemailer (email)",
  ioredis: "ioredis (Redis client)",
  chalk: "Chalk (terminal colors)",
};

export function runModuleInstall(selected) {
  if (!selected || !selected.length) {
    console.log(chalk.yellow("No modules selected. Skipping install."));
    return;
  }
  const installCmd = `npm install ${selected.join(" ")}`;
  console.log(chalk.cyan("\nStarting module installation...\n"));
  console.log(chalk.green("Command:"), installCmd);
  try {
    execSync(installCmd, { stdio: "inherit" });
    console.log(
      chalk.green("\nAll selected modules installed successfully!\n"),
    );
    console.log(
      chalk.blueBright("Thank you for using the microservice generator!"),
    );
    console.log(
      chalk.magentaBright(
        '"The best way to get started is to quit talking and begin doing." - Walt Disney\n',
      ),
    );
  } catch (err) {
    console.error(chalk.red("\nError installing modules:"), err);
  }
}
