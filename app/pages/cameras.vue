<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import type { Camera, CameraPayload } from "~/entities/camera/model/types";
import {
	createCamera as createCameraRequest,
	deleteCamera as deleteCameraRequest,
	fetchCameras as fetchCamerasRequest,
} from "~/shared/api/cameras";
import { normalizeWebRtcUrl } from "~/shared/api/mediamtx";

const cameras = ref<Camera[]>([]);
const isLoading = ref(true);
const isSubmitting = ref(false);
const isDeleting = ref(false);
const errorMessage = ref("");
const searchQuery = ref("");
const isCreateModalOpen = ref(false);
const isDeleteModalOpen = ref(false);
const cameraToDelete = ref<Camera | null>(null);

const createForm = ref<CameraPayload>({
	name: "",
	rtsp_url: "",
	webrtc_url: "",
	description: "",
	location: "",
});

const filteredCameras = computed(() => {
	const query = searchQuery.value.trim().toLowerCase();

	if (!query) {
		return cameras.value;
	}

	return cameras.value.filter((camera) =>
		[
			camera.name,
			camera.location,
			camera.description,
			camera.rtsp_url,
			camera.webrtc_url,
		].some((value) => value.toLowerCase().includes(query)),
	);
});

async function fetchCameras() {
	isLoading.value = true;
	errorMessage.value = "";

	try {
		cameras.value = await fetchCamerasRequest();
	} catch (error) {
		console.error("Failed to fetch cameras:", error);
		errorMessage.value = error instanceof Error ? error.message : "Не удалось загрузить список камер.";
	} finally {
		isLoading.value = false;
	}
}

async function submitCreateCamera() {
	isSubmitting.value = true;
	errorMessage.value = "";

	try {
		const payload: CameraPayload = {
			name: createForm.value.name.trim(),
			rtsp_url: createForm.value.rtsp_url.trim(),
			webrtc_url: normalizeWebRtcUrl(createForm.value.webrtc_url),
			description: createForm.value.description.trim(),
			location: createForm.value.location.trim(),
		};

		const createdCamera = await createCameraRequest(payload);
		cameras.value = [createdCamera, ...cameras.value];
		isCreateModalOpen.value = false;
		resetCreateForm();
	} catch (error) {
		console.error("Failed to create camera:", error);
		errorMessage.value = error instanceof Error ? error.message : "Не удалось создать камеру.";
	} finally {
		isSubmitting.value = false;
	}
}

async function confirmDeleteCamera() {
	if (!cameraToDelete.value) {
		return;
	}

	isDeleting.value = true;
	errorMessage.value = "";

	try {
		await deleteCameraRequest(cameraToDelete.value.id);
		cameras.value = cameras.value.filter((camera) => camera.id !== cameraToDelete.value?.id);
		isDeleteModalOpen.value = false;
		cameraToDelete.value = null;
	} catch (error) {
		console.error("Failed to delete camera:", error);
		errorMessage.value = error instanceof Error ? error.message : "Не удалось удалить камеру.";
	} finally {
		isDeleting.value = false;
	}
}

function openCreateModal() {
	resetCreateForm();
	isCreateModalOpen.value = true;
}

function promptDeleteCamera(camera: Camera) {
	cameraToDelete.value = camera;
	isDeleteModalOpen.value = true;
}

function resetCreateForm() {
	createForm.value = {
		name: "",
		rtsp_url: "",
		webrtc_url: "",
		description: "",
		location: "",
	};
}

function openWebRtcStream(camera: Camera) {
	if (!process.client || !camera.webrtc_url) {
		return;
	}

	window.open(normalizeWebRtcUrl(camera.webrtc_url), "_blank", "noopener,noreferrer");
}

useSeoMeta({
	title: "YOLO FireWatch Lab | Камеры",
	description: "Список камер, встроенный WebRTC предпросмотр и переход к карточке каждой камеры.",
});

onMounted(() => {
	fetchCameras();
});
</script>

