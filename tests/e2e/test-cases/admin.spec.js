const { defineBlackboxCase } = require("../helpers/blackbox-runner");

defineBlackboxCase("APR-01", "admin menyetujui PENDING menjadi tahap approval berikutnya", {
  roles: ["ADMIN"],
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
    name: `${E2E_PREFIX} APR-01 Room ${Date.now()}`,
  });
  const reservation = await createReservation({
    userId: users.primary.user_id,
    roomId: room.room_id,
    purpose: `${E2E_PREFIX} APR-01 Approval`,
    start: dateTime(TEST_DATE, "13:00"),
    end: dateTime(TEST_DATE, "15:00"),
    status: "PENDING",
  });

  await login(driver, "admin@unsrat.ac.id", PASSWORD);
  await driver.wait(until.urlContains("/administrator/admin"), 20000);

  const result = await browserFetch(driver, `/api/admin/reservations/${reservation.res_id}/decision`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "APPROVE" }),
  });

  assert.equal(result.status, 200);
  assert.equal(result.body.status, "PENDING_DEKAN");
});
