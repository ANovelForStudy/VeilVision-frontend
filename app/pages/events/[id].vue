<script setup lang="ts">
import { computed, ref, watch } from "vue";
import type { Camera } from "~/entities/camera/model/types";
import { useEventStore } from "~/entities/event/model/event.store";
import type { EventType } from "~/entities/event/model/types";
import { formatEventTypeLabel } from "~/entities/event/model/types";
import { fetchCameraById } from "~/shared/api/cameras";

const route = useRoute();
const eventStore = useEventStore();
const camera = ref<Camera | null>(null);
const pageError = ref("");

const eventId = computed(() => String(route.params.id || "").trim());
const event = computed(() => eventStore.currentEvent);
const isLoading = computed(() => eventStore.isLoadingCurrent);
const errorMessage = computed(() => pageError.value || eventStore.error);
const isNotFound = computed(() => !isLoading.value && !event.value && !errorMessage.value);

const typeMeta = {
	fire: { label: "Огонь", icon: "i-lucide-flame", badge: "error" },
	smoke: { label: "Дым", icon: "i-lucide-cloud", badge: "warning" },
	other: { label: "Прочее", icon: "i-lucide-scan-eye", badge: "neutral" },
} as const;

const eventTypeLabel = computed(() => {
	if (!event.value) {
		return "";
	}

	if (event.value.type === "other") {
		return formatEventTypeLabel(event.value.event_type);
	}

	return typeMeta[event.value.type as EventType].label;
});

async function loadPageData() {
	pageError.value = "";

	if (!eventId.value) {
		pageError.value = "Не передан идентификатор события.";
		return;
	}

	camera.value = null;
	await eventStore.loadEventById(eventId.value);

	if (!eventStore.currentEvent?.camera_id) {
		return;
	}

	try {
		camera.value = await fetchCameraById(eventStore.currentEvent.camera_id);
	} catch (error) {
		console.error("Failed to fetch camera for event details:", error);
	}
}

function formatDateTime(value: string) {
	return new Intl.DateTimeFormat("ru-RU", {
		day: "2-digit",
		month: "2-digit",
		year: "numeric",
		hour: "2-digit",
		minute: "2-digit",
		second: "2-digit",
	}).format(new Date(value));
}

function formatPercent(value: number) {
	return `${Math.round(value * 100)}%`;
}

function goBack() {
	return navigateTo("/events");
}

function openImageInNewTab() {
	if (!process.client || !event.value?.image_url) {
		return;
	}

	window.open(event.value.image_url, "_blank", "noopener,noreferrer");
}

useSeoMeta({
	title: () => (event.value ? `Событие #${event.value.id}` : "Событие"),
	description: "Подробная карточка события с полноразмерным кадром детекции.",
});

watch(eventId, loadPageData, { immediate: true });
</script>

<template>
	<main class="event-details-page">
		<UContainer class="event-details-layout max-w-none px-3 sm:px-4 lg:px-5">
			<div class="event-details-toolbar">
				<UButton
					color="neutral"
					variant="ghost"
					icon="i-lucide-arrow-left"
					size="md"
					class="font-medium text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
					@click="goBack"
				>
					Вернуться к списку событий
				</UButton>
			</div>

			<UAlert
				v-if="errorMessage"
				color="error"
				variant="subtle"
				icon="i-lucide-circle-alert"
				:title="errorMessage"
			/>

			<div
				v-if="isLoading"
				class="event-details-skeleton"
			/>

			<div
				v-else-if="isNotFound"
				class="event-details-empty"
			>
				<UIcon name="i-lucide-search-x" />
				<h2>Событие не найдено</h2>
				<p>Проверьте идентификатор или вернитесь к журналу событий.</p>
				<UButton
					color="primary"
					variant="soft"
					@click="goBack"
				>
					К списку событий
				</UButton>
			</div>

			<section
				v-else-if="event"
				class="event-details-card"
			>
				<header class="event-details-card__header">
					<div>
						<p class="event-details-card__eyebrow">Событие #{{ event.id }}</p>
						<h1>{{ camera?.name ?? `Камера ${event.camera_id.slice(0, 8)}` }}</h1>
						<p class="event-details-card__subtitle">
							{{ camera?.location ?? "Локация не указана" }} ·
							{{ formatDateTime(event.created_at) }}
						</p>
					</div>
					<UBadge
						:color="typeMeta[event.type].badge"
						variant="soft"
						class="rounded-full px-3 py-1"
					>
						<UIcon :name="typeMeta[event.type].icon" />
						{{ eventTypeLabel }}
					</UBadge>
				</header>

				<div class="event-details-card__image-wrap">
					<img
						v-if="event.image_url"
						:src="event.image_url"
						:alt="`Кадр события ${event.id}`"
						class="event-details-card__image"
					/>
					<div
						v-else
						class="event-details-card__placeholder"
					>
						<UIcon name="i-lucide-image-off" />
						<span>Изображение недоступно</span>
					</div>
				</div>

				<div class="event-details-card__actions">
					<UButton
						v-if="event.image_url"
						color="primary"
						variant="soft"
						icon="i-lucide-external-link"
						@click="openImageInNewTab"
					>
						Открыть изображение в новой вкладке
					</UButton>
				</div>

				<div class="event-details-card__grid">
					<div class="event-details-card__fact">
						<span>Тип события</span>
						<strong>{{ eventTypeLabel }}</strong>
					</div>
					<div class="event-details-card__fact">
						<span>Уверенность</span>
						<strong>{{ formatPercent(event.confidence) }}</strong>
					</div>
					<div class="event-details-card__fact">
						<span>Камера</span>
						<strong>{{ camera?.name ?? event.camera_id }}</strong>
					</div>
					<div class="event-details-card__fact">
						<span>Файл в хранилище</span>
						<strong>{{ event.storage_filename ?? "—" }}</strong>
					</div>
					<div class="event-details-card__fact event-details-card__fact--wide">
						<span>URL изображения</span>
						<strong class="event-details-card__url">{{ event.image_url ?? "—" }}</strong>
					</div>
				</div>
			</section>
		</UContainer>
	</main>
