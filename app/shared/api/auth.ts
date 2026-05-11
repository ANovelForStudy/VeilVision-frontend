import type { LoginCredentials, LoginResponse, SessionUser } from "~/entities/session/model/types";
import { apiRequest } from "~/shared/api/http";

interface RawLoginResponse {
	token?: string;
	access_token?: string;
	auth_token?: string;
	user?: Partial<SessionUser> | null;
}

const DEFAULT_LOGIN_ENDPOINT = "/auth/login";

export const demoCredentials = {
	email: "operator@yolo-firewatch.ai",
	password: "YOLO-Fire-2026!",
};

export async function loginWithEmail(credentials: LoginCredentials): Promise<LoginResponse> {
	const response = await apiRequest<RawLoginResponse>(DEFAULT_LOGIN_ENDPOINT, {
		method: "POST",
		body: {
			email: credentials.email.trim(),
			password: credentials.password,
			remember: credentials.remember,
		},
		requiresAuth: false,
	});

	const token = response.token ?? response.access_token ?? response.auth_token;

	if (!token) {
		throw new Error("Backend auth response does not contain an access token.");
	}

	return {
		token,
		user: normalizeSessionUser(response.user, credentials.email),
	};
}

function normalizeSessionUser(user: RawLoginResponse["user"], fallbackEmail: string): SessionUser {
	return {
		id: user?.id ?? "unknown-user",
		name: user?.name ?? user?.email ?? fallbackEmail,
		email: user?.email ?? fallbackEmail,
		role: user?.role ?? "Operator",
		workspace: user?.workspace ?? "Default workspace",
	};
}
