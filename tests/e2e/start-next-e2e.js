const { spawn } = require("child_process");

const port = process.env.E2E_PORT || "3100";
const baseUrl = process.env.E2E_BASE_URL || `http://localhost:${port}`;
const nextBin = require.resolve("next/dist/bin/next");

const child = spawn(process.execPath, [nextBin, "dev", "-p", port], {
  stdio: "inherit",
  env: {
    ...process.env,
    E2E_BASE_URL: baseUrl,
    NEXT_TELEMETRY_DISABLED: "1",
    SMTP_HOST: "",
    SMTP_PORT: "",
    SMTP_USER: "",
    SMTP_PASS: "",
  },
});

const forward = (signal) => {
  if (!child.killed) {
    child.kill(signal);
  }
};

process.on("SIGINT", () => forward("SIGINT"));
process.on("SIGTERM", () => forward("SIGTERM"));

child.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }
  process.exit(code ?? 0);
});
