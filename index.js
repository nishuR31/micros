#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";

import exampleCodes from "./exampleCodes.js";

async function main() {
  const chalk = (await ensureModule("chalk")).default;
  const readline = await ensureModule("node:readline");

  let rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  function ask(question) {
    return new Promise((resolve) =>
      rl.question(chalk.cyan(question), (answer) => resolve(answer)),
    );
  }

  console.log(chalk.green("Microservice Boilerplate Generator"));

  const numServices = parseInt(await ask("How many microservices? "));
  const serviceNames = [];
  for (let i = 0; i < numServices; i++) {
    serviceNames.push(await ask(`Name for service #${i + 1}: `));
  }
  const dbType = await ask("Database type (e.g., postgres, mysql, mongodb): ");
  const multiDb =
    (await ask("Use multiple databases? (y/n): ")).toLowerCase() === "y";
  const useRedis = (await ask("Use Redis? (y/n): ")).toLowerCase() === "y";

  // Always include gateway
  serviceNames.push("gateway");

  // Create base structure
  const baseDir = path.join(process.cwd());
  if (!fs.existsSync(baseDir)) fs.mkdirSync(baseDir);

  for (const name of serviceNames) {
    const serviceDir = path.join(baseDir, name);
    try {
      fs.mkdirSync(serviceDir);
      [
        "config",
        "controller",
        "middleware",
        "routes",
        "repo",
        "src",
        "utils",
      ].forEach((folder) => {
        fs.mkdirSync(path.join(serviceDir, folder));
      });
      // Add placeholder files
      let readme = `# ${name} service`;
      if (multiDb) {
        readme +=
          "\n\nThis service is configured for multiple databases. See config/dbs.js.";
      }
      if (useRedis) {
        readme +=
          "\n\nThis service uses Redis for caching. See config/redis.js and utils/cache.js.";
      }
      fs.writeFileSync(path.join(serviceDir, "README.md"), readme);
      fs.writeFileSync(
        path.join(serviceDir, "prisma.schema"),
        `// Prisma schema for ${name} (${dbType})`,
      );
      // Add utils from exampleCodes.js (evaluate as template string)
      const utilsDir = path.join(serviceDir, "utils");
      fs.writeFileSync(utilsDir + "/time.js", `${exampleCodes.utils.time}`);
      fs.writeFileSync(utilsDir + "/qr.js", `${exampleCodes.utils.qr}`);
      fs.writeFileSync(
        utilsDir + "/handler.js",
        `${exampleCodes.utils.handler}`,
      );
      fs.writeFileSync(utilsDir + "/jwt.js", `${exampleCodes.utils.jwt}`);
      fs.writeFileSync(utilsDir + "/logger.js", `${exampleCodes.utils.logger}`);
      // Extra utils from scafe/back/sharedService/utils
      fs.writeFileSync(
        path.join(utilsDir, "crypto.js"),
        `import bcrypt from "bcrypt";\nimport crypto from "crypto";\n\nconst SALT_ROUNDS = parseInt(process.env.BCRYPT_ROUNDS) || 12;\n\nexport async function hashPassword(password) {\n  return bcrypt.hash(password, SALT_ROUNDS);\n}\n\nexport async function comparePassword(password, hash) {\n  return bcrypt.compare(password, hash);\n}\n\nexport function generateToken(length = 32) {\n  return crypto.randomBytes(length).toString("hex");\n}\n\nexport function generateOTP(digits = 6) {\n  const min = Math.pow(10, digits - 1);\n  const max = Math.pow(10, digits) - 1;\n  return Math.floor(min + crypto.randomInt(max - min + 1)).toString();\n}\n\nexport function sha256(value) {\n  return crypto.createHash("sha256").update(value).digest("hex");\n}\n\nexport function generateResetToken(expiryMinutes = 15) {\n  const token = generateToken(32);\n  const hashedToken = sha256(token);\n  const expiresAt = new Date(Date.now() + expiryMinutes * 60 * 1000);\n\n  return { token, hashedToken, expiresAt };\n}\n\nexport function verifyResetToken(token, hashedToken, expiresAt) {\n  if (new Date() > new Date(expiresAt)) {\n    return false;\n  }\n  return sha256(token) === hashedToken;\n}\n`,
      );
      fs.writeFileSync(
        path.join(utilsDir, "cookieOptions.js"),
        `export default function cookieOptions(mode = "access") {\n  const isDev = process.env.MODE === "dev";\n\n  const base = {\n    httpOnly: true,\n    path: "/",\n    secure: !isDev, // false in dev, true in prod\n    sameSite: isDev ? "lax" : "none", // lax for localhost, none for cross-site prod\n    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days\n  };\n\n  if (mode.toLowerCase() === "access") {\n    return base;\n  }\n\n  return {\n    ...base,\n    maxAge: 15 * 24 * 60 * 60 * 1000, // 15 days\n  };\n}\n`,
      );
      fs.writeFileSync(
        path.join(utilsDir, "codes.js"),
        `import codes from "status-map";`,
      );
      if (useRedis) {
        // Only generate Redis-related files if useRedis is true
        fs.writeFileSync(
          path.join(serviceDir, "config", "redis.js"),
          `import Redis from "ioredis";\n\nconst redis = new Redis(process.env.REDIS_URL || "redis://localhost:6379");\n\nexport default redis;\n`,
        );
        fs.writeFileSync(
          path.join(utilsDir, "cache.js"),
          `import red from "../config/redis.js";\nimport logger from "../utils/logger.js";\nconst DEFAULT_TTL = parseInt(process.env.TTL || "5", 10); //s not in minute\n\nconst cache = {\n  async get(key) {\n    try {\n      const value = await red.get(key);\n      if (value) {\n        logger.debug(\`Cache HIT: \\${key}\");\n        return JSON.parse(value);\n      }\n      logger.debug(\`Cache MISS: \\${key}\");\n      return null;\n    } catch (error) {\n      logger.error(\`Cache GET error for \\${key}:\", error);\n      return null;\n    }\n  },\n\n  async set(key, value, ttl = DEFAULT_TTL) {\n    try {\n      await red.setex(key, Math.floor(ttl), JSON.stringify(value));\n      logger.debug(\`Cache SET: \\${key} (TTL: \\${ttl}s)\");\n      return true;\n    } catch (error) {\n      logger.error(\`Cache SET error for  \\${key}:\", error);\n      return false;\n    }\n  },\n\n  async del(key) {\n    try {\n      await red.del(key);\n      logger.debug(\`Cache DEL: \\${key}\");\n      return true;\n    } catch (error) {\n      logger.error(\`Cache DEL error for \\${key}:\", error);\n      return false;\n    }\n  },\n};\n\nexport default cache;\n`,
        );
      }
      if (multiDb) {
        // Only generate dbs.js config if multiDb is true
        fs.writeFileSync(
          path.join(serviceDir, "config", "dbs.js"),
          `// Example multi-database config\nexport default {\n  main: {\n    url: process.env.DB_MAIN_URL,\n    type: "${dbType}",\n  },\n  analytics: {\n    url: process.env.DB_ANALYTICS_URL,\n    type: "${dbType}",\n  },\n};\n`,
        );
      }
      fs.writeFileSync(
        path.join(utilsDir, "asyncHandler.js"),
        `const asyncHandler = (func) => (req, res, next) =>\n  Promise.resolve(func(req, res, next)).catch(next);\nexport default asyncHandler;\n`,
      );
      console.log(chalk.blueBright(`✔ Created service: ${name}`));
    } catch (err) {
      console.log(
        chalk.red(`Error creating service '${name}': ${err.message}`),
      );
    }
  }

  // Summary and next steps
  console.log(chalk.green("\nBoilerplate generated in output/"));
  console.log(chalk.yellow("\nNext steps:"));
  console.log("  1. cd output/<service>");
  if (useRedis) console.log("  2. npm install ioredis");
  if (multiDb) console.log("  2. Configure your databases in config/dbs.js");
  console.log("  3. npm install (if needed)");
  console.log("  4. Start coding your microservice!");
  rl.close();
}

// Dynamic import and install for missing modules
async function ensureModule(mod) {
  try {
    return await import(mod);
  } catch (e) {
    if (e.code === "ERR_MODULE_NOT_FOUND") {
      console.log(`Module '${mod}' not found. Installing...`);
      const { execSync } = await import("node:child_process");
      execSync(`npm install ${mod.replace(/^node:/, "")}`, {
        stdio: "inherit",
      });
      return await import(mod);
    } else {
      throw e;
    }
  }
}

main();
