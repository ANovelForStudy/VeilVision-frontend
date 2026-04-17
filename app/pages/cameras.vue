<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import type { Camera, CameraPayload, CameraStatusFilter } from "~/entities/camera/model/types";
import {
	createCameraMock,
	deleteCameraMock,
	fetchCamerasMock,
	updateCameraMock,
} from "~/shared/api/cameras";

const cameras = ref<Camera[]>([]);
const isLoading = ref(true);
const searchQuery = ref("");
const statusFilter = ref<CameraStatusFilter>("all");
const isCreateModalOpen = ref(false);
const isManageModalOpen = ref(false);
const isEditModalOpen = ref(false);
const isDeleteModalOpen = ref(false);
const selectedCamera = ref<Camera | null>(null);
const isSubmitting = ref(false);

const createForm = ref({
	name: "",
	location: "",
	url: "",
});

const editForm = ref({
	name: "",
	location: "",
	url: "",
});

const statusOptions = [
	{ label: "Все камеры", value: "all", icon: "i-lucide-list-filter" },
	{ label: "Норма", value: "normal", icon: "i-lucide-check-circle-2" },
	{ label: "Огонь", value: "fire", icon: "i-lucide-flame" },
	{ label: "Дым", value: "smoke", icon: "i-lucide-cloud" },
] as const;

const statusMeta = {
	all: { label: "Все", icon: "i-lucide-list-filter" },
	normal: { label: "Норма", tone: "safe", icon: "i-lucide-check-circle-2" },
	fire: { label: "Огонь", tone: "fire", icon: "i-lucide-flame" },
	smoke: { label: "Дым", tone: "smoke", icon: "i-lucide-cloud" },
} as const;

const filteredCameras = computed(() => {
	let result = cameras.value;

	if (searchQuery.value.trim()) {
		const query = searchQuery.value.toLowerCase().trim();
		result = result.filter(
			(camera) =>
				camera.name.toLowerCase().includes(query) ||
				camera.location.toLowerCase().includes(query) ||
				camera.url.toLowerCase().includes(query),
		);
	}

	if (statusFilter.value !== "all") {
		result = result.filter((camera) => camera.status === statusFilter.value);
	}

	return result;
});

const statusCounts = computed(() => ({
	all: cameras.value.length,
	normal: cameras.value.filter((camera) => camera.status === "normal").length,
	fire: cameras.value.filter((camera) => camera.status === "fire").length,
	smoke: cameras.value.filter((camera) => camera.status === "smoke").length,
}));

async function fetchCameras() {
	isLoading.value = true;
	try {
		cameras.value = await fetchCamerasMock();
	} catch (error) {
		console.error("Failed to fetch cameras:", error);
	} finally {
		isLoading.value = false;
	}
}

async function createCamera() {
	isSubmitting.value = true;
	try {
		const payload: CameraPayload = { ...createForm.value };
		const response = await createCameraMock(payload);

		cameras.value.unshift(response);
		isCreateModalOpen.value = false;
		createForm.value = { name: "", location: "", url: "" };
	} catch (error) {
		console.error("Failed to create camera:", error);
	} finally {
		isSubmitting.value = false;
	}
}

async function updateCamera() {
	if (!selectedCamera.value) return;

	isSubmitting.value = true;
	try {
		const payload: CameraPayload = { ...editForm.value };
		const response = await updateCameraMock(selectedCamera.value.id, payload);

		const index = cameras.value.findIndex((camera) => camera.id === response.id);
		if (index !== -1) {
			cameras.value[index] = response;
		}

		selectedCamera.value = response;
		isEditModalOpen.value = false;
		isManageModalOpen.value = true;
		editForm.value = { name: "", location: "", url: "" };
	} catch (error) {
		console.error("Failed to update camera:", error);
	} finally {
		isSubmitting.value = false;
	}
}

async function deleteCamera() {
	if (!selectedCamera.value) return;

	isSubmitting.value = true;
	try {
		await deleteCameraMock(selectedCamera.value.id);

		cameras.value = cameras.value.filter((camera) => camera.id !== selectedCamera.value?.id);
		closeAllModals();
	} catch (error) {
		console.error("Failed to delete camera:", error);
	} finally {
		isSubmitting.value = false;
	}
}

