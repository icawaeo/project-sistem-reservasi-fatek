const TEST_CASES = [
  { id: "REG-01", roles: ["PUBLIC"], feature: "registrasi", file: "tests/e2e/test-cases/public.spec.js" },
  { id: "REG-02", roles: ["PUBLIC"], feature: "registrasi", file: "tests/e2e/test-cases/public.spec.js" },
  { id: "LOG-01", roles: ["SUPERADMIN"], feature: "login", file: "tests/e2e/test-cases/superadmin.spec.js" },
  { id: "LOG-02", roles: ["SUPERADMIN"], feature: "login", file: "tests/e2e/test-cases/superadmin.spec.js" },
  { id: "CEK-01", roles: ["USER"], feature: "cek-jadwal", file: "tests/e2e/test-cases/user.spec.js" },
  { id: "CEK-02", roles: ["USER"], feature: "cek-jadwal", file: "tests/e2e/test-cases/user.spec.js" },
  { id: "RES-01", roles: ["USER"], feature: "reservasi", file: "tests/e2e/test-cases/user.spec.js" },
  { id: "RES-02", roles: ["USER"], feature: "reservasi", file: "tests/e2e/test-cases/user.spec.js" },
  { id: "APR-01", roles: ["ADMIN"], feature: "approval", file: "tests/e2e/test-cases/admin.spec.js" },
  { id: "APR-02", roles: ["ADMIN_DEKAN"], feature: "approval", file: "tests/e2e/test-cases/admin-dekan.spec.js" },
  { id: "RMG-01", roles: ["SUPERADMIN"], feature: "kelola-ruangan", file: "tests/e2e/test-cases/superadmin.spec.js" },
  { id: "RMG-02", roles: ["SUPERADMIN"], feature: "kelola-ruangan", file: "tests/e2e/test-cases/superadmin.spec.js" },
  { id: "UMG-01", roles: ["SUPERADMIN"], feature: "kelola-user", file: "tests/e2e/test-cases/superadmin.spec.js" },
  { id: "SCH-01", roles: ["USER"], feature: "jadwal", file: "tests/e2e/test-cases/user.spec.js" },
  { id: "PWA-01", roles: ["PUBLIC"], feature: "pwa", file: "tests/e2e/test-cases/public.spec.js" },
  { id: "PWA-02", roles: ["PUBLIC"], feature: "pwa", file: "tests/e2e/test-cases/public.spec.js" },
  { id: "PWA-03", roles: ["PUBLIC"], feature: "pwa", file: "tests/e2e/test-cases/public.spec.js" },
];

const ROLE_GROUPS = {
  ADMINISTRATOR: ["ADMIN", "ADMIN_DEKAN", "ADMIN_WD2", "KAJUR", "KEPALA_LAB", "SUPERADMIN"],
};

function uniqueFiles(testCases) {
  return [...new Set(testCases.map((testCase) => testCase.file))];
}

const TEST_CASE_FILES = uniqueFiles(TEST_CASES);

function normalizeRole(role) {
  return String(role ?? "").trim().replace(/-/g, "_").toUpperCase();
}

function getTestCasesByRole(role) {
  const normalized = normalizeRole(role);
  const allowedRoles = ROLE_GROUPS[normalized] ?? [normalized];

  return TEST_CASES.filter((testCase) => (
    testCase.roles.some((testRole) => allowedRoles.includes(normalizeRole(testRole)))
  ));
}

function getTestCaseFilesByRole(role) {
  return uniqueFiles(getTestCasesByRole(role));
}

module.exports = {
  TEST_CASES,
  TEST_CASE_FILES,
  getTestCasesByRole,
  getTestCaseFilesByRole,
};