</template>

<style scoped>
.event-details-page {
	min-height: 100vh;
	padding: 0.85rem 0 1.2rem;
	background:
		radial-gradient(circle at top left, rgba(56, 189, 248, 0.14), transparent 0 22%),
		radial-gradient(circle at top right, rgba(248, 113, 113, 0.12), transparent 0 18%),
		linear-gradient(180deg, rgba(2, 6, 23, 0.98), rgba(15, 23, 42, 0.96));
}

.event-details-layout {
	display: grid;
	gap: 0.85rem;
}

.event-details-toolbar,
.event-details-card,
.event-details-skeleton,
.event-details-empty {
	border: 1px solid rgba(255, 255, 255, 0.08);
	background:
		linear-gradient(180deg, rgba(15, 23, 42, 0.88), rgba(15, 23, 42, 0.76)),
		linear-gradient(135deg, rgba(56, 189, 248, 0.08), rgba(248, 113, 113, 0.04));
	box-shadow: 0 24px 72px rgba(2, 6, 23, 0.35);
	backdrop-filter: blur(18px);
}

.event-details-toolbar {
	padding: 0.85rem 1rem;
	border-radius: 1.25rem;
}

.event-details-card {
	display: grid;
	gap: 1rem;
	padding: 1.1rem 1.2rem;
	border-radius: 1.8rem;
}

.event-details-card__header {
	display: flex;
	flex-wrap: wrap;
	align-items: start;
	justify-content: space-between;
	gap: 1rem;
}

.event-details-card__eyebrow {
	margin: 0 0 0.35rem;
	font-size: 0.75rem;
	letter-spacing: 0.12em;
	text-transform: uppercase;
	color: rgba(203, 213, 225, 0.68);
}

.event-details-card h1,
.event-details-empty h2 {
	margin: 0;
	color: #f8fafc;
	font-size: clamp(1.5rem, 3vw, 2.2rem);
	font-weight: 700;
}

.event-details-card__subtitle,
.event-details-empty p {
	margin: 0.45rem 0 0;
	color: rgba(203, 213, 225, 0.72);
	line-height: 1.5;
}

.event-details-card__image-wrap {
	position: relative;
	overflow: hidden;
	border-radius: 1.25rem;
	min-height: min(70vh, 42rem);
	background: rgba(15, 23, 42, 0.72);
}

.event-details-card__image {
	display: block;
	width: 100%;
	max-height: min(70vh, 42rem);
	object-fit: contain;
	background: rgba(2, 6, 23, 0.9);
}

.event-details-card__placeholder {
	display: grid;
	place-content: center;
	gap: 0.65rem;
	min-height: 18rem;
	color: rgba(203, 213, 225, 0.72);
}

.event-details-card__placeholder .iconify {
	font-size: 2.4rem;
}

.event-details-card__actions {
	display: flex;
	flex-wrap: wrap;
	gap: 0.65rem;
}

.event-details-card__grid {
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
	gap: 0.75rem;
}

.event-details-card__fact {
	display: grid;
	gap: 0.35rem;
	padding: 0.85rem 0.95rem;
	border-radius: 1rem;
	background: rgba(15, 23, 42, 0.6);
}

.event-details-card__fact--wide {
	grid-column: 1 / -1;
}

.event-details-card__fact span {
	font-size: 0.75rem;
	text-transform: uppercase;
	letter-spacing: 0.12em;
	color: rgba(203, 213, 225, 0.68);
}

.event-details-card__fact strong {
	color: #f8fafc;
	word-break: break-word;
}

.event-details-card__url {
	font-size: 0.9rem;
	font-weight: 500;
}

.event-details-skeleton {
	min-height: 28rem;
	border-radius: 1.8rem;
	position: relative;
	overflow: hidden;
	background: rgba(51, 65, 85, 0.38);
}

.event-details-skeleton::after {
	content: "";
	position: absolute;
	inset: 0;
	transform: translateX(-100%);
	background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.08), transparent);
	animation: shimmer 1.4s infinite;
}

.event-details-empty {
	display: grid;
	place-items: center;
	gap: 0.85rem;
	min-height: 18rem;
	padding: 2rem;
	border-radius: 1.8rem;
	text-align: center;
}

.event-details-empty .iconify {
	font-size: 2.2rem;
	color: rgba(203, 213, 225, 0.76);
}

@keyframes shimmer {
	to {
		transform: translateX(100%);
	}
}
</style>
