import { vi } from "vitest";

process.env.NODE_ENV = "test";
process.env.PORT = process.env.PORT || "5173";
process.env.JWT_SECRET = process.env.JWT_SECRET || "test-jwt-secret";
process.env.JWT_EXPIRATION = process.env.JWT_EXPIRATION || "7d";
process.env.GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || "test-google-client";
process.env.ALLOWED_DOMAIN = process.env.ALLOWED_DOMAIN || "example.com";
process.env.SITE_URL = process.env.SITE_URL || "http://localhost:3000";
process.env.RESEND_API_KEY = process.env.RESEND_API_KEY || "test-resend-key";
process.env.EMAIL_TO = process.env.EMAIL_TO || "to@example.com";
process.env.EMAIL_FROM = process.env.EMAIL_FROM || "from@example.com";
process.env.HASH_SECRET = process.env.HASH_SECRET || "test-hash-secret";
process.env.CSRF_SECRET = process.env.CSRF_SECRET || "test-csrf-secret";
process.env.DRIVE_FOLDER_ID = process.env.DRIVE_FOLDER_ID || "test-folder";
process.env.ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY || "test-anthropic-key";
process.env.ANTHROPIC_MODEL = process.env.ANTHROPIC_MODEL || "claude-haiku-4-5-20251001";
process.env.ANTHROPIC_MAX_TOKENS = process.env.ANTHROPIC_MAX_TOKENS || "512";

vi.mock("@anthropic-ai/sdk", () => {
	const create = vi.fn().mockResolvedValue({
		content: [{ type: "text", text: "respuesta de prueba" }],
	});

	const Anthropic = vi.fn().mockImplementation(() => ({
		messages: {
			create,
		},
	}));

	return {
		default: Anthropic,
	};
});

vi.mock("resend", () => {
	const send = vi.fn().mockResolvedValue({ id: "email-test-id" });

	return {
		Resend: vi.fn().mockImplementation(() => ({
			emails: { send },
		})),
	};
});

vi.mock("google-auth-library", () => {
	return {
		OAuth2Client: vi.fn().mockImplementation(() => ({
			verifyIdToken: vi.fn().mockResolvedValue({
				getPayload: () => ({
					sub: "user-1",
					email: "test@example.com",
					name: "Test User",
					picture: "https://example.com/avatar.png",
				}),
			}),
		})),
	};
});
