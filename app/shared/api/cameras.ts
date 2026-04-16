import type { Camera, CameraPayload } from "~/entities/camera/model/types";

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const now = new Date();

function isoMinutesAgo(minutes: number) {
	return new Date(now.getTime() - minutes * 60_000).toISOString();
}

function isoDaysAgo(days: number) {
	return new Date(now.getTime() - days * 24 * 60 * 60_000).toISOString();
}

let mockCameras: Camera[] = [
	{
		id: "cam_001",
		name: "Северный въезд",
		location: "КПП-1, внешний периметр",
		url: "rtsp://10.10.0.21:554/main",
		isActive: true,
		status: "normal",
		lastSeenAt: isoMinutesAgo(3),
		createdAt: isoDaysAgo(14),
	},
	{
		id: "cam_002",
		name: "Склад ЛВЖ",
		location: "Сектор B-2, зона хранения",
		url: "rtsp://10.10.0.34:554/main",
		isActive: true,
		status: "smoke",
		lastSeenAt: isoMinutesAgo(1),
		createdAt: isoDaysAgo(8),
	},
	{
		id: "cam_003",
		name: "Литейный цех",
		location: "Цех №4, линия плавки",
		url: "http://10.10.0.56:8080/stream",
		isActive: true,
		status: "fire",
		lastSeenAt: isoMinutesAgo(2),
		createdAt: isoDaysAgo(21),
	},
	{
		id: "cam_004",
		name: "Погрузочный док",
		location: "Южная рампа",
		url: "rtsp://10.10.0.18:554/stream1",
		isActive: true,
		status: "normal",
		lastSeenAt: isoMinutesAgo(7),
		createdAt: isoDaysAgo(5),
	},
	{
		id: "cam_005",
		name: "Электрощитовая",
		location: "Корпус А, уровень -1",
		url: "rtsp://10.10.0.77:554/live",
		isActive: true,
		status: "normal",
		lastSeenAt: isoMinutesAgo(11),
		createdAt: isoDaysAgo(31),
	},
];

function nextCameraId() {
	const suffix = String(mockCameras.length + 1).padStart(3, "0");
	return `cam_${suffix}_${Date.now().toString().slice(-4)}`;
}

export async function fetchCamerasMock(): Promise<Camera[]> {
	await wait(450);
	return structuredClone(mockCameras);
}

export async function createCameraMock(payload: CameraPayload): Promise<Camera> {
	await wait(700);

	const camera: Camera = {
		id: nextCameraId(),
		name: payload.name.trim(),
		location: payload.location.trim(),
		url: payload.url.trim(),
		isActive: true,
		status: "normal",
		lastSeenAt: new Date().toISOString(),
		createdAt: new Date().toISOString(),
	};

	mockCameras = [camera, ...mockCameras];
	return structuredClone(camera);
}

export async function updateCameraMock(id: string, payload: CameraPayload): Promise<Camera> {
	await wait(650);

	const current = mockCameras.find((camera) => camera.id === id);
	if (!current) {
		throw new Error("Камера не найдена");
	}

	const updated: Camera = {
		...current,
		name: payload.name.trim(),
		location: payload.location.trim(),
		url: payload.url.trim(),
		lastSeenAt: new Date().toISOString(),
	};

	mockCameras = mockCameras.map((camera) => (camera.id === id ? updated : camera));
	return structuredClone(updated);
}

export async function deleteCameraMock(id: string): Promise<void> {
	await wait(500);
	mockCameras = mockCameras.filter((camera) => camera.id !== id);
}
