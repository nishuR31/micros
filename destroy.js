function destroy(files = [], completed = false, selfDestruct = false) {
  return `#!/usr/bin/env node
import fs from "node:fs";
import { execSync } from "node:child_process";
import path from "node:path";
/* Self-destruct switch: set to true to delete installer after run, false to keep it */
const selfDestruct = ${selfDestruct};
const filesToDelete = ${JSON.stringify(files)};
let completed = ${completed};


if (completed && Array.isArray(filesToDelete)) {
  for (const file of filesToDelete) {
    try {
      if (fs.existsSync(file)) {
        fs.unlinkSync(file);
        console.log(\`Deleted file: ${file}\`);
      }
    } catch (e) {
      console.error(\`Failed to delete file: ${file}", e.message\`);
    }
  }
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

export default destroy;
