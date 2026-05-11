import type { Camera, CameraPayload, CameraSource } from "~/entities/camera/model/types";
import { apiRequest } from "~/shared/api/http";

interface CameraRecord {
	id?: string | number;
	camera_id?: string | number;
	cameraId?: string | number;
	uuid?: string;
	name?: string;
	rtsp_url?: string;
	webrtc_url?: string;
	description?: string;
	location?: string;
}

export async function fetchCameras(): Promise<Camera[]> {
	const response = await apiRequest<CameraRecord[] | { items?: CameraRecord[]; results?: CameraRecord[] }>("/cameras/");
	const items = Array.isArray(response) ? response : response.items ?? response.results ?? [];
	return items.map(normalizeCamera);
}

export async function fetchCameraById(id: string): Promise<Camera> {
	try {
		const response = await apiRequest<CameraRecord>(`/cameras/${id}/`);
		return normalizeCamera(response);
	} catch {
		try {
			const response = await apiRequest<CameraRecord>(`/cameras/${id}`);
			return normalizeCamera(response);
		} catch {
			const cameras = await fetchCameras();
			const matchedCamera = cameras.find((camera) => String(camera.id) === String(id));

			if (!matchedCamera) {
				throw new Error("Камера не найдена.");
			}

			return matchedCamera;
		}
	}
}

export async function createCamera(payload: CameraPayload): Promise<Camera> {
	const response = await apiRequest<CameraRecord, CameraSource>("/cameras/", {
		method: "POST",
		body: toCameraSource(payload),
	});

	return normalizeCamera(response);
}

export async function updateCamera(id: string, payload: CameraPayload): Promise<Camera> {
	try {
		const response = await apiRequest<CameraRecord, CameraSource>(`/cameras/${id}/`, {
			method: "PATCH",
			body: toCameraSource(payload),
		});

		return normalizeCamera(response);
	} catch {
		const response = await apiRequest<CameraRecord, CameraSource>(`/cameras/${id}`, {
			method: "PATCH",
			body: toCameraSource(payload),
		});

		return normalizeCamera(response);
	}
}

export async function deleteCamera(id: string): Promise<void> {
	await apiRequest(`/cameras/${id}`, {
		method: "DELETE",
	});
}

function normalizeCamera(camera: CameraRecord): Camera {
	const resolvedId = camera.id ?? camera.camera_id ?? camera.cameraId ?? camera.uuid;

	return {
		id: resolvedId ? String(resolvedId) : crypto.randomUUID(),
		name: camera.name ?? "Untitled camera",
		rtsp_url: camera.rtsp_url ?? "",
		webrtc_url: camera.webrtc_url ?? "",
		description: camera.description ?? "",
		location: camera.location ?? "Unknown location",
	};
}

function toCameraSource(payload: CameraPayload): CameraSource {
	return {
		name: payload.name.trim(),
		rtsp_url: payload.rtsp_url.trim(),
		webrtc_url: payload.webrtc_url.trim(),
		description: payload.description.trim(),
		location: payload.location.trim(),
	};
}
