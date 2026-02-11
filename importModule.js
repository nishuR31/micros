import log from "./log.js";

// List of modules that should only be installed, not imported (CLI or non-importable)

// Fully ESM-compatible dynamic import and install
export default async function importModule(mod, importOpt = false) {
  if (!importOpt) {
    // Only install, do not import
    try {
      log(`Installing (no import) module '${mod}'...`);
      const { execSync } = await import("node:child_process");
      execSync(`npm install ${mod}`, { stdio: "inherit" });
      return null;
    } catch (err) {
      console.error(`Failed to install module '${mod}': ${err.message}`);
      throw err;
    }
  }
  try {
    return await import(mod);
  } catch (e) {
    if (
      e.code === "ERR_MODULE_NOT_FOUND" ||
      e.message.includes("Cannot find module")
    ) {
      // Use console for fallback output
      log(`Module '${mod}' not found. Installing...`);
      const { execSync } = await import("node:child_process");
      try {
        const pkgName = mod.replace(/^node:/, "");
        execSync(`npm install ${pkgName}`, { stdio: "inherit" });
        // Try importing again after install
        return await import(mod);
      } catch (err) {
        console.error(`Failed to install module '${mod}': ${err.message}`);
        throw err;
      }
    } else {
      throw e;
    }
  }
}
