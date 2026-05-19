const http = require("http");
const { spawn } = require("child_process");
const { TEST_CASE_FILES, getTestCaseFilesByRole } = require("./helpers/test-case-files");

const port = process.env.E2E_PORT || "3100";
const baseUrl = process.env.E2E_BASE_URL || `http://localhost:${port}`;
const args = process.argv.slice(2);
const roleIndex = args.findIndex((arg) => arg === "--role" || arg === "-r");
const selectedRole = roleIndex >= 0 ? args[roleIndex + 1] : null;
const runAll = args.length === 0 || args.includes("--all");
const explicitFiles = args.filter((arg, index) => (
  arg !== "--all" &&
  index !== roleIndex &&
  index !== roleIndex + 1
));
const files = selectedRole ? getTestCaseFilesByRole(selectedRole) : runAll ? TEST_CASE_FILES : explicitFiles;

if (files.length === 0) {
  console.error("Usage: npm run test:e2e --");
  console.error("   or: npm run test:e2e:case -- tests/e2e/test-cases/admin.spec.js");
  console.error("   or: npm run test:e2e:role -- ADMIN");
  process.exit(1);
}

const e2eEnv = {
  ...process.env,
  E2E_BASE_URL: baseUrl,
  NEXT_TELEMETRY_DISABLED: "1",
  SMTP_HOST: "",
  SMTP_PORT: "",
  SMTP_USER: "",
  SMTP_PASS: "",
};

function waitForServer(url, timeoutMs = 90000) {
  const startedAt = Date.now();

  return new Promise((resolve, reject) => {
    const check = () => {
      const request = http.get(url, (response) => {
        response.resume();
        if (response.statusCode && response.statusCode < 500) {
          resolve();
          return;
        }
        retry();
      });

      request.on("error", retry);
      request.setTimeout(2000, () => {
        request.destroy();
        retry();
      });
    };

    const retry = () => {
      if (Date.now() - startedAt > timeoutMs) {
        reject(new Error(`Dev server did not become ready at ${url}`));
        return;
      }
      setTimeout(check, 1000);
    };

    check();
  });
}

function shouldSuppressBrowserLog(line) {
  return (
    line.includes("DevTools listening on") ||
    line.includes("ERROR:gpu\\") ||
    line.includes("ERROR:ui\\gl\\") ||
    line.includes("ERROR:google_apis\\") ||
    line.includes("ContextResult::kFatalFailure")
  );
}

function pipeFilteredLines(stream, output) {
  let buffer = "";

  stream.on("data", (chunk) => {
    buffer += chunk.toString();
    const lines = buffer.split(/\r?\n/);
    buffer = lines.pop() ?? "";

    for (const line of lines) {
      if (line.trim() && !shouldSuppressBrowserLog(line)) {
        output.write(`${line}\n`);
      }
    }
  });

  stream.on("end", () => {
    if (buffer.trim() && !shouldSuppressBrowserLog(buffer)) {
      output.write(`${buffer}\n`);
    }
  });
}

async function main() {
  const mochaBin = require.resolve("mocha/bin/mocha.js");
  const checkReporter = require.resolve("./helpers/check-reporter");

  try {
    await waitForServer(baseUrl);

    const mocha = spawn(process.execPath, [
      mochaBin,
      ...files,
      "--timeout",
      "90000",
      "--reporter",
      checkReporter,
    ], {
      stdio: ["inherit", "pipe", "pipe"],
      env: e2eEnv,
    });

    pipeFilteredLines(mocha.stdout, process.stdout);
    pipeFilteredLines(mocha.stderr, process.stderr);

    const code = await new Promise((resolve) => {
      mocha.on("exit", (exitCode) => resolve(exitCode ?? 0));
    });

    process.exit(code);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}

main();