function openCreateModal() {
	createForm.value = { name: "", location: "", url: "" };
	disableOtherModals();
	isCreateModalOpen.value = true;
}

function openManageModal(camera: Camera) {
	selectedCamera.value = camera;
	disableOtherModals();
	isManageModalOpen.value = true;
}

function openEditModal(camera: Camera) {
	selectedCamera.value = camera;
	editForm.value = {
		name: camera.name,
		location: camera.location,
		url: camera.url,
	};
	disableOtherModals();
	isEditModalOpen.value = true;
}

function openDeleteModal(camera: Camera) {
	selectedCamera.value = camera;
	disableOtherModals();
	isDeleteModalOpen.value = true;
}

function disableOtherModals() {
	isCreateModalOpen.value = false;
	isManageModalOpen.value = false;
	isEditModalOpen.value = false;
	isDeleteModalOpen.value = false;
}

function closeAllModals() {
	disableOtherModals();
	selectedCamera.value = null;
	editForm.value = { name: "", location: "", url: "" };
}

function clearFilters() {
	searchQuery.value = "";
	statusFilter.value = "all";
}

function statusBadgeColor(status: CameraStatusFilter) {
	if (status === "fire") return "error";
	if (status === "smoke") return "warning";
	return "success";
}

function formatDate(date: string | null) {
	if (!date) return "Никогда";

	return new Intl.DateTimeFormat("ru-RU", {
		day: "2-digit",
		month: "2-digit",
		year: "numeric",
		hour: "2-digit",
		minute: "2-digit",
	}).format(new Date(date));
}

function formatCreatedDate(date: string) {
	return new Intl.DateTimeFormat("ru-RU", {
		day: "2-digit",
		month: "long",
		year: "numeric",
	}).format(new Date(date));
}

