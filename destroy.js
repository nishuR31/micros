import fs from "node:fs";
import path from "node:path";

function destroy(files = [], completed = false, selfDestruct = false) {
  if (completed && Array.isArray(files)) {
    for (const file of files) {
      try {
        if (fs.existsSync(file)) {
          fs.unlinkSync(file);
          console.log(`Deleted file: ${file}`);
        }
      } catch (e) {
        console.error(`Failed to delete file: ${file}`, e.message);
      }
    }
  }

  if (selfDestruct) {
    try {
      fs.unlinkSync(new URL(import.meta.url));
      console.log("Self-destruct: destroy.js deleted itself.");
    } catch (e) {
      console.error("Failed to self-destruct destroy.js", e.message);
    }
  } else {
    console.log("Self-destruct is off: destroy.js not deleted.");
  }
}

export default destroy;