<template>
	<main class="cameras-page">
		<UContainer class="cameras-layout max-w-none px-3 sm:px-4 lg:px-5">
			<header class="cameras-hero">
				<div class="cameras-hero__copy">
					<div class="cameras-hero__badge">
						<UIcon name="i-lucide-cctv" />
						<span>Реестр видеопотоков</span>
					</div>
					<div>
						<h1 class="cameras-title">Камеры</h1>
						<p class="cameras-subtitle">
							Предпросмотр в карточке работает через `webrtc_url`, потому что браузер не воспроизводит `rtsp://` напрямую.
						</p>
					</div>
				</div>

				<div class="cameras-hero__actions">
					<div class="hero-summary-grid">
						<div class="hero-summary">
							<span class="hero-summary__value">{{ cameras.length }}</span>
							<span class="hero-summary__label">камер в реестре</span>
						</div>
						<div class="hero-summary">
							<span class="hero-summary__value">{{ filteredCameras.length }}</span>
							<span class="hero-summary__label">в текущей выборке</span>
						</div>
					</div>

					<UButton
						color="primary"
						size="lg"
						icon="i-lucide-plus"
						class="cameras-add-btn"
						@click="openCreateModal"
					>
						Добавить камеру
					</UButton>
				</div>
			</header>

			<section class="control-panel">
				<div class="control-panel__search">
					<label class="control-label">Поиск камеры</label>
					<UInput
						v-model="searchQuery"
						size="xl"
						variant="subtle"
						icon="i-lucide-search"
						placeholder="Название, описание, локация, RTSP или WebRTC URL"
						class="control-input"
					/>
				</div>

				<div class="control-panel__result">
					<p class="control-label">Результат</p>
					<p class="control-result">
						Найдено <strong>{{ filteredCameras.length }}</strong> камер
					</p>
				</div>
			</section>

			<section class="camera-list-panel">
				<div class="camera-list-panel__header">
					<div>
						<p class="camera-list-panel__eyebrow">Инвентаризация</p>
						<h2 class="camera-list-panel__title">Все камеры</h2>
					</div>
					<UBadge color="neutral" variant="soft" class="rounded-full px-3 py-1">
						{{ filteredCameras.length }} / {{ cameras.length }}
					</UBadge>
				</div>

				<UAlert
					v-if="errorMessage"
					color="error"
					variant="soft"
					icon="i-lucide-circle-alert"
					:title="errorMessage"
				/>

				<div v-if="isLoading" class="camera-list">
					<div
						v-for="index in 4"
						:key="`camera-skeleton-${index}`"
						class="camera-card camera-card--skeleton"
					/>
				</div>

				<div v-else-if="filteredCameras.length === 0" class="cameras-empty">
					<div class="cameras-empty__icon">
						<UIcon name="i-lucide-camera-off" />
					</div>
					<h3>Камеры не найдены</h3>
					<p>Измени поисковый запрос или добавь новую камеру.</p>
				</div>

				<div v-else class="camera-list">
					<article
						v-for="camera in filteredCameras"
						:key="camera.id"
						class="camera-card"
					>
						<CameraPreview
							:title="camera.name"
							:location="camera.location"
							:webrtc-url="camera.webrtc_url"
							compact
						/>

						<div class="camera-card__body">
							<div class="camera-card__identity">
								<div>
									<h3 class="camera-card__name">{{ camera.name }}</h3>
									<p class="camera-card__location">
										<UIcon name="i-lucide-map-pin" />
										{{ camera.location }}
									</p>
								</div>

								<UBadge color="primary" variant="subtle" class="camera-card__badge">
									WebRTC Preview
								</UBadge>
							</div>

							<p v-if="camera.description" class="camera-card__description">
								{{ camera.description }}
							</p>

							<div class="camera-card__meta">
								<div class="camera-card__field">
									<span>RTSP source</span>
									<strong>{{ camera.rtsp_url }}</strong>
								</div>
								<div class="camera-card__field">
									<span>WebRTC endpoint</span>
									<strong>{{ camera.webrtc_url }}</strong>
								</div>
							</div>
						</div>

						<div class="camera-card__actions">
							<UButton
								color="neutral"
								variant="outline"
								size="lg"
								icon="i-lucide-square-arrow-out-up-right"
								:to="`/cameras/${camera.id}`"
							>
								Открыть карточку камеры
							</UButton>
							<UButton
								color="primary"
								size="lg"
								icon="i-lucide-external-link"
								@click="openWebRtcStream(camera)"
							>
								Открыть WebRTC напрямую в браузере
							</UButton>
							<UButton
								color="error"
								variant="soft"
								size="lg"
								icon="i-lucide-trash-2"
								@click="promptDeleteCamera(camera)"
							>
								Удалить
							</UButton>
						</div>
					</article>
				</div>
			</section>
		</UContainer>

		<UModal
			:open="isCreateModalOpen"
			:content="{ class: 'sm:max-w-2xl' }"
			@update:open="isCreateModalOpen = $event"
		>
			<template #content>
				<UCard
					:ui="{
						body: { padding: 'p-0' },
						header: { padding: 'p-5' },
						footer: { padding: 'p-5' },
					}"
				>
					<template #header>
						<div class="modal-header">
							<div class="modal-header__icon">
								<UIcon name="i-lucide-plus-circle" />
							</div>
							<div class="modal-header__copy">
								<h3 class="modal-title">Добавление камеры</h3>
								<p class="modal-subtitle">Форма отправляет данные напрямую в POST endpoint камеры.</p>
							</div>
							<UButton
								color="neutral"
								variant="ghost"
								icon="i-lucide-x"
								size="sm"
								@click="isCreateModalOpen = false"
							/>
						</div>
					</template>

					<form class="modal-form" @submit.prevent="submitCreateCamera">
						<div class="form-grid">
							<div class="form-field">
								<label class="form-label">Название</label>
								<UInput v-model="createForm.name" variant="subtle" class="w-full" size="lg" required />
							</div>

							<div class="form-field">
								<label class="form-label">Локация</label>
								<UInput v-model="createForm.location" variant="subtle" class="w-full" size="lg" required />
							</div>

							<div class="form-field form-field--full">
								<label class="form-label">Описание</label>
								<UTextarea v-model="createForm.description" variant="subtle" class="w-full" :rows="4" />
							</div>

							<div class="form-field form-field--full">
								<label class="form-label">RTSP URL</label>
								<UInput
									v-model="createForm.rtsp_url"
									variant="subtle"
									class="w-full"
									size="lg"
									placeholder="rtsp://192.168.1.10:554/stream"
									required
								/>
							</div>

							<div class="form-field form-field--full">
								<label class="form-label">WebRTC URL</label>
								<UInput
									v-model="createForm.webrtc_url"
									variant="subtle"
									class="w-full"
									size="lg"
									placeholder="http://127.0.0.1:8889/camera-1/"
									required
								/>
								<p class="form-hint">
									Этот URL используется и для встроенного предпросмотра, и для открытия потока в новой вкладке.
								</p>
							</div>
						</div>
					</form>

					<template #footer>
						<div class="modal-actions">
							<UButton color="neutral" variant="outline" size="lg" @click="isCreateModalOpen = false">
								Отмена
							</UButton>
							<UButton
								color="primary"
								size="lg"
								:loading="isSubmitting"
								class="modal-submit-button"
								@click="submitCreateCamera"
							>
								Создать камеру
							</UButton>
						</div>
					</template>
				</UCard>
			</template>
		</UModal>

		<UModal
			:open="isDeleteModalOpen"
			:content="{ class: 'sm:max-w-md' }"
			@update:open="isDeleteModalOpen = $event"
		>
			<template #content>
				<UCard>
					<template #header>
						<div class="modal-header modal-header--danger">
							<div class="modal-header__icon modal-header__icon--danger">
								<UIcon name="i-lucide-alert-triangle" />
							</div>
							<div class="modal-header__copy">
								<h3 class="modal-title">Удаление камеры</h3>
								<p class="modal-subtitle">Это действие нельзя отменить.</p>
							</div>
						</div>
					</template>

					<div class="delete-confirm">
						<p>
							Удалить камеру <strong>{{ cameraToDelete?.name }}</strong> из реестра?
						</p>
					</div>

					<template #footer>
						<div class="modal-actions">
							<UButton color="neutral" variant="outline" size="lg" @click="isDeleteModalOpen = false">
								Отмена
							</UButton>
							<UButton
								color="error"
								size="lg"
								:loading="isDeleting"
								@click="confirmDeleteCamera"
							>
								Удалить камеру
							</UButton>
						</div>
					</template>
				</UCard>
			</template>
		</UModal>
	</main>
