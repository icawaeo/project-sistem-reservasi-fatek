const { reporters } = require("mocha");

const { Base } = reporters;

function getDisplayTitle(test) {
  return test.parent?.title || test.title;
}

class CheckReporter extends Base {
  constructor(runner) {
    super(runner);

    const failures = [];

    runner.on("pass", (test) => {
      process.stdout.write(`✔ ${getDisplayTitle(test)}\n`);
    });

    runner.on("fail", (test, error) => {
      failures.push({ test, error });
      process.stdout.write(`✖ ${getDisplayTitle(test)}\n`);
      process.stdout.write(`  ${error.message}\n`);
    });

    runner.once("end", () => {
      const stats = this.stats;
      const duration = stats.duration ? ` (${Math.round(stats.duration / 1000)}s)` : "";

      process.stdout.write("\n");
      if (failures.length === 0) {
        process.stdout.write(`✔ ${stats.passes} passing${duration}\n`);
        return;
      }

      process.stdout.write(`✖ ${stats.failures} failing, ✔ ${stats.passes} passing${duration}\n`);
    });
  }
}

module.exports = CheckReporter;
