import { createHash, randomBytes } from "crypto";

const TOKEN_BYTES = 32;

export const EMAIL_CHANGE_TOKEN_TTL_MS = 1000 * 60 * 60 * 24;

export const hashEmailChangeToken = (token: string) => {
	return createHash("sha256").update(token).digest("hex");
};

export const generateEmailChangeToken = () => {
	const token = randomBytes(TOKEN_BYTES).toString("hex");

	return {
		token,
		tokenHash: hashEmailChangeToken(token),
		expiresAt: new Date(Date.now() + EMAIL_CHANGE_TOKEN_TTL_MS),
	};
};