</template>

<style scoped>
.cameras-page {
	min-height: 100vh;
	padding: 0.9rem 0 1.4rem;
	background:
		radial-gradient(circle at top left, rgba(14, 165, 233, 0.14), transparent 0 24%),
		radial-gradient(circle at top right, rgba(248, 113, 113, 0.12), transparent 0 18%),
		linear-gradient(180deg, rgba(2, 6, 23, 0.98), rgba(15, 23, 42, 0.96));
}

.cameras-layout {
	display: grid;
	gap: 0.85rem;
}

.cameras-hero,
.control-panel,
.camera-list-panel,
.camera-card {
	border: 1px solid rgba(255, 255, 255, 0.08);
	background:
		linear-gradient(180deg, rgba(15, 23, 42, 0.88), rgba(15, 23, 42, 0.76)),
		linear-gradient(135deg, rgba(56, 189, 248, 0.08), rgba(248, 113, 113, 0.04));
	box-shadow: 0 24px 72px rgba(2, 6, 23, 0.35);
	backdrop-filter: blur(18px);
}

.cameras-hero {
	display: flex;
	flex-wrap: wrap;
	align-items: end;
	justify-content: space-between;
	gap: 1rem;
	padding: 1.1rem 1.2rem;
	border-radius: 1.8rem;
}

