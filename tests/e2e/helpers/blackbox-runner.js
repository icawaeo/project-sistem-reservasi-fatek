const assert = require("assert");
const { By, until } = require("selenium-webdriver");
const { BASE_URL, buildDriver } = require("./driver");
const {
  E2E_PREFIX,
  PASSWORD,
  cleanupE2EData,
  createUser,
  createRoom,
  createReservation,
  prisma,
} = require("./db");
const { login, searchRooms, waitForText, ymdDaysFromNow } = require("./ui");

const TEST_DATE = ymdDaysFromNow(14);
const START_TIME = "09:00";
const END_TIME = "11:00";
const PDF_DATA_URL = "data:application/pdf;base64,JVBERi0xLjQKJUVPRgo=";

function dateTime(date, time) {
  return new Date(`${date}T${time}:00`);
}

async function browserFetch(driver, url, options = {}) {
  return driver.executeAsyncScript(
    (requestUrl, requestOptions, done) => {
      fetch(requestUrl, requestOptions)
        .then(async (response) => {
          let body = null;
          try {
            body = await response.json();
          } catch {
            body = await response.text();
          }
          done({ ok: response.ok, status: response.status, body });
        })
        .catch((error) => done({ ok: false, status: 0, body: { error: error.message } }));
    },
    url,
    options
  );
}

async function createDefaultUsers() {
  const primary = await createUser({
    email: "e2e-user-primary@student.unsrat.ac.id",
    name: `${E2E_PREFIX} User Primary`,
    identifier: "202601001",
  });

  const secondary = await createUser({
    email: "e2e-user-secondary@student.unsrat.ac.id",
    name: `${E2E_PREFIX} User Secondary`,
    identifier: "202601002",
  });

  const conflict = await createUser({
    email: "e2e-user-conflict@student.unsrat.ac.id",
    name: `${E2E_PREFIX} User Conflict`,
    identifier: "202601003",
  });

  return { primary, secondary, conflict };
}

function normalizeCaseOptions(optionsOrRunCase, maybeRunCase) {
  if (typeof optionsOrRunCase === "function") {
    return { options: {}, runCase: optionsOrRunCase };
  }

  return { options: optionsOrRunCase ?? {}, runCase: maybeRunCase };
}

function buildSuiteTitle(testId, title, options) {
  const roles = Array.isArray(options.roles) && options.roles.length > 0
    ? ` [role: ${options.roles.join(", ")}]`
    : "";

  return `${testId}${roles} - ${title}`;
}

function defineBlackboxCase(testId, title, optionsOrRunCase, maybeRunCase) {
  const { options, runCase } = normalizeCaseOptions(optionsOrRunCase, maybeRunCase);

  if (typeof runCase !== "function") {
    throw new TypeError(`Run function is required for test case ${testId}`);
  }

  describe(buildSuiteTitle(testId, title, options), function () {
    const context = {};

    before(async function () {
      await cleanupE2EData();
      context.users = await createDefaultUsers();
      context.driver = await buildDriver();
    });

    after(async function () {
      if (context.driver) {
        await context.driver.quit();
      }
      await cleanupE2EData();
    });

    it(title, async function () {
      await runCase({
        ...context,
        assert,
        By,
        until,
        BASE_URL,
        E2E_PREFIX,
        PASSWORD,
        TEST_DATE,
        START_TIME,
        END_TIME,
        PDF_DATA_URL,
        caseMeta: options,
        browserFetch,
        createRoom,
        createReservation,
        dateTime,
        login,
        prisma,
        searchRooms,
        waitForText,
      });
    });
  });
}

module.exports = {
  defineBlackboxCase,
};
