import fs from "node:fs";
import path from "node:path";

const prettierRc = {
  semi: true,
  singleQuote: false,
  trailingComma: "all",
  printWidth: 100,
  tabWidth: 2,
};

const prettierIgnore = `node_modules/
build/
dist/
`;

export function prettier({ rc = true, ignore = false, dir = process.cwd() } = {}) {
  if (rc) {
    const rcPath = path.join(dir, ".prettierrc");
    if (!fs.existsSync(rcPath)) {
      fs.writeFileSync(rcPath, JSON.stringify(prettierRc, null, 2));
      console.log(".prettierrc created");
    } else {
      console.log(".prettierrc already exists");
    }
  }
  if (ignore) {
    const ignorePath = path.join(dir, ".prettierignore");
    if (!fs.existsSync(ignorePath)) {
      fs.writeFileSync(ignorePath, prettierIgnore);
      console.log(".prettierignore created");
    } else {
      console.log(".prettierignore already exists");
    }
  }
}

export default prettier;
// prettier();