.cameras-hero__copy,
.cameras-hero__actions,
.hero-summary,
.camera-card,
.camera-card__body,
.camera-card__meta,
.camera-card__field,
.modal-header__copy,
.modal-form,
.form-field,
.delete-confirm {
	display: grid;
	gap: 0.85rem;
}

.cameras-hero__actions {
	width: min(100%, 30rem);
}

.hero-summary-grid {
	display: grid;
	grid-template-columns: repeat(2, minmax(0, 1fr));
	gap: 0.75rem;
}

.cameras-hero__badge {
	display: inline-flex;
	width: fit-content;
	align-items: center;
	gap: 0.6rem;
	padding: 0.55rem 0.9rem;
	border-radius: 999px;
	border: 1px solid rgba(56, 189, 248, 0.18);
	background: rgba(15, 23, 42, 0.68);
	font-size: 0.76rem;
	letter-spacing: 0.08em;
	text-transform: uppercase;
	color: rgba(226, 232, 240, 0.8);
}

.cameras-title,
.camera-list-panel__title,
.camera-card__name,
.modal-title {
	margin: 0;
	color: #f8fafc;
}

.cameras-title {
	font-size: clamp(1.8rem, 4vw, 2.6rem);
	font-weight: 700;
	letter-spacing: -0.04em;
}

.cameras-subtitle,
.camera-list-panel__eyebrow,
.control-label,
.modal-subtitle,
.form-hint,
.camera-card__field span,
.delete-confirm p {
	color: rgba(203, 213, 225, 0.72);
}

.cameras-subtitle {
	max-width: 48rem;
	margin: 0.5rem 0 0;
	line-height: 1.6;
}

.hero-summary {
	padding: 0.85rem 1rem;
	border-radius: 1.25rem;
	border: 1px solid rgba(255, 255, 255, 0.06);
	background: rgba(15, 23, 42, 0.64);
}

.hero-summary__value {
	font-size: 1.7rem;
	font-weight: 700;
	line-height: 1;
	color: #f8fafc;
}

.hero-summary__label {
	font-size: 0.82rem;
	color: rgba(203, 213, 225, 0.72);
}

.cameras-add-btn {
	width: 100%;
	justify-content: center;
}

.control-panel,
.camera-list-panel {
	display: grid;
	gap: 1rem;
	padding: 1rem 1.1rem;
	border-radius: 1.6rem;
}

.control-panel {
	grid-template-columns: minmax(0, 1fr) auto;
	align-items: end;
}

.control-panel__search,
.control-panel__result {
	display: grid;
	gap: 0.5rem;
}

.control-label,
.camera-list-panel__eyebrow {
	margin: 0;
	font-size: 0.75rem;
	text-transform: uppercase;
	letter-spacing: 0.12em;
}

.control-result {
	margin: 0;
	font-size: 0.98rem;
	color: rgba(226, 232, 240, 0.82);
}

.control-result strong {
	color: #f8fafc;
}

.camera-list-panel__header,
.camera-card__actions,
.modal-header,
.modal-actions {
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 1rem;
}