useSeoMeta({
	title: "YOLO FireWatch Lab | Управление камерами",
	description: "Управление видеокамерами системы превентивного мониторинга",
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
							Список всех подключенных камер с быстрым доступом к просмотру,
							редактированию и удалению.
						</p>
					</div>
				</div>

				<div class="cameras-hero__actions">
					<div class="hero-summary-grid">
						<div class="hero-summary">
							<span class="hero-summary__value">{{ statusCounts.all }}</span>
							<span class="hero-summary__label">камер в реестре</span>
						</div>
						<div class="hero-summary">
							<span class="hero-summary__value">{{
								statusCounts.fire + statusCounts.smoke
							}}</span>
							<span class="hero-summary__label">требуют внимания</span>
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

			<section class="cameras-stats">
				<button
					v-for="status in ['all', 'normal', 'fire', 'smoke'] as const"
					:key="status"
					type="button"
					class="stat-card"
					:data-status="status"
					:data-active="statusFilter === status"
					@click="statusFilter = status"
				>
					<div class="stat-card__icon">
						<UIcon :name="statusMeta[status].icon" />
					</div>
					<div>
						<span class="stat-card__label">{{ statusMeta[status].label }}</span>
						<span class="stat-card__value">{{ statusCounts[status] }}</span>
					</div>
				</button>
			</section>

			<section class="control-panel">
				<div class="control-panel__search control-panel__field">
					<label class="control-label">Поиск камеры</label>
					<UInput
						v-model="searchQuery"
						size="xl"
						variant="subtle"
						icon="i-lucide-search"
						placeholder="Название, локация или URL потока"
						class="control-input"
					/>
				</div>

				<div class="control-panel__filters control-panel__field">
					<label class="control-label">Статус</label>
					<USelect
						v-model="statusFilter"
						:items="statusOptions"
						value-key="value"
						label-key="label"
						size="xl"
						variant="subtle"
						leading-icon="i-lucide-sliders-horizontal"
						class="control-input"
					/>
				</div>

				<div class="control-panel__side control-panel__field">
					<UButton
						color="neutral"
						variant="outline"
						icon="i-lucide-rotate-ccw"
						size="xl"
						@click="clearFilters"
						class="control-reset"
					>
						Сбросить фильтры
					</UButton>
				</div>

				<div class="control-panel__results control-panel__field">
					<p class="control-label">Результат</p>
					<p class="control-result">
						По заданным фильтрам найдено
						<strong>{{ filteredCameras.length }}</strong>
						{{
							filteredCameras.length === 1
								? "камера"
								: filteredCameras.length < 5
									? "камеры"
									: "камер"
						}}
					</p>
				</div>
			</section>

			<section class="camera-list-panel">
				<div class="camera-list-panel__header">
					<div>
						<p class="camera-list-panel__eyebrow">Управление оборудованием</p>
						<h2 class="camera-list-panel__title">Список камер</h2>
					</div>
					<UBadge
						color="neutral"
						variant="soft"
						class="rounded-full px-3 py-1"
					>
						{{ filteredCameras.length }} / {{ cameras.length }}
					</UBadge>
				</div>

				<div
					v-if="isLoading"
					class="camera-list"
				>
					<div
						v-for="index in 5"
						:key="`camera-skeleton-${index}`"
						class="camera-row camera-row--skeleton"
					>
						<div class="camera-row__skeleton camera-row__skeleton--title" />
						<div class="camera-row__skeleton camera-row__skeleton--meta" />
						<div class="camera-row__skeleton camera-row__skeleton--meta" />
						<div class="camera-row__skeleton camera-row__skeleton--actions" />
					</div>
				</div>

				<div
					v-else-if="filteredCameras.length === 0"
					class="cameras-empty"
				>
					<div class="cameras-empty__icon">
						<UIcon name="i-lucide-camera-off" />
					</div>
					<h3>Камеры не найдены</h3>
					<p v-if="searchQuery || statusFilter !== 'all'">
						Измените поисковый запрос или выберите другой статус.
					</p>
					<p v-else>Добавьте первую камеру, чтобы начать управление списком.</p>
				</div>

				<div
					v-else
					class="camera-list"
				>
					<article
						v-for="camera in filteredCameras"
						:key="camera.id"
						class="camera-row"
						:data-status="camera.status"
					>
						<div class="camera-row__lead">
							<div class="camera-row__preview">
								<div class="camera-row__scanline" />
								<span class="camera-row__preview-label">LIVE</span>
							</div>
							<div class="camera-row__identity">
								<h3 class="camera-row__name">{{ camera.name }}</h3>
								<p class="camera-row__location">
									<UIcon name="i-lucide-map-pin" />
									{{ camera.location }}
								</p>
							</div>
						</div>

						<div class="camera-row__meta-grid">
							<div class="camera-row__meta camera-row__meta--status">
								<span class="camera-row__meta-label">Статус</span>
								<UBadge
									:color="statusBadgeColor(camera.status)"
									variant="soft"
									class="camera-row__status-badge rounded-full px-3 py-1"
								>
									<UIcon :name="statusMeta[camera.status].icon" />
									{{ statusMeta[camera.status].label }}
								</UBadge>
							</div>
							<div class="camera-row__meta">
								<span class="camera-row__meta-label">Последняя активность</span>
								<strong>{{ formatDate(camera.lastSeenAt) }}</strong>
							</div>
							<div class="camera-row__meta">
								<span class="camera-row__meta-label">Создана</span>
								<strong>{{ formatCreatedDate(camera.createdAt) }}</strong>
							</div>
							<div class="camera-row__meta">
								<span class="camera-row__meta-label">Поток</span>
								<strong class="camera-row__url">{{ camera.url }}</strong>
							</div>
						</div>

						<div class="camera-row__actions">
							<UButton
								color="neutral"
								variant="outline"
								icon="i-lucide-settings-2"
								@click="openManageModal(camera)"
							>
								Управление
							</UButton>
							<UButton
								color="neutral"
								variant="ghost"
								icon="i-lucide-pencil-line"
								@click="openEditModal(camera)"
							/>
							<UButton
								color="error"
								variant="ghost"
								icon="i-lucide-trash-2"
								@click="openDeleteModal(camera)"
							/>
						</div>
					</article>
				</div>
			</section>
		</UContainer>

		<UModal
			:open="isManageModalOpen"
			:content="{ class: 'sm:max-w-2xl' }"
			@update:open="isManageModalOpen = $event"
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
								<UIcon name="i-lucide-settings-2" />
							</div>
							<div class="modal-header__copy">
								<h3 class="modal-title">Управление камерой</h3>
								<p class="modal-subtitle">{{ selectedCamera?.name }}</p>
							</div>
							<UButton
								color="neutral"
								variant="ghost"
								icon="i-lucide-x"
								size="sm"
								@click="closeAllModals"
							/>
						</div>
					</template>

					<div
						v-if="selectedCamera"
						class="manage-modal"
					>
						<div class="manage-modal__hero">
							<div
								class="manage-modal__preview"
								:data-status="selectedCamera.status"
							>
								<div class="camera-row__scanline" />
								<div class="manage-modal__overlay">
									<span>{{ selectedCamera.location }}</span>
									<span>{{ formatDate(selectedCamera.lastSeenAt) }}</span>
								</div>
							</div>

							<div class="manage-modal__summary">
								<UBadge
									:color="statusBadgeColor(selectedCamera.status)"
									variant="soft"
									class="w-fit rounded-full px-3 py-1"
								>
									<UIcon :name="statusMeta[selectedCamera.status].icon" />
									{{ statusMeta[selectedCamera.status].label }}
								</UBadge>
								<div class="manage-modal__facts">
									<div>
										<span>Локация</span>
										<strong>{{ selectedCamera.location }}</strong>
									</div>
									<div>
										<span>URL потока</span>
										<strong>{{ selectedCamera.url }}</strong>
									</div>
									<div>
										<span>Дата добавления</span>
										<strong>{{
											formatCreatedDate(selectedCamera.createdAt)
										}}</strong>
									</div>
								</div>
							</div>
						</div>
					</div>

					<template #footer>
						<div class="modal-actions modal-actions--between">
							<UButton
								color="error"
								variant="outline"
								icon="i-lucide-trash-2"
								@click="selectedCamera && openDeleteModal(selectedCamera)"
							>
								Удалить
							</UButton>
							<div class="modal-actions">
								<UButton
									color="neutral"
									variant="outline"
									size="lg"
									@click="closeAllModals"
								>
									Закрыть
								</UButton>
								<UButton
									color="primary"
									size="lg"
									icon="i-lucide-pencil-line"
									@click="selectedCamera && openEditModal(selectedCamera)"
								>
									Редактировать
								</UButton>
							</div>
						</div>
					</template>
				</UCard>
			</template>
		</UModal>

		<UModal
			:open="isCreateModalOpen"
			:content="{ class: 'sm:max-w-xl' }"
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
								<p class="modal-subtitle"
									>Подключите новый поток в единый список камер</p
								>
							</div>
							<UButton
								color="neutral"
								variant="ghost"
								icon="i-lucide-x"
								size="sm"
								@click="closeAllModals"
							/>
						</div>
					</template>

					<form
						class="modal-form"
						@submit.prevent="createCamera"
					>
						<div class="form-field">
							<label class="form-label">Название камеры</label>
							<UInput
								v-model="createForm.name"
								variant="subtle"
								class="w-full"
								placeholder="Например: Северный вход"
								size="lg"
								required
							/>
						</div>

						<div class="form-field">
							<label class="form-label">Расположение</label>
							<UInput
								v-model="createForm.location"
								variant="subtle"
								class="w-full"
								placeholder="Например: Склад готовой продукции"
								size="lg"
								required
							/>
						</div>

						<div class="form-field">
							<label class="form-label">RTSP / HTTP URL</label>
							<UInput
								v-model="createForm.url"
								variant="subtle"
								class="w-full"
								placeholder="rtsp://192.168.1.100:554/stream"
								size="lg"
								required
							/>
							<p class="form-hint"
								>Используйте рабочий адрес потока для подключения камеры.</p
							>
						</div>
					</form>

					<template #footer>
						<div class="modal-actions">
							<UButton
								color="neutral"
								variant="outline"
								size="lg"
								@click="closeAllModals"
							>
								Отмена
							</UButton>
							<UButton
								color="primary"
								size="lg"
								:loading="isSubmitting"
								class="modal-submit-button"
								@click="createCamera"
							>
								Добавить камеру
							</UButton>
						</div>
					</template>
				</UCard>
			</template>
		</UModal>

		<UModal
			:open="isEditModalOpen"
			:content="{ class: 'sm:max-w-xl' }"
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
								<p class="modal-subtitle">{{ selectedCamera?.name }}</p>
							</div>
							<UButton
								color="neutral"
								variant="ghost"
								icon="i-lucide-x"
								size="sm"
								@click="closeAllModals"
							/>
						</div>
					</template>

					<form
						class="modal-form"
						@submit.prevent="updateCamera"
					>
						<div class="form-field">
							<label class="form-label">Название камеры</label>
							<UInput
								v-model="editForm.name"
								variant="subtle"
								class="w-full"
								size="lg"
								required
							/>
						</div>

						<div class="form-field">
							<label class="form-label">Расположение</label>
							<UInput
								v-model="editForm.location"
								variant="subtle"
								class="w-full"
								size="lg"
								required
							/>
						</div>

						<div class="form-field">
							<label class="form-label">RTSP / HTTP URL</label>
							<UInput
								v-model="editForm.url"
								variant="subtle"
								class="w-full"
								size="lg"
								required
							/>
							<p class="form-hint"
								>Обновленный адрес потока будет использоваться после сохранения.</p
							>
						</div>
					</form>

					<template #footer>
						<div class="modal-actions">
							<UButton
								color="neutral"
								variant="outline"
								size="lg"
								@click="selectedCamera && openManageModal(selectedCamera)"
							>
								Назад
							</UButton>
							<UButton
								color="primary"
								size="lg"
								:loading="isSubmitting"
								class="modal-submit-button"
								@click="updateCamera"
							>
								Сохранить изменения
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
				<UCard
					:ui="{
						body: { padding: 'p-0' },
						header: { padding: 'p-5' },
						footer: { padding: 'p-5' },
					}"
				>
					<template #header>
						<div class="modal-header modal-header--danger">
							<div class="modal-header__icon">
								<UIcon name="i-lucide-alert-triangle" />
							</div>
							<div class="modal-header__copy">
								<h3 class="modal-title">Удаление камеры</h3>
								<p class="modal-subtitle">Действие нельзя отменить</p>
							</div>
						</div>
					</template>

					<div class="delete-confirm">
						<p>
							Вы действительно хотите удалить камеру
							<strong>{{ selectedCamera?.name }}</strong
							>?
						</p>
						<p class="delete-confirm__warning">
							Поток исчезнет из списка, а связанные данные мониторинга будут удалены.
						</p>
					</div>

					<template #footer>
						<div class="modal-actions">
							<UButton
								color="neutral"
								variant="outline"
								size="lg"
								@click="selectedCamera && openManageModal(selectedCamera)"
							>
								Назад
							</UButton>
							<UButton
								color="error"
								size="lg"
								:loading="isSubmitting"
								class="modal-submit-button modal-submit-button--danger"
								@click="deleteCamera"
							>
								Удалить
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
.stat-card,
.camera-row,
.camera-row--skeleton,
.manage-modal__preview {
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
.cameras-hero__actions {
	display: grid;
	gap: 0.9rem;
}

.cameras-hero__actions {
	width: min(100%, 31rem);
	justify-items: stretch;
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
.camera-row__name,
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
.camera-row__meta-label,
.form-hint,
.modal-subtitle {
	color: rgba(203, 213, 225, 0.68);
}

.cameras-subtitle {
	max-width: 48rem;
	margin: 0.5rem 0 0;
	line-height: 1.6;
}

.hero-summary {
	display: grid;
	padding: 0.85rem 1rem;
	border-radius: 1.25rem;
	border: 1px solid rgba(255, 255, 255, 0.06);
	background: rgba(15, 23, 42, 0.64);
}

.hero-summary-grid {
	display: grid;
	grid-template-columns: repeat(2, minmax(0, 1fr));
	gap: 0.75rem;
}

.hero-summary__value {
	font-size: 1.7rem;
	font-weight: 700;
	line-height: 1;
	color: #f8fafc;
}

.hero-summary__label {
	margin-top: 0.35rem;
	font-size: 0.82rem;
	color: rgba(203, 213, 225, 0.72);
}

.cameras-add-btn {
	width: 100%;
	justify-content: center;
	box-shadow: 0 12px 28px rgba(37, 99, 235, 0.3);
}

.cameras-stats {
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
	gap: 0.75rem;
}

.stat-card {
	display: flex;
	align-items: center;
	gap: 0.85rem;
	padding: 1rem;
	border-radius: 1.4rem;
	text-align: left;
	transition:
		transform 0.2s ease,
		border-color 0.2s ease;
}

.stat-card:hover,
.stat-card[data-active="true"] {
	transform: translateY(-2px);
	border-color: rgba(148, 163, 184, 0.28);
}

.stat-card__icon {
	display: grid;
	place-items: center;
	width: 2.7rem;
	height: 2.7rem;
	border-radius: 1rem;
	background: rgba(15, 23, 42, 0.78);
	color: #f8fafc;
	font-size: 1.1rem;
}

.stat-card__label,
.camera-list-panel__eyebrow,
.control-label {
	font-size: 0.75rem;
	text-transform: uppercase;
	letter-spacing: 0.12em;
}

.stat-card__label {
	display: block;
	margin-bottom: 0.3rem;
	color: rgba(203, 213, 225, 0.62);
}

.stat-card__value {
	font-size: 1.6rem;
	font-weight: 700;
	color: #f8fafc;
}

.stat-card[data-status="normal"][data-active="true"] {
	border-color: rgba(34, 197, 94, 0.34);
}

.stat-card[data-status="fire"][data-active="true"] {
	border-color: rgba(248, 113, 113, 0.34);
}

.stat-card[data-status="smoke"][data-active="true"] {
	border-color: rgba(251, 146, 60, 0.34);
}

.control-panel,
.camera-list-panel {
	display: grid;
	gap: 1rem;
	padding: 1rem 1.1rem;
	border-radius: 1.6rem;
}

.control-panel {
	grid-template-columns: minmax(16rem, 1.25fr) minmax(12rem, 0.85fr) auto;
	align-items: end;
}

.control-panel__search,
.control-panel__filters,
.control-panel__results,
.control-panel__side {
	display: grid;
	gap: 0.5rem;
	min-width: 0;
}

.control-panel__field {
	align-content: end;
}

.control-panel__results {
	grid-column: 1 / -1;
	display: flex;
	align-items: center;
	gap: 0.85rem;
	padding-top: 0.2rem;
	border-top: 1px solid rgba(255, 255, 255, 0.06);
}

.control-label--ghost {
	opacity: 0;
	pointer-events: none;
}

.control-input {
	width: 100%;
}

:deep(.control-input[data-slot="base"]),
:deep(.control-input [data-slot="base"]) {
	width: 100%;
	min-height: 3.25rem;
	border-radius: 1.15rem;
	border-color: rgba(148, 163, 184, 0.14);
	background: rgba(30, 41, 59, 0.72);
	box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.02);
}

:deep(.control-input[data-slot="base"]:focus-visible),
:deep(.control-input [data-slot="base"]:focus-within) {
	border-color: rgba(56, 189, 248, 0.32);
	box-shadow:
		0 0 0 1px rgba(56, 189, 248, 0.2),
		inset 0 1px 0 rgba(255, 255, 255, 0.03);
}

:deep(.control-input [data-slot="leading-icon"]),
:deep(.control-input [data-slot="trailing-icon"]),
:deep(.control-input[data-slot="base"] [data-slot="leading-icon"]) {
	color: rgba(148, 163, 184, 0.88);
}

:deep(.control-input [data-slot="placeholder"]),
:deep(.control-input input::placeholder) {
	color: rgba(148, 163, 184, 0.7);
}

.control-result {
	margin: 0;
	font-size: 0.98rem;
	color: rgba(226, 232, 240, 0.82);
}

.control-result strong {
	color: #f8fafc;
	font-weight: 700;
}

.control-reset {
	min-width: 11rem;
	justify-self: stretch;
	justify-content: center;
}

.camera-list-panel__header,
.camera-row,
.camera-row__lead,
.camera-row__actions,
.modal-header,
.modal-actions,
.modal-actions--between,
.manage-modal__overlay {
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
	gap: 0.8rem;
}

.camera-row {
	flex-wrap: wrap;
	padding: 0.9rem;
	border-radius: 1.35rem;
}

.camera-row[data-status="fire"] {
	border-color: rgba(248, 113, 113, 0.24);
}

.camera-row[data-status="smoke"] {
	border-color: rgba(251, 146, 60, 0.24);
}

.camera-row[data-status="normal"] {
	border-color: rgba(34, 197, 94, 0.2);
}

.camera-row__lead {
	flex: 1 1 280px;
	justify-content: flex-start;
}

.camera-row__preview,
.manage-modal__preview {
	position: relative;
	overflow: hidden;
	width: 8.25rem;
	min-width: 8.25rem;
	height: 5.5rem;
	border-radius: 1rem;
	background:
		radial-gradient(circle at 12% 18%, rgba(56, 189, 248, 0.2), transparent 0 26%),
		radial-gradient(circle at 84% 20%, rgba(248, 113, 113, 0.18), transparent 0 24%),
		linear-gradient(180deg, rgba(30, 41, 59, 0.96), rgba(15, 23, 42, 0.96));
}

.manage-modal__preview {
	width: 100%;
	height: 10.5rem;
}

.camera-row__scanline {
	position: absolute;
	inset: 0;
	background:
		linear-gradient(180deg, transparent, rgba(248, 250, 252, 0.08), transparent),
		repeating-linear-gradient(180deg, rgba(255, 255, 255, 0.02) 0 2px, transparent 2px 6px);
	animation: scanline 4.5s linear infinite;
}

.camera-row__preview-label {
	position: absolute;
	top: 0.65rem;
	left: 0.65rem;
	padding: 0.25rem 0.45rem;
	border-radius: 999px;
	background: rgba(15, 23, 42, 0.82);
	font-size: 0.7rem;
	letter-spacing: 0.12em;
	color: #f8fafc;
}

.camera-row__identity {
	display: grid;
	gap: 0.45rem;
	min-width: 0;
}

.camera-row__name {
	font-size: 1.02rem;
	font-weight: 600;
}

.camera-row__location {
	display: inline-flex;
	align-items: center;
	gap: 0.45rem;
	margin: 0;
	color: rgba(226, 232, 240, 0.78);
}

.camera-row__meta-grid {
	display: grid;
	flex: 1 1 320px;
	grid-template-columns: minmax(8.5rem, 0.7fr) repeat(3, minmax(0, 1fr));
	gap: 0.7rem;
}

.camera-row__meta {
	display: grid;
	gap: 0.3rem;
	padding: 0.8rem 0.9rem;
	border-radius: 1rem;
	background: rgba(15, 23, 42, 0.6);
}

.camera-row__meta-label {
	font-size: 0.72rem;
	text-transform: uppercase;
	letter-spacing: 0.08em;
}

.camera-row__meta--status {
	align-content: center;
}

.camera-row__status-badge {
	width: fit-content;
}

.camera-row__meta strong,
.manage-modal__facts strong,
.delete-confirm strong {
	color: #f8fafc;
}

.camera-row__url,
.manage-modal__facts strong {
	overflow-wrap: anywhere;
}

.camera-row__actions {
	flex: 0 0 auto;
}

.camera-row--skeleton {
	display: grid;
	grid-template-columns: minmax(0, 1.1fr) repeat(2, minmax(120px, 0.6fr)) 120px;
	gap: 0.8rem;
}

.camera-row__skeleton {
	position: relative;
	overflow: hidden;
	min-height: 4rem;
	border-radius: 1rem;
	background: rgba(51, 65, 85, 0.38);
}

.camera-row__skeleton::after {
	content: "";
	position: absolute;
	inset: 0;
	transform: translateX(-100%);
	background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.08), transparent);
	animation: shimmer 1.4s infinite;
}

