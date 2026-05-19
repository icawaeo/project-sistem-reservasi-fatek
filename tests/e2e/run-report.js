const http = require("http");
const { spawn } = require("child_process");
const { TEST_CASE_FILES, getTestCaseFilesByRole } = require("./helpers/test-case-files");

const port = process.env.E2E_PORT || "3100";
const baseUrl = process.env.E2E_BASE_URL || `http://localhost:${port}`;
const args = process.argv.slice(2);
const roleIndex = args.findIndex((arg) => arg === "--role" || arg === "-r");
const selectedRole = roleIndex >= 0 ? args[roleIndex + 1] : process.env.E2E_ROLE;

const e2eEnv = {
  ...process.env,
  E2E_BASE_URL: baseUrl,
  NEXT_TELEMETRY_DISABLED: "1",
  SMTP_HOST: "",
  SMTP_PORT: "",
  SMTP_USER: "",
  SMTP_PASS: "",
};

function waitForServer(url, timeoutMs = 15000) {
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
        reject(new Error(`E2E server is not ready at ${url}. Jalankan dulu: npm run test:e2e:server`));
        return;
      }
      setTimeout(check, 1000);
    };

    check();
  });
}

async function main() {
  const mochaBin = require.resolve("mocha/bin/mocha.js");

  try {
    await waitForServer(baseUrl);

    const selectedFiles = selectedRole ? getTestCaseFilesByRole(selectedRole) : TEST_CASE_FILES;

    if (selectedFiles.length === 0) {
      throw new Error(`No E2E test cases found for role: ${selectedRole}`);
    }

    const reportFilename = selectedRole ? `index-${selectedRole.toLowerCase()}` : "index";
    const mochaArgs = [
      ...selectedFiles,
      "--timeout",
      "90000",
      "--reporter",
      "mochawesome",
      "--reporter-options",
      `reportDir=tests/e2e/reports,reportFilename=${reportFilename},html=true,json=true,overwrite=true,charts=true`,
    ];

    const mocha = spawn(process.execPath, [mochaBin, ...mochaArgs], {
      stdio: "inherit",
      env: e2eEnv,
    });

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
