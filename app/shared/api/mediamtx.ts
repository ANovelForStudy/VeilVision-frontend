import { apiRequest } from "~/shared/api/http";

export interface MediaMtxPath {
	name: string;
	source?: string;
	ready?: boolean;
	readers?: number;
	bytesReceived?: number;
	bytesSent?: number;
}

interface MediaMtxPathListResponse {
	items?: Array<{
		name?: string;
		source?: { type?: string; id?: string } | string;
		ready?: boolean;
		readers?: Array<unknown>;
		bytesReceived?: number;
		bytesSent?: number;
	}>;
}

export async function listMediaMtxPaths(): Promise<MediaMtxPath[]> {
	const response = await apiRequest<MediaMtxPathListResponse>("/v3/paths/list", {
		target: "mediamtxControl",
		requiresAuth: false,
	});

	return (response.items ?? []).map((item) => ({
		name: item.name ?? "",
		source: typeof item.source === "string" ? item.source : item.source?.type,
		ready: item.ready ?? false,
		readers: item.readers?.length ?? 0,
		bytesReceived: item.bytesReceived ?? 0,
		bytesSent: item.bytesSent ?? 0,
	}));
}

export function normalizeWebRtcUrl(url: string) {
	return url.trim();
}
