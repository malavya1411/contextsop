const path = require("path");

const isWin = process.platform === "win32";

function runInDir(dir, command) {
  if (isWin) {
    return `cmd.exe /c "cd ${dir} && ${command}"`;
  } else {
    return `sh -c "cd ${dir} && ${command}"`;
  }
}

module.exports = {
  // Frontend TS/TSX files
  "frontend/src/**/*.{ts,tsx}": (filenames) => {
    const relativeFiles = filenames.map((file) => path.relative("frontend", file).replace(/\\/g, "/"));
    const filesStr = relativeFiles.join(" ");
    return [
      runInDir("frontend", `npx prettier --write ${filesStr}`),
      runInDir("frontend", `npx eslint --max-warnings=0 ${filesStr}`),
      runInDir("frontend", "npm run typecheck")
    ];
  },
  // Frontend CSS files
  "frontend/src/**/*.css": (filenames) => {
    const relativeFiles = filenames.map((file) => path.relative("frontend", file).replace(/\\/g, "/"));
    const filesStr = relativeFiles.join(" ");
    return [
      runInDir("frontend", `npx prettier --write ${filesStr}`)
    ];
  },
  // Backend Python files
  "backend/**/*.py": (filenames) => {
    const relativeFiles = filenames.map((file) => path.relative("backend", file).replace(/\\/g, "/"));
    const ruffExec = isWin ? ".venv/Scripts/ruff" : ".venv/bin/ruff";
    const filesStr = relativeFiles.join(" ");
    return [
      runInDir("backend", `${ruffExec} check --fix ${filesStr}`),
      runInDir("backend", `${ruffExec} format ${filesStr}`)
    ];
  }
};
