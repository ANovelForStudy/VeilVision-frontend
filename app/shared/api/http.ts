import type { FetchOptions } from "ofetch";
import { useSessionStore } from "~/entities/session/model/session.store";

type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
type ApiTarget = "backend" | "mediamtxControl";

export interface ApiRequestOptions<TBody = unknown> extends Omit<FetchOptions<"json">, "baseURL" | "body" | "method"> {
	body?: TBody;
	method?: HttpMethod;
	requiresAuth?: boolean;
	target?: ApiTarget;
}

export class ApiError extends Error {
	statusCode: number;
	statusMessage: string;
	data?: unknown;

	constructor(message: string, statusCode = 500, statusMessage = "API Error", data?: unknown) {
		super(message);
		this.name = "ApiError";
		this.statusCode = statusCode;
		this.statusMessage = statusMessage;
		this.data = data;
	}
}

export async function apiRequest<TResponse, TBody = unknown>(
	path: string,
	options: ApiRequestOptions<TBody> = {},
): Promise<TResponse> {
	const config = useRuntimeConfig();
	const sessionStore = useSessionStore();
	const target = options.target ?? "backend";
	const baseURL =
		target === "mediamtxControl"
			? config.public.mediaMtxControlApiUrl
			: joinUrl(config.public.backendBaseUrl, config.public.backendApiPrefix);

	try {
		return await $fetch<TResponse>(path, {
			baseURL,
			method: options.method ?? "GET",
			body: options.body,
			timeout: options.timeout ?? 10_000,
			query: options.query,
			headers: {
				Accept: "application/json",
				...buildAuthHeaders(options.requiresAuth ?? true, sessionStore.token),
				...options.headers,
			},
		});
	} catch (error) {
		const normalizedError = normalizeApiError(error);

		if (normalizedError.statusCode === 401 && (options.requiresAuth ?? true)) {
			sessionStore.signOut();
		}

		throw normalizedError;
	}
}

function buildAuthHeaders(requiresAuth: boolean, token: string | null) {
	if (!requiresAuth || !token) {
		return {};
	}

	return {
		Authorization: `Bearer ${token}`,
	};
}

function normalizeApiError(error: unknown): ApiError {
	const fallbackMessage = "Request failed. Please try again.";

	if (!error || typeof error !== "object") {
		return new ApiError(fallbackMessage);
	}

	const maybeError = error as {
		data?: Record<string, unknown>;
		message?: string;
		response?: { status?: number; statusText?: string; _data?: unknown };
		status?: number;
		statusCode?: number;
		statusMessage?: string;
	};

	const statusCode = maybeError.statusCode ?? maybeError.status ?? maybeError.response?.status ?? 500;
	const statusMessage = maybeError.statusMessage ?? maybeError.response?.statusText ?? "API Error";
	const data = maybeError.data ?? maybeError.response?._data;
	const message =
		extractErrorMessage(data) ??
		maybeError.message ??
		(statusCode >= 500 ? "Server error. Please try again later." : fallbackMessage);

	return new ApiError(message, statusCode, statusMessage, data);
}

function extractErrorMessage(data: unknown) {
	if (!data || typeof data !== "object") {
		return null;
	}

	const record = data as Record<string, unknown>;

	if (typeof record.detail === "string") {
		return record.detail;
	}

	if (typeof record.message === "string") {
		return record.message;
	}

	if (Array.isArray(record.detail)) {
		return record.detail
			.map((entry) => {
				if (typeof entry === "string") {
					return entry;
				}

				if (entry && typeof entry === "object" && "msg" in entry && typeof entry.msg === "string") {
					return entry.msg;
				}

				return null;
			})
			.filter(Boolean)
			.join("; ");
	}

	return null;
}

function joinUrl(baseUrl: string, prefix: string) {
	const normalizedBase = baseUrl.replace(/\/+$/, "");
	const normalizedPrefix = prefix ? `/${prefix.replace(/^\/+|\/+$/g, "")}` : "";
	return `${normalizedBase}${normalizedPrefix}`;
}