.camera-list-panel__title {
	font-size: 1.25rem;
	font-weight: 600;
}

.camera-list {
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
	gap: 1rem;
}

.camera-card {
	position: relative;
	padding: 0.95rem;
	border-radius: 1.45rem;
	overflow: hidden;
}

.camera-card::before {
	content: "";
	position: absolute;
	inset: 0;
	background: linear-gradient(135deg, rgba(56, 189, 248, 0.08), transparent 40%, rgba(248, 113, 113, 0.05));
	pointer-events: none;
}

.camera-card--skeleton {
	min-height: 24rem;
	background: rgba(51, 65, 85, 0.38);
}

.camera-card__body,
.camera-card__actions {
	position: relative;
	z-index: 1;
}

.camera-card__identity {
	display: flex;
	align-items: start;
	justify-content: space-between;
	gap: 1rem;
}

.camera-card__badge {
	white-space: nowrap;
}

.camera-card__name {
	font-size: 1.08rem;
	font-weight: 700;
}

.camera-card__location {
	display: inline-flex;
	align-items: center;
	gap: 0.45rem;
	margin: 0.35rem 0 0;
	color: rgba(226, 232, 240, 0.78);
}

.camera-card__description {
	margin: 0;
	line-height: 1.6;
	color: rgba(226, 232, 240, 0.82);
}

.camera-card__meta {
	grid-template-columns: minmax(0, 1fr);
}

.camera-card__field {
	padding: 0.8rem 0.9rem;
	border-radius: 1rem;
	background: rgba(15, 23, 42, 0.6);
}

.camera-card__field strong,
.delete-confirm strong {
	color: #f8fafc;
	overflow-wrap: anywhere;
}

.camera-card__actions {
	flex-wrap: wrap;
	justify-content: flex-start;
}

.cameras-empty {
	display: grid;
	place-items: center;
	gap: 0.9rem;
	min-height: 12rem;
	padding: 2rem;
	border-radius: 1.35rem;
	border: 1px dashed rgba(255, 255, 255, 0.12);
	text-align: center;
}

.cameras-empty__icon {
	display: grid;
	place-items: center;
	width: 4.6rem;
	height: 4.6rem;
	border-radius: 1.5rem;
	background: rgba(15, 23, 42, 0.72);
	font-size: 2rem;
	color: rgba(203, 213, 225, 0.6);
}

.cameras-empty h3,
.form-label {
	margin: 0;
	color: #f8fafc;
}

.cameras-empty p,
.modal-subtitle {
	margin: 0;
}

.modal-header {
	align-items: flex-start;
}

.modal-header__icon {
	display: grid;
	place-items: center;
	width: 2.75rem;
	height: 2.75rem;
	border-radius: 1rem;
	background: rgba(37, 99, 235, 0.18);
	color: #93c5fd;
	font-size: 1.2rem;
}

.modal-header__icon--danger {
	background: rgba(239, 68, 68, 0.18);
	color: #fca5a5;
}

.modal-title {
	font-size: 1.15rem;
	font-weight: 600;
}

.form-grid {
	display: grid;
	grid-template-columns: repeat(2, minmax(0, 1fr));
	gap: 1rem;
	padding: 0 1.25rem 1.25rem;
}

.form-field--full {
	grid-column: 1 / -1;
}

.form-label {
	font-size: 0.88rem;
}

.form-hint {
	margin: 0;
	font-size: 0.76rem;
}

.delete-confirm {
	padding-top: 0.2rem;
}

.modal-actions {
	flex-wrap: wrap;
	justify-content: flex-end;
}

.modal-submit-button {
	min-width: 12rem;
	justify-content: center;
}

@media (max-width: 900px) {
	.control-panel,
	.form-grid,
	.hero-summary-grid {
		grid-template-columns: minmax(0, 1fr);
	}
}

@media (max-width: 640px) {
	.cameras-page {
		padding-top: 0.7rem;
	}

	.cameras-hero,
	.control-panel,
	.camera-list-panel,
	.camera-card {
		padding: 0.85rem;
	}

	.cameras-hero__actions {
		width: 100%;
	}

	.camera-card__identity,
	.camera-card__actions,
	.modal-header,
	.modal-actions {
		flex-direction: column;
		align-items: stretch;
	}
}
</style>
