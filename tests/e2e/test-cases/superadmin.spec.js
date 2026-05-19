const { defineBlackboxCase } = require("../helpers/blackbox-runner");

defineBlackboxCase("LOG-01", "login valid menampilkan dashboard sesuai role", {
  roles: ["SUPERADMIN"],
  feature: "login",
}, async ({
  driver,
  until,
  assert,
  PASSWORD,
  login,
}) => {
  await login(driver, "superadmin@unsrat.ac.id", PASSWORD);
  await driver.wait(until.urlContains("/administrator/superadmin/dashboard"), 20000);

  const currentUrl = await driver.getCurrentUrl();
  assert.ok(currentUrl.includes("/administrator/superadmin/dashboard"));
});

defineBlackboxCase("LOG-02", "password salah menampilkan pesan error login gagal", {
  roles: ["SUPERADMIN"],
  feature: "login",
}, async ({
  driver,
  assert,
  login,
  waitForText,
}) => {
  await login(driver, "superadmin@unsrat.ac.id", "password-salah");
  const errorMessage = await waitForText(driver, "Email atau password salah", 20000);

  assert.ok(await errorMessage.isDisplayed());
});

defineBlackboxCase("RMG-01", "superadmin menambahkan data ruangan valid", {
  roles: ["SUPERADMIN"],
  feature: "kelola-ruangan",
}, async ({
  driver,
  By,
  until,
  BASE_URL,
  E2E_PREFIX,
  PASSWORD,
  login,
  waitForText,
}) => {
  const roomName = `${E2E_PREFIX} RMG-01 Room ${Date.now()}`;

  await login(driver, "superadmin@unsrat.ac.id", PASSWORD);
  await driver.wait(until.urlContains("/administrator/superadmin/dashboard"), 20000);
  await driver.get(`${BASE_URL}/administrator/superadmin/kelola-ruangan`);
  await waitForText(driver, "Daftar Ruangan", 20000);

  await driver.findElement(By.xpath("//button[contains(., 'Tambah Ruangan')]")).click();
  await waitForText(driver, "Isi informasi ruangan dengan lengkap", 15000);

  await driver.executeScript((name) => {
    const setNativeValue = (element, value) => {
      const setter = Object.getOwnPropertyDescriptor(element.constructor.prototype, "value")?.set;
      setter.call(element, value);
    };
    const form = document.querySelector(".fixed form");
    const inputs = form.querySelectorAll("input");
    const selects = form.querySelectorAll("select");

    setNativeValue(inputs[0], name);
    inputs[0].dispatchEvent(new Event("input", { bubbles: true }));
    setNativeValue(inputs[1], "25");
    inputs[1].dispatchEvent(new Event("input", { bubbles: true }));
    selects[0].value = "Gedung Dekanat Fakultas Teknik";
    selects[0].dispatchEvent(new Event("change", { bubbles: true }));
    setNativeValue(inputs[2], "1");
    inputs[2].dispatchEvent(new Event("input", { bubbles: true }));
    setNativeValue(inputs[3], "Proyektor");
    inputs[3].dispatchEvent(new Event("input", { bubbles: true }));
  }, roomName);

  await driver.findElement(By.xpath("//button[contains(., 'Simpan Ruangan')]")).click();
  await waitForText(driver, "Ruangan berhasil ditambahkan", 20000);
  await waitForText(driver, roomName, 20000);
});

defineBlackboxCase("RMG-02", "ruangan dengan riwayat reservasi tidak dapat dihapus", {
  roles: ["SUPERADMIN"],
  feature: "kelola-ruangan",
}, async ({
  driver,
  users,
  By,
  until,
  E2E_PREFIX,
  PASSWORD,
  BASE_URL,
  TEST_DATE,
  createRoom,
  createReservation,
  dateTime,
  login,
  waitForText,
}) => {
  const room = await createRoom({
    name: `${E2E_PREFIX} RMG-02 Room ${Date.now()}`,
  });
  await createReservation({
    userId: users.primary.user_id,
    roomId: room.room_id,
    purpose: `${E2E_PREFIX} RMG-02 History`,
    start: dateTime(TEST_DATE, "13:00"),
    end: dateTime(TEST_DATE, "15:00"),
    status: "PENDING",
  });

  await login(driver, "superadmin@unsrat.ac.id", PASSWORD);
  await driver.wait(until.urlContains("/administrator/superadmin/dashboard"), 20000);
  await driver.get(`${BASE_URL}/administrator/superadmin/kelola-ruangan`);
  await waitForText(driver, "Daftar Ruangan", 20000);
  await driver.findElement(By.css('input[placeholder="Cari nama ruangan, gedung, atau fasilitas"]')).sendKeys(room.room_name);
  await waitForText(driver, room.room_name, 20000);
  await driver.findElement(By.css(`button[aria-label="Hapus ${room.room_name}"]`)).click();
  await waitForText(driver, "Hapus Ruangan", 15000);
  await driver.findElement(By.xpath("//button[normalize-space()='Hapus']")).click();
  await waitForText(driver, "tidak dapat dihapus karena sudah memiliki riwayat reservasi", 20000);
});