.camera-row__skeleton--title {
	min-height: 5rem;
}

.camera-row__skeleton--actions {
	min-height: 4rem;
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
.delete-confirm p,
.manage-modal__facts span,
.form-label {
	margin: 0;
}

.cameras-empty h3 {
	color: #f8fafc;
}

.cameras-empty p,
.delete-confirm__warning {
	margin: 0;
	color: rgba(203, 213, 225, 0.68);
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

.modal-header--danger .modal-header__icon {
	background: rgba(239, 68, 68, 0.18);
	color: #fca5a5;
}

.modal-header__copy,
.manage-modal,
.manage-modal__summary,
.manage-modal__facts,
.modal-form,
.form-field,
.delete-confirm {
	display: grid;
	gap: 0.85rem;
}

.modal-header__copy {
	flex: 1;
}

.modal-title {
	font-size: 1.15rem;
	font-weight: 600;
}

.modal-subtitle {
	margin: 0;
	font-size: 0.9rem;
}

.manage-modal__hero {
	display: grid;
	grid-template-columns: minmax(0, 1.05fr) minmax(0, 0.95fr);
	align-items: start;
	gap: 1rem;
	padding: 0 1.25rem 1rem;
}

.manage-modal__overlay {
	position: absolute;
	inset: auto 0 0 0;
	padding: 0.85rem 1rem;
	background: linear-gradient(180deg, transparent, rgba(15, 23, 42, 0.94));
	color: rgba(248, 250, 252, 0.82);
	font-size: 0.82rem;
}

.manage-modal__facts {
	padding: 1rem;
	border-radius: 1.2rem;
	background: rgba(15, 23, 42, 0.58);
}

.manage-modal__facts div {
	display: grid;
	gap: 0.35rem;
}

.manage-modal__facts span {
	font-size: 0.75rem;
	text-transform: uppercase;
	letter-spacing: 0.08em;
	color: rgba(203, 213, 225, 0.6);
}

.modal-form {
	padding: 0 1.25rem 1.25rem;
}

.form-field {
	gap: 0.45rem;
}

.form-label {
	font-size: 0.88rem;
	color: rgba(226, 232, 240, 0.82);
}

.form-hint {
	font-size: 0.76rem;
}

.modal-submit-button {
	min-width: 13.5rem;
	justify-content: center;
}

.modal-submit-button--danger {
	min-width: 10rem;
}

.modal-actions {
	flex-wrap: wrap;
	justify-content: flex-end;
}

.modal-actions--between {
	width: 100%;
}

.delete-confirm {
	padding: 0 1.25rem 1.1rem;
}

.delete-confirm p {
	line-height: 1.6;
}

.delete-confirm strong {
	color: #fca5a5;
}

@keyframes scanline {
	0% {
		transform: translateY(-100%);
	}

	100% {
		transform: translateY(100%);
	}
}

@keyframes shimmer {
	100% {
		transform: translateX(100%);
	}
}

@media (max-width: 1100px) {
	.control-panel {
		grid-template-columns: minmax(0, 1fr);
	}

	.camera-row__meta-grid {
		grid-template-columns: repeat(2, minmax(0, 1fr));
	}
}

@media (max-width: 820px) {
	.cameras-hero {
		align-items: stretch;
	}

	.hero-summary-grid {
		grid-template-columns: minmax(0, 1fr);
	}

	.manage-modal__hero {
		grid-template-columns: minmax(0, 1fr);
	}

	.camera-row__lead,
	.camera-row__actions {
		width: 100%;
	}

	.camera-row__actions {
		justify-content: flex-end;
	}

	.camera-row__meta-grid {
		grid-template-columns: minmax(0, 1fr);
	}

	.control-panel__results {
		flex-direction: column;
		align-items: flex-start;
	}
}

@media (max-width: 640px) {
	.cameras-page {
		padding-top: 0.7rem;
	}

	.cameras-hero,
	.control-panel,
	.camera-list-panel,
	.camera-row {
		padding: 0.85rem;
	}

	.cameras-hero__actions {
		width: 100%;
	}

	.camera-row__lead {
		flex-direction: column;
		align-items: stretch;
	}

	.camera-row__preview {
		width: 100%;
		min-width: 0;
		height: 7rem;
	}

	.camera-row__name-wrap,
	.modal-header,
	.modal-actions,
	.modal-actions--between {
		flex-direction: column;
		align-items: stretch;
	}

	.camera-row__actions {
		justify-content: stretch;
	}

	.control-label--ghost {
		display: none;
	}
}
</style>
