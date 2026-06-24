const { defineBlackboxCase } = require("../helpers/blackbox-runner");

defineBlackboxCase("APR-02", "admin menolak pengajuan dan slot tersedia kembali", {
  roles: ["ADMIN_DEKAN"],
  feature: "approval",
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
  waitForText,
  browserFetch,
}) => {
  const room = await createRoom({
    name: `${E2E_PREFIX} APR-02 Room ${Date.now()}`,
  });
  const reservation = await createReservation({
    userId: users.primary.user_id,
    roomId: room.room_id,
    purpose: `${E2E_PREFIX} APR-02 Reject`,
    start: dateTime(TEST_DATE, "13:00"),
    end: dateTime(TEST_DATE, "15:00"),
    status: "PENDING_DEKAN",
  });

  await login(driver, "dekan@unsrat.ac.id", PASSWORD);
  await driver.wait(until.urlContains("/administrator/admin"), 20000);

  const rejectResult = await browserFetch(driver, `/api/admin/reservations/${reservation.res_id}/decision`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "REJECT" }),
  });

  assert.equal(rejectResult.status, 200);
  assert.equal(rejectResult.body.status, "REJECTED_DEKAN");

  const availability = await browserFetch(
    driver,
    `/api/rooms?startDate=${TEST_DATE}&endDate=${TEST_DATE}&startTime=13:00&endTime=15:00`
  );
  assert.equal(availability.status, 200);
  assert.ok(availability.body.some((item) => item.room_id === room.room_id));
});

defineBlackboxCase("APR-04", "dekan meneruskan lab lainnya ke kepala lab", {
  roles: ["ADMIN_DEKAN"],
  feature: "approval",
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
    name: `${E2E_PREFIX} APR-04 Room ${Date.now()}`,
  });
  const reservation = await createReservation({
    userId: users.primary.user_id,
    roomId: room.room_id,
    purpose: `${E2E_PREFIX} APR-04 Lab Lainnya`,
    start: dateTime(TEST_DATE, "13:00"),
    end: dateTime(TEST_DATE, "15:00"),
    status: "PENDING_DEKAN",
    flow: "LAB_LAINNYA",
  });

  await login(driver, "dekan@unsrat.ac.id", PASSWORD);
  await driver.wait(until.urlContains("/administrator/admin"), 20000);
  await waitForText(driver, `${E2E_PREFIX} APR-04 Lab Lainnya`, 20000);

  const result = await browserFetch(driver, `/api/admin/reservations/${reservation.res_id}/decision`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "APPROVE" }),
  });

  assert.equal(result.status, 200);
  assert.equal(result.body.status, "PENDING_KEPALA_LAB");
});
