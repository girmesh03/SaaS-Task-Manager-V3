import { spawn, spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const REQUIRED_NODE = { major: 20, minor: 19, patch: 0 };

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const clientRoot = path.resolve(__dirname, "..");

const parseNodeVersion = (version) => {
  const [major, minor, patch] = String(version)
    .split(".")
    .map((part) => Number(part));

  return {
    major: Number.isFinite(major) ? major : 0,
    minor: Number.isFinite(minor) ? minor : 0,
    patch: Number.isFinite(patch) ? patch : 0,
  };
};

const isAtLeast = (version, minimum) => {
  if (version.major !== minimum.major) return version.major > minimum.major;
  if (version.minor !== minimum.minor) return version.minor > minimum.minor;
  return version.patch >= minimum.patch;
};

const escapeForBash = (value) =>
  `'${String(value).replace(/'/g, `'\"'\"'`)}'`;

const winPathToWsl = (winPath) => {
  const match = /^([a-zA-Z]):[\\/](.*)$/.exec(winPath);
  if (!match) {
    return String(winPath).replace(/\\/g, "/");
  }

  const drive = match[1].toLowerCase();
  const rest = match[2].replace(/\\/g, "/");
  return `/mnt/${drive}/${rest}`;
};

const run = (command, args, options = {}) => {
  const child = spawn(command, args, {
    stdio: "inherit",
    ...options,
  });

  child.on("exit", (code, signal) => {
    if (signal) {
      process.exit(1);
    }
    process.exit(code ?? 1);
  });

  child.on("error", (error) => {
    console.error(error?.message || error);
    process.exit(1);
  });
};

const readNodeVersion = (nodeBinary) => {
  const result = spawnSync(nodeBinary, ["-v"], { encoding: "utf8" });
  if (result.error) {
    return null;
  }

  const output = String(result.stdout || result.stderr || "").trim();
  if (!output) {
    return null;
  }

  const normalized = output.startsWith("v") ? output.slice(1) : output;
  return parseNodeVersion(normalized);
};

const resolveCompatibleNodeBinary = () => {
  const candidates = [
    process.env.TASK_MANAGER_NODE,
    "/tmp/node-v20.19.0-linux-x64/bin/node",
  ].filter(Boolean);

  for (const candidate of candidates) {
    try {
      if (!fs.existsSync(candidate)) {
        continue;
      }

      const version = readNodeVersion(candidate);
      if (version && isAtLeast(version, REQUIRED_NODE)) {
        return candidate;
      }
    } catch {
      // ignore candidate
    }
  }

  return null;
};

/**
 * Why this wrapper exists:
 * - The repo lives on a Windows drive (`/mnt/<drive>`). If `npm`/`node` runs on Windows,
 *   it can't execute Linux `node_modules/.bin/*` shims (no `.cmd`), leading to:
 *   "'vite' is not recognized..."
 * - Phase 4 work removed `client/node_modules.win`, so we run the dev server inside WSL
 *   when invoked from Windows to keep a single Linux `node_modules`.
 */
const main = () => {
  if (process.platform === "win32") {
    const wslCwd = winPathToWsl(process.cwd());
    const command = `cd ${escapeForBash(wslCwd)} && node scripts/dev.mjs`;

    run("wsl.exe", ["bash", "-lc", command]);
    return;
  }

  const viteBin = path.resolve(
    clientRoot,
    "node_modules",
    "vite",
    "bin",
    "vite.js",
  );

  const current = parseNodeVersion(process.versions.node);
  const nodeBinary = isAtLeast(current, REQUIRED_NODE)
    ? process.execPath
    : resolveCompatibleNodeBinary();

  if (!nodeBinary) {
    console.error(
      `Node.js ${REQUIRED_NODE.major}.${REQUIRED_NODE.minor}.${REQUIRED_NODE.patch}+ is required for Vite 7. Detected ${process.versions.node}.`,
    );
    console.error(
      "Install Node 20.19+ (e.g., via nvm) or set TASK_MANAGER_NODE to a compatible node binary.",
    );
    process.exit(1);
  }

  run(nodeBinary, [viteBin], { cwd: clientRoot });
};

main();
