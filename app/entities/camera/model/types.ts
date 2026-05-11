export interface Camera {
	id: string;
	name: string;
	rtsp_url: string;
	webrtc_url: string;
	description: string;
	location: string;
}

export interface CameraPayload {
	name: string;
	rtsp_url: string;
	webrtc_url: string;
	description: string;
	location: string;
}

export interface CameraSource {
	name: string;
	rtsp_url: string;
	webrtc_url: string;
	description: string;
	location: string;
}
