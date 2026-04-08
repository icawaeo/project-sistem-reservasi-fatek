import { createHash, randomBytes } from "crypto";

const TOKEN_BYTES = 32;

export const PASSWORD_SETUP_TOKEN_TTL_MS = 1000 * 60 * 60 * 24;

export const hashPasswordSetupToken = (token: string) => {
  return createHash("sha256").update(token).digest("hex");
};

export const generatePasswordSetupToken = () => {
  const token = randomBytes(TOKEN_BYTES).toString("hex");

  return {
    token,
    tokenHash: hashPasswordSetupToken(token),
    expiresAt: new Date(Date.now() + PASSWORD_SETUP_TOKEN_TTL_MS),
  };
};
