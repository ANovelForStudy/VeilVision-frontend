export type CameraStatus = "normal" | "fire" | "smoke";
export type CameraStatusFilter = "all" | CameraStatus;

export interface Camera {
	id: string;
	name: string;
	location: string;
	url: string;
	isActive: boolean;
	status: CameraStatus;
	lastSeenAt: string | null;
	createdAt: string;
}

export interface CameraPayload {
	name: string;
	location: string;
	url: string;
}
