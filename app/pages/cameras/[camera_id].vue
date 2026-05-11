<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import type { Camera } from "~/entities/camera/model/types";
import { deleteCamera as deleteCameraRequest, fetchCameraById } from "~/shared/api/cameras";
import { normalizeWebRtcUrl } from "~/shared/api/mediamtx";

const route = useRoute();
const isLoading = ref(true);
const isDeleting = ref(false);
const errorMessage = ref("");
const camera = ref<Camera | null>(null);

const cameraId = computed(() => String(route.params.camera_id || ""));

async function loadCamera() {
	if (!cameraId.value) {
		errorMessage.value = "Не передан идентификатор камеры.";
		isLoading.value = false;
		return;
	}

	isLoading.value = true;
	errorMessage.value = "";

	try {
		camera.value = await fetchCameraById(cameraId.value);
	} catch (error) {
		console.error("Failed to fetch camera:", error);
		errorMessage.value = error instanceof Error ? error.message : "Не удалось загрузить карточку камеры.";
	} finally {
		isLoading.value = false;
	}
}

async function removeCamera() {
	if (!camera.value) {
		return;
	}

	isDeleting.value = true;

	try {
		await deleteCameraRequest(camera.value.id);
		await navigateTo("/cameras");
	} catch (error) {
		console.error("Failed to delete camera:", error);
		errorMessage.value = error instanceof Error ? error.message : "Не удалось удалить камеру.";
	} finally {
		isDeleting.value = false;
	}
}

function goBack() {
	if (window.history.length > 1) {
		return navigateTo(-1);
	}

	return navigateTo("/cameras");
}

function openWebRtcDirect() {
	if (!process.client || !camera.value?.webrtc_url) {
		return;
	}

	window.open(normalizeWebRtcUrl(camera.value.webrtc_url), "_blank", "noopener,noreferrer");
}

useSeoMeta({
	title: () => (camera.value ? `${camera.value.name} | Камера` : "Камера"),
	description: "Подробная карточка камеры с большим предпросмотром и переходом к потоку.",
});

onMounted(() => {
	loadCamera();
});
</script>

<template>
	<main class="camera-details-page">
		<UContainer class="camera-details-layout max-w-none px-3 sm:px-4 lg:px-5">
			<div class="camera-details-toolbar">
				<UButton
					color="neutral"
					variant="outline"
					icon="i-lucide-arrow-left"
					size="lg"
					@click="goBack"
				>
					Вернуться назад
				</UButton>
			</div>

			<UAlert
				v-if="errorMessage"
				color="error"
				variant="soft"
				icon="i-lucide-circle-alert"
				:title="errorMessage"
			/>

			<section v-if="isLoading" class="camera-details-skeleton" />

			<section v-else-if="camera" class="camera-details-card">
				<header class="camera-details-header">
					<div class="camera-details-copy">
						<div class="camera-details-badge">
							<UIcon name="i-lucide-badge-info" />
							<span>Карточка камеры</span>
						</div>
						<div>
							<h1 class="camera-details-title">{{ camera.name }}</h1>
							<p class="camera-details-location">
								<UIcon name="i-lucide-map-pin" />
								{{ camera.location }}
							</p>
						</div>
						<p v-if="camera.description" class="camera-details-description">
							{{ camera.description }}
						</p>
					</div>

					<div class="camera-details-actions">
						<UButton
							color="primary"
							size="lg"
							icon="i-lucide-external-link"
							@click="openWebRtcDirect"
						>
							Открыть WebRTC напрямую в браузере
						</UButton>
						<UButton
							color="error"
							variant="soft"
							size="lg"
							icon="i-lucide-trash-2"
							:loading="isDeleting"
							@click="removeCamera"
						>
							Удалить камеру
						</UButton>
					</div>
				</header>

				<div class="camera-details-grid">
					<div class="camera-details-preview">
						<CameraPreview
							:title="camera.name"
							:location="camera.location"
							:webrtc-url="camera.webrtc_url"
						/>
					</div>

					<div class="camera-details-meta">
						<div class="camera-details-field">
							<span>Название</span>
							<strong>{{ camera.name }}</strong>
						</div>
						<div class="camera-details-field">
							<span>Локация</span>
							<strong>{{ camera.location }}</strong>
						</div>
						<div class="camera-details-field">
							<span>RTSP source</span>
							<strong>{{ camera.rtsp_url }}</strong>
						</div>
						<div class="camera-details-field">
							<span>WebRTC endpoint</span>
							<strong>{{ camera.webrtc_url }}</strong>
						</div>
						<div v-if="camera.description" class="camera-details-field">
							<span>Описание</span>
							<strong>{{ camera.description }}</strong>
						</div>
					</div>
				</div>
			</section>
		</UContainer>
	</main>
