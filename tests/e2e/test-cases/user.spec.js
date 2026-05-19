const { defineBlackboxCase } = require("../helpers/blackbox-runner");

defineBlackboxCase("CEK-01", "pencarian jadwal menampilkan daftar ruangan tersedia", {
  roles: ["USER"],
  feature: "cek-jadwal",
}, async ({
  driver,
  users,
  until,
  PASSWORD,
  TEST_DATE,
  START_TIME,
  END_TIME,
  login,
  searchRooms,
  waitForText,
}) => {
  await login(driver, users.primary.email, PASSWORD);
  await driver.wait(until.urlContains("/landingpage"), 20000);

  await searchRooms(driver, { date: TEST_DATE, startTime: START_TIME, endTime: END_TIME });

  await waitForText(driver, "Tersedia", 20000);
  await waitForText(driver, "Pilih Ruangan", 20000);
});

defineBlackboxCase("CEK-02", "ruangan dengan reservasi PENDING pada jadwal sama tidak tampil", {
  roles: ["USER"],
  feature: "cek-jadwal",
}, async ({
  driver,
  users,
  By,
  until,
  assert,
  E2E_PREFIX,
  PASSWORD,
  TEST_DATE,
  START_TIME,
  END_TIME,
  createRoom,
  createReservation,
  dateTime,
  login,
  searchRooms,
}) => {
  const room = await createRoom({
    name: `${E2E_PREFIX} CEK-02 Room ${Date.now()}`,
  });

  await createReservation({
    userId: users.primary.user_id,
    roomId: room.room_id,
    purpose: `${E2E_PREFIX} CEK-02 Pending`,
    start: dateTime(TEST_DATE, START_TIME),
    end: dateTime(TEST_DATE, END_TIME),
    status: "PENDING",
  });

  await login(driver, users.secondary.email, PASSWORD);
  await driver.wait(until.urlContains("/landingpage"), 20000);
  await searchRooms(driver, { date: TEST_DATE, startTime: START_TIME, endTime: END_TIME });

  const modalText = await driver.findElement(By.css("body")).getText();
  assert.ok(!modalText.includes(room.room_name));
});

defineBlackboxCase("RES-01", "form reservasi lengkap membuat pengajuan PENDING", {
  roles: ["USER"],
  feature: "reservasi",
}, async ({
  driver,
  users,
  By,
  until,
  assert,
  BASE_URL,
  E2E_PREFIX,
  PASSWORD,
  TEST_DATE,
  PDF_DATA_URL,
  createRoom,
  login,
  prisma,
  waitForText,
}) => {
  const room = await createRoom({
    name: `${E2E_PREFIX} RES-01 Room ${Date.now()}`,
  });

  await login(driver, users.secondary.email, PASSWORD);
  await driver.wait(until.urlContains("/landingpage"), 20000);
  await driver.executeScript((draft) => {
    sessionStorage.setItem("reservationDraft", JSON.stringify(draft));
  }, {
    room_id: room.room_id,
    room_name: room.room_name,
    room_building: room.room_building,
    room_capacity: String(room.room_capacity),
    room_locDetail: room.room_locDetail,
    room_imageUrl: "",
    startDate: TEST_DATE,
    endDate: TEST_DATE,
    startTime: "13:00",
    endTime: "15:00",
    name: `${E2E_PREFIX} User Secondary`,
    identifier: "202601002",
    identifierLabel: "NIM",
    email: users.secondary.email,
    phone: "081234567890",
    purpose: `${E2E_PREFIX} RES-01 Kegiatan`,
    reason: "Pengujian automated blackbox Selenium",
    res_flow: "GENERAL",
    documentName: "e2e.pdf",
    documentSize: 20,
    documentType: "application/pdf",
    documentDataUrl: PDF_DATA_URL,
  });

  await driver.get(`${BASE_URL}/reservasi/konfirmasi`);
  await waitForText(driver, "Ringkasan Reservasi", 20000);
  await driver.findElement(By.xpath("//button[contains(., 'KONFIRMASI RESERVASI')]")).click();
  await waitForText(driver, "Apakah Anda yakin ingin melakukan reservasi", 15000);
  await driver.findElement(By.xpath("//button[contains(., 'Ya, Saya Yakin')]")).click();
  await driver.wait(until.urlContains("/riwayat"), 30000);

  const reservation = await prisma.reservation.findFirst({
    where: {
      room_id: room.room_id,
      user_id: users.secondary.user_id,
      res_purpose: { startsWith: `${E2E_PREFIX} RES-01 Kegiatan` },
    },
  });

  assert.equal(reservation?.res_status, "PENDING");
});

defineBlackboxCase("RES-02", "jadwal bentrok menampilkan conflict reservasi", {
  roles: ["USER"],
  feature: "reservasi",
}, async ({
  driver,
  users,
  until,
  assert,
  E2E_PREFIX,
  PASSWORD,
  TEST_DATE,
  createRoom,
  createReservation,
  dateTime,
  login,
  browserFetch,
}) => {
  const room = await createRoom({
    name: `${E2E_PREFIX} RES-02 Room ${Date.now()}`,
  });

  await createReservation({
    userId: users.primary.user_id,
    roomId: room.room_id,
    purpose: `${E2E_PREFIX} RES-02 Existing`,
    start: dateTime(TEST_DATE, "10:00"),
    end: dateTime(TEST_DATE, "12:00"),
    status: "PENDING",
  });

  await login(driver, users.conflict.email, PASSWORD);
  await driver.wait(until.urlContains("/landingpage"), 20000);

  const result = await browserFetch(driver, "/api/reservasi", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      room_id: room.room_id,
      res_startTime: dateTime(TEST_DATE, "10:30").toISOString(),
      res_endTime: dateTime(TEST_DATE, "11:30").toISOString(),
      res_purpose: `${E2E_PREFIX} RES-02 Conflict`,
      res_flow: "GENERAL",
      res_documentUrl: "/uploads/e2e-document.pdf",
    }),
  });

  assert.equal(result.status, 409);
  assert.match(result.body.error, /sudah dipesan|jeda/i);
});

defineBlackboxCase("SCH-01", "jadwal overlap membuat ruangan tidak tersedia", {
  roles: ["USER"],
  feature: "jadwal",
}, async ({
  driver,
  users,
  By,
  until,
  assert,
  E2E_PREFIX,
  PASSWORD,
  TEST_DATE,
  createRoom,
  createReservation,
  dateTime,
  login,
  searchRooms,
}) => {
  const room = await createRoom({
    name: `${E2E_PREFIX} SCH-01 Room ${Date.now()}`,
  });

  await createReservation({
    userId: users.primary.user_id,
    roomId: room.room_id,
    purpose: `${E2E_PREFIX} SCH-01 Pending`,
    start: dateTime(TEST_DATE, "09:00"),
    end: dateTime(TEST_DATE, "11:00"),
    status: "PENDING",
  });

  await login(driver, users.secondary.email, PASSWORD);
  await driver.wait(until.urlContains("/landingpage"), 20000);
  await searchRooms(driver, { date: TEST_DATE, startTime: "10:00", endTime: "12:00" });

  const bodyText = await driver.findElement(By.css("body")).getText();
  assert.ok(!bodyText.includes(room.room_name));
});
