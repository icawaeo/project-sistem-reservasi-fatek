const { By, until } = require("selenium-webdriver");
const { BASE_URL } = require("./driver");
const { PASSWORD } = require("./db");

async function login(driver, email, password = PASSWORD) {
  await driver.get(BASE_URL);
  await driver.findElement(By.css('input[type="email"]')).sendKeys(email);
  await driver.findElement(By.css('input[type="password"]')).sendKeys(password);
  await driver.findElement(By.css('button[type="submit"]')).click();
}

async function waitForText(driver, text, timeout = 15000) {
  return driver.wait(until.elementLocated(By.xpath(`//*[contains(., ${JSON.stringify(text)})]`)), timeout);
}

async function setInputValue(driver, selector, value) {
  await driver.executeScript(
    (cssSelector, nextValue) => {
      const element = document.querySelector(cssSelector);
      if (!element) {
        throw new Error(`Element not found: ${cssSelector}`);
      }
      const setter = Object.getOwnPropertyDescriptor(element.constructor.prototype, "value")?.set;
      setter.call(element, nextValue);
      element.dispatchEvent(new Event("input", { bubbles: true }));
      element.dispatchEvent(new Event("change", { bubbles: true }));
    },
    selector,
    value
  );
}

function ymdDaysFromNow(daysAhead) {
  const date = new Date();
  date.setDate(date.getDate() + daysAhead);
  return date.toISOString().slice(0, 10);
}

async function searchRooms(driver, { date = ymdDaysFromNow(7), startTime = "09:00", endTime = "11:00" } = {}) {
  await driver.get(`${BASE_URL}/landingpage`);
  await setInputValue(driver, 'input[type="date"]', date);
  const timeInputs = await driver.findElements(By.css('input[type="time"]'));
  await driver.executeScript(
    (inputs, start, end) => {
      const setNativeValue = (element, value) => {
        const setter = Object.getOwnPropertyDescriptor(element.constructor.prototype, "value")?.set;
        setter.call(element, value);
      };
      setNativeValue(inputs[0], start);
      inputs[0].dispatchEvent(new Event("input", { bubbles: true }));
      inputs[0].dispatchEvent(new Event("change", { bubbles: true }));
      setNativeValue(inputs[1], end);
      inputs[1].dispatchEvent(new Event("input", { bubbles: true }));
      inputs[1].dispatchEvent(new Event("change", { bubbles: true }));
    },
    timeInputs,
    startTime,
    endTime
  );
  await driver.findElement(By.xpath("//button[contains(., 'Cari Ruangan')]")).click();
  await waitForText(driver, "Daftar Ketersediaan Ruangan", 20000);
}

module.exports = {
  login,
  waitForText,
  setInputValue,
  ymdDaysFromNow,
  searchRooms,
};
