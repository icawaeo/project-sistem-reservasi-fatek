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

defineBlackboxCase("PWA-01", "aplikasi memiliki manifest dan service worker untuk opsi instalasi", {
  roles: ["PUBLIC"],
  feature: "pwa",
}, async ({
  driver,
  assert,
  BASE_URL,
}) => {
  await driver.get(`${BASE_URL}/landingpage`);

  const pwaState = await driver.executeAsyncScript((done) => {
    Promise.all([
      fetch("/manifest.json").then((response) => response.json()),
      navigator.serviceWorker?.getRegistration("/") ?? Promise.resolve(null),
    ]).then(([manifest, registration]) => {
      done({
        display: manifest.display,
        startUrl: manifest.start_url,
        hasIcons: Array.isArray(manifest.icons) && manifest.icons.length > 0,
        hasServiceWorker: Boolean(registration),
      });
    });
  });

  assert.equal(pwaState.display, "standalone");
  assert.equal(pwaState.startUrl, "/landingpage");
  assert.equal(pwaState.hasIcons, true);
  assert.equal(pwaState.hasServiceWorker, true);
});

defineBlackboxCase("PWA-02", "offline fallback tersedia saat halaman tidak bisa diakses online", {
  roles: ["PUBLIC"],
  feature: "pwa",
}, async ({
  driver,
  assert,
  BASE_URL,
}) => {
  await driver.get(`${BASE_URL}/landingpage`);

  const offlineState = await driver.executeAsyncScript((done) => {
    navigator.serviceWorker.ready
      .then(() => caches.match("/offline.html"))
      .then(async (response) => {
        const text = response ? await response.text() : "";
        done({
          cached: Boolean(response),
          containsFallbackText: text.includes("Tidak Ada Koneksi"),
        });
      })
      .catch((error) => done({ cached: false, containsFallbackText: false, error: error.message }));
  });

  assert.equal(offlineState.cached, true);
  assert.equal(offlineState.containsFallbackText, true);
});

defineBlackboxCase("PWA-03", "indikator offline berubah menjadi koneksi dipulihkan", {
  roles: ["PUBLIC"],
  feature: "pwa",
}, async ({
  driver,
  BASE_URL,
  waitForText,
}) => {
  await driver.get(`${BASE_URL}/landingpage`);

  await driver.executeScript(() => window.dispatchEvent(new Event("offline")));
  await waitForText(driver, "Anda sedang offline", 10000);

  await driver.executeScript(() => window.dispatchEvent(new Event("online")));
  await waitForText(driver, "Koneksi dipulihkan", 10000);
});