</template>

<style scoped>
.camera-details-page {
	min-height: 100vh;
	padding: 0.9rem 0 1.4rem;
	background:
		radial-gradient(circle at top left, rgba(14, 165, 233, 0.14), transparent 0 24%),
		radial-gradient(circle at top right, rgba(248, 113, 113, 0.12), transparent 0 18%),
		linear-gradient(180deg, rgba(2, 6, 23, 0.98), rgba(15, 23, 42, 0.96));
}

.camera-details-layout {
	display: grid;
	gap: 0.9rem;
}

.camera-details-toolbar,
.camera-details-card,
.camera-details-skeleton {
	border: 1px solid rgba(255, 255, 255, 0.08);
	background:
		linear-gradient(180deg, rgba(15, 23, 42, 0.88), rgba(15, 23, 42, 0.76)),
		linear-gradient(135deg, rgba(56, 189, 248, 0.08), rgba(248, 113, 113, 0.04));
	box-shadow: 0 24px 72px rgba(2, 6, 23, 0.35);
	backdrop-filter: blur(18px);
	border-radius: 1.8rem;
	padding: 1rem 1.1rem;
}

.camera-details-skeleton {
	min-height: 24rem;
}

.camera-details-card,
.camera-details-copy,
.camera-details-actions,
.camera-details-meta,
.camera-details-field {
	display: grid;
	gap: 1rem;
}

.camera-details-header {
	display: flex;
	align-items: start;
	justify-content: space-between;
	gap: 1rem;
	padding-bottom: 1rem;
	border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.camera-details-badge {
	display: inline-flex;
	width: fit-content;
	align-items: center;
	gap: 0.5rem;
	padding: 0.55rem 0.85rem;
	border-radius: 999px;
	border: 1px solid rgba(56, 189, 248, 0.18);
	background: rgba(15, 23, 42, 0.68);
	color: rgba(226, 232, 240, 0.82);
	font-size: 0.76rem;
	letter-spacing: 0.08em;
	text-transform: uppercase;
}

.camera-details-title,
.camera-details-field strong {
	margin: 0;
	color: #f8fafc;
}

.camera-details-title {
	font-size: clamp(1.9rem, 4vw, 2.9rem);
	font-weight: 700;
	letter-spacing: -0.04em;
}

.camera-details-location,
.camera-details-description,
.camera-details-field span {
	color: rgba(203, 213, 225, 0.74);
}

.camera-details-location {
	display: inline-flex;
	align-items: center;
	gap: 0.45rem;
	margin: 0.45rem 0 0;
}

.camera-details-description {
	margin: 0;
	line-height: 1.7;
	max-width: 52rem;
}

.camera-details-actions {
	min-width: 20rem;
}

.camera-details-grid {
	display: grid;
	grid-template-columns: minmax(0, 1.25fr) minmax(19rem, 0.75fr);
	gap: 1rem;
	padding-top: 1rem;
}

.camera-details-meta {
	align-content: start;
}

.camera-details-field {
	padding: 0.95rem 1rem;
	border-radius: 1rem;
	background: rgba(15, 23, 42, 0.6);
}

.camera-details-field strong {
	overflow-wrap: anywhere;
}

@media (max-width: 1024px) {
	.camera-details-header,
	.camera-details-grid {
		grid-template-columns: minmax(0, 1fr);
		flex-direction: column;
	}

	.camera-details-actions {
		min-width: 0;
		width: 100%;
	}
}
</style>
