const { defineBlackboxCase } = require("../helpers/blackbox-runner");

defineBlackboxCase("REG-01", "registrasi data valid mengarahkan ke verifikasi OTP", {
  roles: ["PUBLIC"],
  feature: "registrasi",
}, async ({
  driver,
  By,
  until,
  BASE_URL,
  E2E_PREFIX,
  PASSWORD,
  waitForText,
}) => {
  await driver.get(`${BASE_URL}/auth?tab=register`);

  const uniqueEmail = `e2e-reg-${Date.now()}@student.unsrat.ac.id`;
  await driver.wait(until.elementLocated(By.name("name")), 15000);
  await driver.findElement(By.name("name")).sendKeys(`${E2E_PREFIX} Registrasi Valid`);
  await driver.findElement(By.name("identifier")).sendKeys("202601099");
  await driver.findElement(By.name("email")).sendKeys(uniqueEmail);
  await driver.findElement(By.name("password")).sendKeys(PASSWORD);
  await driver.findElement(By.name("confirmPassword")).sendKeys(PASSWORD);
  await driver.findElement(By.css('button[type="submit"]')).click();

  await waitForText(driver, "Verifikasi Email", 20000);
  await waitForText(driver, "Kode verifikasi 6 digit", 20000);
});

defineBlackboxCase("REG-02", "registrasi email luar UNSRAT ditolak", {
  roles: ["PUBLIC"],
  feature: "registrasi",
}, async ({
  driver,
  By,
  until,
  BASE_URL,
  E2E_PREFIX,
  PASSWORD,
  waitForText,
}) => {
  await driver.get(`${BASE_URL}/auth?tab=register`);

  await driver.wait(until.elementLocated(By.name("name")), 15000);
  await driver.findElement(By.name("name")).sendKeys(`${E2E_PREFIX} Registrasi Invalid`);
  await driver.findElement(By.name("identifier")).sendKeys("202601098");
  await driver.findElement(By.name("email")).sendKeys(`e2e-reg-${Date.now()}@gmail.com`);
  await driver.findElement(By.name("password")).sendKeys(PASSWORD);
  await driver.findElement(By.name("confirmPassword")).sendKeys(PASSWORD);
  await driver.findElement(By.css('button[type="submit"]')).click();

  await waitForText(driver, "Hanya email UNSRAT", 20000);
});
