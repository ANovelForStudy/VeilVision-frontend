<script setup lang="ts">
import { computed, ref, watch } from "vue";
import type { Camera, CameraPayload } from "~/entities/camera/model/types";
import {
	deleteCamera as deleteCameraRequest,
	fetchCameraById,
	updateCamera as updateCameraRequest,
} from "~/shared/api/cameras";
import { normalizeWebRtcUrl } from "~/shared/api/mediamtx";

const route = useRoute();
const isLoading = ref(true);
const isDeleting = ref(false);
const isUpdating = ref(false);
const isEditModalOpen = ref(false);
const errorMessage = ref("");
const camera = ref<Camera | null>(null);

const editForm = ref<CameraPayload>({
	name: "",
	rtsp_url: "",
	webrtc_url: "",
	description: "",
	location: "",
});

const cameraId = computed(() => String(route.params.camera_id || "").trim());
const isNotFound = computed(() => !isLoading.value && !camera.value && !errorMessage.value);

async function loadCamera() {
	if (!cameraId.value) {
		camera.value = null;
		errorMessage.value = "Не передан идентификатор камеры.";
		isLoading.value = false;
		return;
	}

	isLoading.value = true;
	errorMessage.value = "";
	camera.value = null;

	try {
		camera.value = await fetchCameraById(cameraId.value);
	} catch (error) {
		console.error("Failed to fetch camera:", error);
		errorMessage.value =
			error instanceof Error ? error.message : "Не удалось загрузить карточку камеры.";
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

async function submitCameraUpdate() {
	if (!camera.value) {
		return;
	}

	isUpdating.value = true;
	errorMessage.value = "";

	try {
		const updatedCamera = await updateCameraRequest(camera.value.id, {
			name: editForm.value.name.trim(),
			rtsp_url: editForm.value.rtsp_url.trim(),
			webrtc_url: normalizeWebRtcUrl(editForm.value.webrtc_url),
			description: editForm.value.description.trim(),
			location: editForm.value.location.trim(),
		});

		camera.value = updatedCamera;
		isEditModalOpen.value = false;
	} catch (error) {
		console.error("Failed to update camera:", error);
		errorMessage.value =
			error instanceof Error ? error.message : "Не удалось обновить данные камеры.";
	} finally {
		isUpdating.value = false;
	}
}

function goBack() {
	return navigateTo("/cameras");
}

function openEditModal() {
	if (!camera.value) {
		return;
	}

	editForm.value = {
		name: camera.value.name,
		rtsp_url: camera.value.rtsp_url,
		webrtc_url: camera.value.webrtc_url,
		description: camera.value.description,
		location: camera.value.location,
	};

	isEditModalOpen.value = true;
}

function openWebRtcDirect() {
	if (!process.client || !camera.value?.webrtc_url) {
		return;
	}

	window.open(normalizeWebRtcUrl(camera.value.webrtc_url), "_blank", "noopener,noreferrer");
}

useSeoMeta({
	title: () => (camera.value ? `${camera.value.name} | Камера` : "Камера"),
	description:
		"Подробная карточка камеры с обзором параметров, предпросмотром и управлением подключением.",
});

watch(cameraId, loadCamera, { immediate: true });
</script>

<template>
	<main class="camera-details-page">
		<UContainer class="camera-details-layout max-w-none px-3 sm:px-4 lg:px-5">
			<div class="camera-details-toolbar">
				<div class="camera-details-toolbar__actions">
					<UButton
						color="neutral"
						variant="ghost"
						icon="i-lucide-arrow-left"
						size="md"
						class="font-medium text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
						@click="goBack"
					>
						Вернуться к списку камер
					</UButton>

					<div class="h-4 w-px bg-gray-200 dark:bg-gray-800"></div>

					<UButton
						color="neutral"
						variant="ghost"
						icon="i-lucide-home"
						size="md"
						class="font-medium text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
						to="/dashboard"
					>
						На главную
					</UButton>
				</div>
			</div>

			<UAlert
				v-if="errorMessage"
				color="error"
				variant="soft"
				icon="i-lucide-circle-alert"
				:title="errorMessage"
			/>

			<section
				v-if="isLoading"
				class="camera-details-skeleton"
			/>

			<section
				v-else-if="camera"
				class="camera-details-card"
			>
				<header class="camera-hero">
					<div class="camera-hero__copy">
						<div class="camera-hero__badge">
							<UIcon name="i-lucide-cctv" />
							<span>Детальная карточка</span>
						</div>
						<div class="camera-hero__headline">
							<div>
								<h1 class="camera-hero__title">{{ camera.name }}</h1>
								<p class="camera-hero__location">
									<UIcon name="i-lucide-map-pin" />
									{{ camera.location }}
								</p>
							</div>
							<UBadge
								color="success"
								variant="soft"
								class="camera-hero__status"
							>
								Активна
							</UBadge>
						</div>
						<p class="camera-hero__description">
							{{
								camera.description ||
								"Камера подключена к реестру. Здесь можно просмотреть основные параметры и быстро обновить конфигурацию."
							}}
						</p>
					</div>

					<div
						class="inline-flex flex-col gap-5 p-5 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm max-w-4xl"
					>
						<div
							class="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-4"
						>
							<div class="flex items-center gap-2">
								<span
									class="h-2.5 w-2.5 rounded-full bg-emerald-500 ring-4 ring-emerald-500/20"
								></span>
								<h3
									class="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider"
								>
									Статус трансляции
								</h3>
							</div>

							<div class="flex gap-3">
								<div
									class="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gray-100 dark:bg-gray-800 text-xs font-medium text-gray-800 dark:text-gray-200"
								>
									<span class="text-gray-400">RTSP:</span> Активен
								</div>
								<div
									class="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gray-100 dark:bg-gray-800 text-xs font-medium text-gray-800 dark:text-gray-200"
								>
									<span class="text-gray-400">WebRTC:</span> Доступен
								</div>
							</div>
						</div>

						<div class="grid grid-cols-1 sm:flex sm:items-center gap-3">
							<UButton
								color="primary"
								size="lg"
								icon="i-lucide-pencil-line"
								class="px-5 font-semibold justify-center sm:justify-start"
								@click="openEditModal"
							>
								Редактировать камеру
							</UButton>

							<UButton
								color="neutral"
								variant="outline"
								size="lg"
								icon="i-lucide-external-link"
								class="px-5 font-semibold justify-center sm:justify-start"
								@click="openWebRtcDirect"
							>
								Открыть WebRTC напрямую
							</UButton>

							<div class="hidden sm:block flex-1"></div>

							<UButton
								color="error"
								variant="soft"
								size="lg"
								icon="i-lucide-trash-2"
								:loading="isDeleting"
								class="px-5 font-semibold justify-center sm:justify-start hover:bg-error-50 dark:hover:bg-error-950/30"
								@click="removeCamera"
							>
								Удалить камеру
							</UButton>
						</div>
					</div>
				</header>

				<div class="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch w-full px-4 py-6">
					<section
						class="lg:col-span-2 flex flex-col rounded-3xl border border-gray-200/60 bg-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:border-gray-800/60 dark:bg-gray-900 overflow-hidden transition-all duration-300 hover:shadow-[0_8px_40px_rgb(0,0,0,0.08)]"
					>
						<div
							class="p-6 border-b border-gray-100 dark:border-gray-800/60 bg-gradient-to-b from-gray-50/50 to-white dark:from-gray-900/50 dark:to-gray-900 flex-none"
						>
							<p
								class="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em] mb-1"
								>Live Preview</p
							>
							<h2
								class="text-xl font-semibold text-gray-900 dark:text-white tracking-tight"
								>Предпросмотр потока</h2
							>
						</div>
						<div class="p-6 bg-gray-950/5 flex-1 flex flex-col justify-center">
							<CameraPreview
								:title="camera.name"
								:location="camera.location"
								:webrtc-url="camera.webrtc_url"
								class="rounded-2xl overflow-hidden shadow-inner w-full h-full object-cover"
							/>
						</div>
					</section>

					<section
						class="flex flex-col rounded-3xl border border-gray-200/60 bg-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:border-gray-800/60 dark:bg-gray-900 overflow-hidden transition-all duration-300 hover:shadow-[0_8px_40px_rgb(0,0,0,0.08)]"
					>
						<div
							class="p-6 border-b border-gray-100 dark:border-gray-800/60 bg-gradient-to-b from-gray-50/50 to-white dark:from-gray-900/50 dark:to-gray-900 flex-none"
						>
							<p
								class="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em] mb-1"
								>Configuration</p
							>
							<h2
								class="text-xl font-semibold text-gray-900 dark:text-white tracking-tight"
								>Параметры камеры</h2
							>
						</div>

						<div
							class="p-6 divide-y divide-gray-100 dark:divide-gray-800/60 flex-1 flex flex-col justify-between"
						>
							<div class="py-3 first:pt-0 group">
								<span
									class="block text-xs font-medium text-gray-400 dark:text-gray-500 mb-1"
									>Название</span
								>
								<strong
									class="block text-sm font-semibold text-gray-900 dark:text-white tracking-tight"
									>{{ camera.name }}</strong
								>
							</div>

							<div class="py-3 group">
								<span
									class="block text-xs font-medium text-gray-400 dark:text-gray-500 mb-1"
									>Локация</span
								>
								<strong
									class="block text-sm font-semibold text-gray-900 dark:text-white tracking-tight"
									>{{ camera.location }}</strong
								>
							</div>

							<div class="py-3 group">
								<span
									class="block text-xs font-medium text-gray-400 dark:text-gray-500 mb-1.5"
									>RTSP source</span
								>
								<div
									class="relative flex items-center rounded-lg border border-gray-150 bg-gray-50 pl-3 pr-10 py-2 dark:border-gray-800 dark:bg-gray-950 shadow-sm transition-colors focus-within:border-gray-300 dark:focus-within:border-gray-700"
								>
									<span
										class="text-xs font-mono font-medium text-gray-700 dark:text-gray-300 truncate w-full select-all"
									>
										{{ camera.rtsp_url }}
									</span>
									<div class="absolute right-1 inset-y-0 flex items-center">
										<UButton
											color="neutral"
											variant="ghost"
											icon="i-lucide-copy"
											size="xs"
											class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
											@click="navigator.clipboard.writeText(camera.rtsp_url)"
										/>
									</div>
								</div>
							</div>

							<div class="py-3 group">
								<span
									class="block text-xs font-medium text-gray-400 dark:text-gray-500 mb-1.5"
									>WebRTC endpoint</span
								>
								<div
									class="relative flex items-center rounded-lg border border-gray-150 bg-gray-50 pl-3 pr-10 py-2 dark:border-gray-800 dark:bg-gray-950 shadow-sm transition-colors focus-within:border-gray-300 dark:focus-within:border-gray-700"
								>
									<span
										class="text-xs font-mono font-medium text-gray-700 dark:text-gray-300 truncate w-full select-all"
									>
										{{ camera.webrtc_url }}
									</span>
									<div class="absolute right-1 inset-y-0 flex items-center">
										<UButton
											color="neutral"
											variant="ghost"
											icon="i-lucide-copy"
											size="xs"
											class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
											@click="
												navigator.clipboard.writeText(camera.webrtc_url)
											"
										/>
									</div>
								</div>
							</div>

							<div class="py-3 last:pb-0 group flex-1 flex flex-col min-h-[60px]">
								<span
									class="block text-xs font-medium text-gray-400 dark:text-gray-500 mb-1"
									>Описание</span
								>
								<p
									class="text-sm text-gray-600 dark:text-gray-400 leading-relaxed font-normal flex-1"
								>
									{{ camera.description || "Описание пока не заполнено." }}
								</p>
							</div>
						</div>
					</section>
				</div>
			</section>

			<section
				v-else-if="isNotFound"
				class="camera-details-empty"
			>
				<div class="camera-details-empty__icon">
					<UIcon name="i-lucide-camera-off" />
				</div>
				<h2>Камера не найдена</h2>
				<p>Проверь идентификатор в адресной строке или вернись к общему реестру камер.</p>
				<div class="camera-details-empty__actions">
					<UButton
						color="neutral"
						variant="outline"
						size="lg"
						@click="goBack"
					>
						Вернуться назад
					</UButton>
					<UButton
						color="primary"
						size="lg"
						to="/cameras"
					>
						Перейти к списку камер
					</UButton>
				</div>
			</section>
		</UContainer>

		<UModal
			:open="isEditModalOpen"
			:content="{ class: 'sm:max-w-2xl' }"
			@update:open="isEditModalOpen = $event"
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
								<UIcon name="i-lucide-pencil-line" />
							</div>
							<div class="modal-header__copy">
								<h3 class="modal-title">Редактирование камеры</h3>
								<p class="modal-subtitle"
									>Изменения будут отправлены в backend через PATCH endpoint.</p
								>
							</div>
							<UButton
								color="neutral"
								variant="ghost"
								icon="i-lucide-x"
								size="sm"
								@click="isEditModalOpen = false"
							/>
						</div>
					</template>

					<form
						class="modal-form"
						@submit.prevent="submitCameraUpdate"
					>
						<div class="form-grid">
							<div class="form-field">
								<label class="form-label">Название</label>
								<UInput
									v-model="editForm.name"
									variant="subtle"
									class="w-full"
									size="lg"
									required
								/>
							</div>

							<div class="form-field">
								<label class="form-label">Локация</label>
								<UInput
									v-model="editForm.location"
									variant="subtle"
									class="w-full"
									size="lg"
									required
								/>
							</div>

							<div class="form-field form-field--full">
								<label class="form-label">Описание</label>
								<UTextarea
									v-model="editForm.description"
									variant="subtle"
									class="w-full"
									:rows="4"
								/>
							</div>

							<div class="form-field form-field--full">
								<label class="form-label">RTSP URL</label>
								<UInput
									v-model="editForm.rtsp_url"
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
									v-model="editForm.webrtc_url"
									variant="subtle"
									class="w-full"
									size="lg"
									placeholder="http://127.0.0.1:8889/camera-1/"
									required
								/>
							</div>
						</div>
					</form>

					<template #footer>
						<div class="modal-actions">
							<UButton
								color="neutral"
								variant="outline"
								size="lg"
								@click="isEditModalOpen = false"
							>
								Отмена
							</UButton>
							<UButton
								color="primary"
								size="lg"
								:loading="isUpdating"
								class="modal-submit-button"
								@click="submitCameraUpdate"
							>
								Сохранить изменения
							</UButton>
						</div>
					</template>
				</UCard>
			</template>
		</UModal>
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
	gap: 0.95rem;
}

.camera-details-toolbar__actions,
.camera-hero__headline,
.camera-panel__header,
.modal-header,
.modal-actions {
	display: flex;
	align-items: center;
	justify-content: left;
	gap: 1rem;
}

.camera-details-toolbar,
.camera-details-card,
.camera-details-skeleton,
.camera-details-empty,
.camera-preview-panel,
.camera-info-panel {
	border: 1px solid rgba(255, 255, 255, 0.08);
	background:
		linear-gradient(180deg, rgba(15, 23, 42, 0.88), rgba(15, 23, 42, 0.76)),
		linear-gradient(135deg, rgba(56, 189, 248, 0.08), rgba(248, 113, 113, 0.04));
	box-shadow: 0 24px 72px rgba(2, 6, 23, 0.35);
	backdrop-filter: blur(18px);
}

.camera-details-toolbar,
.camera-details-card,
.camera-details-skeleton,
.camera-details-empty {
	border-radius: 1.8rem;
	padding: 1rem 1.1rem;
}

.camera-details-skeleton {
	min-height: 24rem;
}

.camera-details-empty {
	display: grid;
	justify-items: center;
	gap: 1rem;
	min-height: 18rem;
	text-align: center;
}

.camera-hero,
.camera-hero__copy,
.camera-hero__actions,
.camera-hero__stats,
.camera-hero__buttons,
.camera-info-grid,
.camera-details-empty__actions,
.modal-header__copy,
.modal-form,
.form-field {
	display: grid;
	gap: 1rem;
}

.camera-hero {
	grid-template-columns: minmax(0, 1.3fr) minmax(18rem, 0.9fr);
	padding-bottom: 1.1rem;
}

.camera-hero__badge {
	display: inline-flex;
	width: fit-content;
	align-items: center;
	gap: 0.55rem;
	padding: 0.55rem 0.9rem;
	border-radius: 999px;
	border: 1px solid rgba(56, 189, 248, 0.18);
	background: rgba(15, 23, 42, 0.68);
	color: rgba(226, 232, 240, 0.82);
	font-size: 0.76rem;
	letter-spacing: 0.08em;
	text-transform: uppercase;
}

.camera-hero__title,
.camera-panel__title,
.camera-info-card strong,
.camera-details-empty h2,
.modal-title {
	margin: 0;
	color: #f8fafc;
}

.camera-hero__title {
	font-size: clamp(2rem, 4vw, 3.1rem);
	font-weight: 700;
	letter-spacing: -0.045em;
}

.camera-hero__location,
.camera-hero__description,
.camera-stat__label,
.camera-panel__eyebrow,
.camera-info-card span,
.camera-details-empty p,
.modal-subtitle {
	color: rgba(203, 213, 225, 0.74);
}

.camera-hero__location {
	display: inline-flex;
	align-items: center;
	gap: 0.45rem;
	margin: 0.45rem 0 0;
}

.camera-hero__description {
	margin: 0;
	max-width: 56rem;
	line-height: 1.7;
}

.camera-hero__status {
	align-self: start;
	border-radius: 999px;
}

.camera-hero__stats {
	grid-template-columns: repeat(2, minmax(0, 1fr));
}

.camera-stat {
	display: grid;
	gap: 0.4rem;
	padding: 0.95rem 1rem;
	border-radius: 1.2rem;
	background: rgba(15, 23, 42, 0.62);
	border: 1px solid rgba(255, 255, 255, 0.05);
}

.camera-stat__value {
	font-size: 1.05rem;
	color: #f8fafc;
}

.camera-details-grid {
	display: grid;
	grid-template-columns: minmax(0, 1.25fr) minmax(20rem, 0.95fr);
	gap: 1rem;
	padding-top: 0.25rem;
}

.camera-preview-panel,
.camera-info-panel {
	display: grid;
	gap: 1rem;
	padding: 1rem;
	border-radius: 1.45rem;
}

.camera-panel__eyebrow {
	margin: 0;
	font-size: 0.74rem;
	text-transform: uppercase;
	letter-spacing: 0.12em;
}

.camera-panel__title {
	font-size: 1.2rem;
	font-weight: 600;
}

.camera-info-grid {
	grid-template-columns: repeat(2, minmax(0, 1fr));
}

.camera-info-card {
	display: grid;
	gap: 0.55rem;
	padding: 1rem 1.05rem;
	border-radius: 1.1rem;
	background:
		linear-gradient(180deg, rgba(15, 23, 42, 0.72), rgba(15, 23, 42, 0.62)),
		linear-gradient(135deg, rgba(56, 189, 248, 0.06), transparent);
	border: 1px solid rgba(255, 255, 255, 0.05);
}

.camera-info-card--full {
	grid-column: 1 / -1;
}

.camera-info-card strong {
	overflow-wrap: anywhere;
}

.camera-details-empty__icon,
.modal-header__icon {
	display: grid;
	place-items: center;
	width: 2.95rem;
	height: 2.95rem;
	border-radius: 1rem;
	background: rgba(37, 99, 235, 0.18);
	color: #93c5fd;
	font-size: 1.2rem;
}

.camera-details-empty__icon {
	width: 4.25rem;
	height: 4.25rem;
	border-radius: 1.4rem;
	background: rgba(15, 23, 42, 0.7);
	color: rgba(148, 163, 184, 0.82);
	font-size: 1.8rem;
}

.camera-details-empty__actions {
	grid-template-columns: repeat(2, auto);
}

.modal-title {
	font-size: 1.15rem;
	font-weight: 600;
}

.modal-subtitle,
.camera-details-empty p {
	margin: 0;
	line-height: 1.7;
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
	margin: 0;
	font-size: 0.88rem;
	color: #f8fafc;
}

.modal-actions {
	flex-wrap: wrap;
	justify-content: flex-end;
	width: 100%;
}

.modal-submit-button {
	min-width: 13rem;
	justify-content: center;
}

@media (max-width: 1100px) {
	.camera-hero,
	.camera-details-grid {
		grid-template-columns: minmax(0, 1fr);
	}
}

@media (max-width: 900px) {
	.camera-info-grid,
	.form-grid,
	.camera-hero__stats {
		grid-template-columns: minmax(0, 1fr);
	}
}

@media (max-width: 640px) {
	.camera-details-toolbar__actions,
	.camera-panel__header,
	.camera-hero__headline,
	.modal-header,
	.modal-actions {
		flex-direction: column;
		align-items: stretch;
	}

	.camera-details-empty__actions {
		grid-template-columns: minmax(0, 1fr);
		width: 100%;
	}
}
</style>
