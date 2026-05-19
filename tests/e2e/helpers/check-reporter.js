const path = require("path");
const { reporters } = require("mocha");

const { Base } = reporters;

const colors = {
  green: "\x1b[32m",
  red: "\x1b[31m",
  cyan: "\x1b[36m",
  gray: "\x1b[90m",
  bold: "\x1b[1m",
  reset: "\x1b[0m",
};

const cwd = process.cwd();
const startedAt = Date.now();

function color(value, colorName) {
  return `${colors[colorName]}${value}${colors.reset}`;
}

function formatDuration(ms) {
  if (typeof ms !== "number") {
    return "";
  }

  return color(` (${ms} ms)`, "gray");
}

function formatSeconds(ms) {
  return (ms / 1000).toFixed(3).replace(/\.?0+$/, "");
}

function getDisplayTitle(test) {
  return test.title || test.parent?.title || "Unnamed test";
}

function getRelativeFile(test) {
  const file = test.file || test.parent?.file || "unknown";
  return path.relative(cwd, file).replace(/\\/g, "/");
}

function getFailureMessage(error) {
  return error?.message ? String(error.message).split(/\r?\n/)[0] : "Test failed";
}

class CheckReporter extends Base {
  constructor(runner) {
    super(runner);

    const fileResults = new Map();
    const failures = [];

    const ensureFileResult = (file) => {
      if (!fileResults.has(file)) {
        fileResults.set(file, {
          file,
          tests: [],
          passed: 0,
          failed: 0,
          startedAt: Date.now(),
          duration: 0,
        });
      }

      return fileResults.get(file);
    };

    runner.on("pass", (test) => {
      const fileResult = ensureFileResult(getRelativeFile(test));

      fileResult.passed += 1;
      fileResult.duration = Date.now() - fileResult.startedAt;
      fileResult.tests.push({
        status: "passed",
        title: getDisplayTitle(test),
        duration: test.duration,
      });
    });

    runner.on("fail", (test, error) => {
      const fileResult = ensureFileResult(getRelativeFile(test));

      failures.push({ test, error });
      fileResult.failed += 1;
      fileResult.duration = Date.now() - fileResult.startedAt;
      fileResult.tests.push({
        status: "failed",
        title: getDisplayTitle(test),
        duration: test.duration,
        error,
      });
    });

    runner.once("end", () => {
      const totalDuration = Date.now() - startedAt;
      const suites = [...fileResults.values()];
      const passedSuites = suites.filter((suite) => suite.failed === 0).length;
      const failedSuites = suites.filter((suite) => suite.failed > 0).length;
      const totalSuites = suites.length;
      const passedTests = this.stats.passes;
      const failedTests = this.stats.failures;
      const totalTests = passedTests + failedTests;

      process.stdout.write("\n");

      for (const suite of suites) {
        const statusLabel = suite.failed > 0
          ? color("FAIL", "red")
          : color("PASS", "green");
        const duration = suite.duration ? color(` (${formatSeconds(suite.duration)} s)`, "red") : "";

        process.stdout.write(`${colors.bold}${statusLabel}${colors.reset} ${color(suite.file, "gray")}${duration}\n`);

        for (const test of suite.tests) {
          const mark = test.status === "passed" ? color("√", "green") : color("×", "red");
          process.stdout.write(`  ${mark} ${color(test.title, "gray")}${formatDuration(test.duration)}\n`);

          if (test.status === "failed") {
            process.stdout.write(`    ${color(getFailureMessage(test.error), "red")}\n`);
          }
        }
      }

      process.stdout.write("\n");
      process.stdout.write(`${colors.bold}Test Suites:${colors.reset} `);
      if (failedSuites > 0) {
        process.stdout.write(`${color(`${failedSuites} failed`, "red")}, `);
      }
      process.stdout.write(`${color(`${passedSuites} passed`, "green")}, ${totalSuites} total\n`);

      process.stdout.write(`${colors.bold}Tests:${colors.reset}       `);
      if (failedTests > 0) {
        process.stdout.write(`${color(`${failedTests} failed`, "red")}, `);
      }
      process.stdout.write(`${color(`${passedTests} passed`, "green")}, ${totalTests} total\n`);

      process.stdout.write(`${colors.bold}Snapshots:${colors.reset}   0 total\n`);
      process.stdout.write(`${colors.bold}Time:${colors.reset}        ${color(`${formatSeconds(totalDuration)} s`, "cyan")}\n`);

      if (process.env.E2E_ROLE) {
        process.stdout.write(`${color(`Ran all test suites matching role ${process.env.E2E_ROLE}.`, "gray")}\n`);
      } else {
        process.stdout.write(`${color("Ran all test suites.", "gray")}\n`);
      }
    });
  }
}

module.exports = CheckReporter;
