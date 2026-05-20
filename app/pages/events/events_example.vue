<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import {
	useDashboardStore,
	type DetectionEvent,
	type EventStatus,
	type EventType,
} from "~/entities/dashboard/model/dashboard.store";

interface DetectionBox {
	id: string;
	label: string;
	x: number;
	y: number;
	width: number;
	height: number;
	confidence: number;
}

interface EventCard extends DetectionEvent {
	cameraId: string | null;
	cameraLocation: string;
	temperature: number | null;
	smokeDensity: number | null;
	detections: DetectionBox[];
}

const dashboardStore = useDashboardStore();

const selectedType = ref<"all" | EventType>("all");
const selectedCamera = ref("all");
const selectedDate = ref("");
const selectedEvent = ref<EventCard | null>(null);

const typeMeta = {
	fire: {
		label: "Огонь",
		icon: "i-lucide-flame",
		badge: "error",
		colorClass:
			"text-red-500 bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-900/50",
		activeClass: "ring-2 ring-red-500 bg-red-50 dark:bg-red-950/20",
	},
	smoke: {
		label: "Дым",
		icon: "i-lucide-cloud",
		badge: "warning",
		colorClass:
			"text-amber-500 bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900/50",
		activeClass: "ring-2 ring-amber-500 bg-amber-50 dark:bg-amber-950/20",
	},
} as const;

const statusMeta: Record<EventStatus, string> = {
	new: "Новая тревога",
	investigating: "В работе",
	acknowledged: "Подтверждено",
};

const enrichedEvents = computed<EventCard[]>(() =>
	dashboardStore.events.map((event) => {
		const camera = dashboardStore.cameras.find((item) => item.name === event.cameraName);

		return {
			...event,
			cameraId: camera?.id ?? null,
			cameraLocation: camera?.location ?? "Локация не указана",
			temperature: camera?.temperature ?? null,
			smokeDensity: camera?.smokeDensity ?? null,
			detections: buildDetections(event),
		};
	}),
);

const cameraOptions = computed(() => [
	{ label: "Все камеры", value: "all" },
	...Array.from(new Set(enrichedEvents.value.map((event) => event.cameraName))).map(
		(cameraName) => ({
			label: cameraName,
			value: cameraName,
		}),
	),
]);

const filteredEvents = computed(() =>
	enrichedEvents.value.filter((event) => {
		if (selectedType.value !== "all" && event.type !== selectedType.value) {
			return false;
		}

		if (selectedCamera.value !== "all" && event.cameraName !== selectedCamera.value) {
			return false;
		}

		if (selectedDate.value && toDateInputValue(event.timestamp) !== selectedDate.value) {
			return false;
		}

		return true;
	}),
);

const summary = computed(() => ({
	all: enrichedEvents.value.length,
	fire: enrichedEvents.value.filter((event) => event.type === "fire").length,
	smoke: enrichedEvents.value.filter((event) => event.type === "smoke").length,
	cameras: new Set(enrichedEvents.value.map((event) => event.cameraName)).size,
}));

function clearFilters() {
	selectedType.value = "all";
	selectedCamera.value = "all";
	selectedDate.value = "";
}

function openEventDetails(event: EventCard) {
	selectedEvent.value = event;
}

function closeEventDetails() {
	selectedEvent.value = null;
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

function formatDay(value: string) {
	return new Intl.DateTimeFormat("ru-RU", {
		day: "2-digit",
		month: "long",
		year: "numeric",
	}).format(new Date(value));
}

function toDateInputValue(value: string) {
	const date = new Date(value);
	const year = date.getFullYear();
	const month = String(date.getMonth() + 1).padStart(2, "0");
	const day = String(date.getDate()).padStart(2, "0");
	return `${year}-${month}-${day}`;
}

function formatPercent(value: number) {
	return `${Math.round(value * 100)}%`;
}

function formatBoxValue(value: number) {
	return `${Math.round(value)}%`;
}

function buildDetections(event: DetectionEvent): DetectionBox[] {
	const seed = hashString(event.id);
	const boxCount = event.type === "fire" ? 2 : 1;

	return Array.from({ length: boxCount }, (_, index) => {
		const offset = seed + index * 37;
		const width = 18 + (offset % 14);
		const height = 16 + ((offset >> 3) % 18);
		const x = 8 + ((offset >> 2) % Math.max(34, 84 - width));
		const y = 10 + ((offset >> 5) % Math.max(28, 80 - height));

		return {
			id: `${event.id}-${index}`,
			label: event.type === "fire" ? `Очаг ${index + 1}` : `Шлейф ${index + 1}`,
			x,
			y,
			width,
			height,
			confidence: Number(Math.max(0.58, event.confidence - index * 0.06).toFixed(2)),
		};
	});
}

function hashString(value: string) {
	return Array.from(value).reduce(
		(total, char, index) => total + char.charCodeAt(0) * (index + 1),
		0,
	);
}

useSeoMeta({
	title: "YOLO FireWatch Lab | Журнал событий",
	description: "Журнал событий детекции огня и дыма с фильтрами и просмотром метаданных.",
});

onMounted(() => {
	dashboardStore.initialize();
});

onBeforeUnmount(() => {
	dashboardStore.dispose();
});
</script>

<template>
	<main class="w-full min-h-screen bg-neutral-50 dark:bg-neutral-900 py-6 sm:py-8">
		<UContainer class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
			<!-- Hero Header -->
			<header
				class="flex flex-col md:flex-row md:items-center md:justify-between gap-6 pb-6 border-b border-neutral-200 dark:border-neutral-800"
			>
				<div class="space-y-3 max-w-3xl">
					<div
						class="inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-xs font-medium bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400"
					>
						<UIcon
							name="i-lucide-history"
							class="w-3.5 h-3.5"
						/>
						<span>Архив тревожных детекций</span>
					</div>
					<div>
						<h1
							class="text-3xl font-bold tracking-tight text-neutral-900 dark:text-white sm:text-4xl"
							>События</h1
						>
						<p
							class="mt-2 text-sm sm:text-base text-neutral-500 dark:text-neutral-400 leading-relaxed"
						>
							Журнал срабатываний по огню и дыму. Отфильтруйте поток по типу, камере и
							дате, затем откройте карточку для просмотра меток и детальных метаданных
							распознавания.
						</p>
					</div>
				</div>

				<div
					class="flex sm:items-center gap-4 sm:gap-6 bg-white dark:bg-neutral-800 p-4 rounded-xl border border-neutral-200 dark:border-neutral-700 shadow-sm self-start md:self-auto"
				>
					<div class="flex flex-col">
						<span
							class="text-2xl font-semibold text-neutral-900 dark:text-white tracking-tight"
							>{{ summary.all }}</span
						>
						<span class="text-xs text-neutral-400">событий в журнале</span>
					</div>
					<div class="h-8 w-px bg-neutral-200 dark:bg-neutral-700" />
					<div class="flex flex-col">
						<span
							class="text-2xl font-semibold text-neutral-900 dark:text-white tracking-tight"
							>{{ summary.cameras }}</span
						>
						<span class="text-xs text-neutral-400">камер в выборке</span>
					</div>
				</div>
			</header>

			<!-- Quick Stats Filter Buttons -->
			<section class="grid grid-cols-1 sm:grid-cols-3 gap-4">
				<button
					type="button"
					class="flex items-center gap-4 p-4 rounded-xl border text-left transition-all duration-200"
					:class="
						selectedType === 'all'
							? 'bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 border-neutral-900 dark:border-white shadow-md'
							: 'bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white border-neutral-200 dark:border-neutral-700 hover:border-neutral-300 dark:hover:border-neutral-600'
					"
					@click="selectedType = 'all'"
				>
					<div
						class="p-2.5 rounded-lg bg-neutral-100 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-300"
						:class="{
							'bg-neutral-800 text-white dark:bg-neutral-100 dark:text-neutral-900':
								selectedType === 'all',
						}"
					>
						<UIcon
							name="i-lucide-list-filter"
							class="w-5 h-5 block"
						/>
					</div>
					<div>
						<span class="block text-xs font-medium opacity-80 uppercase tracking-wider"
							>Все</span
						>
						<span class="text-xl font-bold tracking-tight">{{ summary.all }}</span>
					</div>
				</button>

				<button
					v-for="type in ['fire', 'smoke'] as const"
					:key="type"
					type="button"
					class="flex items-center gap-4 p-4 rounded-xl border text-left transition-all duration-200"
					:class="[
						selectedType === type
							? typeMeta[type].activeClass
							: 'bg-white dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700 hover:border-neutral-300 dark:hover:border-neutral-600',
						selectedType === type ? 'border-transparent shadow-sm' : '',
					]"
					@click="selectedType = type"
				>
					<div
						class="p-2.5 rounded-lg transition-colors"
						:class="typeMeta[type].colorClass"
					>
						<UIcon
							:name="typeMeta[type].icon"
							class="w-5 h-5 block"
						/>
					</div>
					<div>
						<span
							class="block text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider"
							>{{ typeMeta[type].label }}</span
						>
						<span
							class="text-xl font-bold text-neutral-900 dark:text-white tracking-tight"
							>{{ summary[type] }}</span
						>
					</div>
				</button>
			</section>

			<!-- Controls / Filters -->
			<section
				class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end bg-white dark:bg-neutral-800 p-5 rounded-xl border border-neutral-200 dark:border-neutral-700 shadow-sm"
			>
				<div class="space-y-1.5 w-full">
					<label
						class="text-xs font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider"
						>Тип события</label
					>
					<USelect
						v-model="selectedType"
						:items="[
							{ label: 'Все типы', value: 'all' },
							{ label: 'Огонь', value: 'fire' },
							{ label: 'Дым', value: 'smoke' },
						]"
						value-key="value"
						label-key="label"
						size="md"
						variant="subtle"
						leading-icon="i-lucide-flame-kindling"
						class="w-full"
					/>
				</div>

				<div class="space-y-1.5 w-full">
					<label
						class="text-xs font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider"
						>Камера</label
					>
					<USelect
						v-model="selectedCamera"
						:items="cameraOptions"
						value-key="value"
						label-key="label"
						size="md"
						variant="subtle"
						leading-icon="i-lucide-cctv"
						class="w-full"
					/>
				</div>

				<div class="space-y-1.5 w-full">
					<label
						class="text-xs font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider"
						>Дата</label
					>
					<UInput
						v-model="selectedDate"
						type="date"
						size="md"
						variant="subtle"
						icon="i-lucide-calendar-days"
						class="w-full"
					/>
				</div>

				<div class="flex items-center justify-between gap-4 w-full">
					<UButton
						color="neutral"
						variant="outline"
						size="md"
						icon="i-lucide-rotate-ccw"
						class="w-full justify-center"
						@click="clearFilters"
					>
						Сбросить
					</UButton>
					<div class="text-right min-w-[100px] hidden sm:block">
						<span
							class="block text-[10px] uppercase font-bold tracking-wider text-neutral-400"
							>Найдено</span
						>
						<span class="text-sm font-medium text-neutral-700 dark:text-neutral-300"
							><strong>{{ filteredEvents.length }}</strong> из {{ summary.all }}</span
						>
					</div>
				</div>
			</section>

			<!-- Main Panel Content -->
			<section class="space-y-4">
				<div
					class="flex items-center justify-between border-b border-neutral-200 dark:border-neutral-800 pb-3"
				>
					<div>
						<span class="text-xs font-bold text-primary-500 uppercase tracking-widest"
							>Поток тревог</span
						>
						<h2
							class="text-xl font-bold text-neutral-900 dark:text-white tracking-tight"
							>Карточки событий</h2
						>
					</div>
					<UBadge
						color="neutral"
						variant="soft"
						class="rounded-full font-semibold px-3 py-1"
					>
						{{ filteredEvents.length }} / {{ summary.all }}
					</UBadge>
				</div>

				<!-- Loading State (Skeletons) -->
				<div
					v-if="dashboardStore.isLoading"
					class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
				>
					<div
						v-for="index in 6"
						:key="`event-skeleton-${index}`"
						class="h-80 w-full animate-pulse rounded-xl bg-neutral-200 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700"
					/>
				</div>

				<!-- Empty State -->
				<div
					v-else-if="filteredEvents.length === 0"
					class="flex flex-col items-center justify-center text-center p-12 bg-white dark:bg-neutral-800 border border-dashed border-neutral-300 dark:border-neutral-700 rounded-xl space-y-3"
				>
					<div
						class="p-4 bg-neutral-100 dark:bg-neutral-700 rounded-full text-neutral-400 dark:text-neutral-500"
					>
						<UIcon
							name="i-lucide-search-x"
							class="w-8 h-8 block"
						/>
					</div>
					<h3 class="text-lg font-semibold text-neutral-900 dark:text-white"
						>Совпадений не найдено</h3
					>
					<p class="text-sm text-neutral-500 dark:text-neutral-400 max-w-sm"
						>Попробуйте изменить тип события, камеру или дату в фильтрах.</p
					>
				</div>

				<!-- Events Grid List -->
				<div
					v-else
					class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
				>
					<button
						v-for="event in filteredEvents"
						:key="event.id"
						type="button"
						class="flex flex-col text-left bg-white dark:bg-neutral-800 rounded-xl border transition-all duration-300 overflow-hidden group shadow-sm hover:shadow-md"
						:class="
							event.type === 'fire'
								? 'border-neutral-200 dark:border-neutral-700 hover:border-red-300 dark:hover:border-red-900'
								: 'border-neutral-200 dark:border-neutral-700 hover:border-amber-300 dark:hover:border-amber-900'
						"
						@click="openEventDetails(event)"
					>
						<!-- Card Preview Box Overlay -->
						<div
							class="relative aspect-video w-full bg-neutral-900 overflow-hidden flex items-center justify-center"
						>
							<!-- Simulated Cam Scanline -->
							<div
								class="absolute inset-0 pointer-events-none bg-gradient-to-b from-white/5 via-transparent to-black/20 z-10"
							/>

							<!-- Bounding Boxes Generator -->
							<div
								v-for="detection in event.detections"
								:key="detection.id"
								class="absolute border-2 font-mono text-[10px] font-bold px-1 py-0.5 rounded shadow-sm text-white flex flex-col justify-between"
								:class="
									event.type === 'fire'
										? 'border-red-500 bg-red-500/20'
										: 'border-amber-500 bg-amber-500/20'
								"
								:style="{
									left: `${detection.x}%`,
									top: `${detection.y}%`,
									width: `${detection.width}%`,
									height: `${detection.height}%`,
								}"
							>
								<span
									class="bg-black/60 backdrop-blur-[2px] rounded px-1 py-0.2 w-max text-[9px]"
									>{{ detection.label }}</span
								>
							</div>

							<!-- Image Info Overlay Banner -->
							<div
								class="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-3 flex items-end justify-between text-white text-xs font-medium z-10"
							>
								<span class="truncate max-w-[60%]"
									><UIcon
										name="i-lucide-map-pin"
										class="inline w-3 h-3 mr-1"
									/>{{ event.cameraLocation }}</span
								>
								<span class="tabular-nums opacity-90 text-[11px]">{{
									formatDateTime(event.timestamp)
								}}</span>
							</div>
						</div>

						<!-- Card Meta Context -->
						<div class="p-4 flex-1 flex flex-col justify-between space-y-4">
							<div class="flex items-start justify-between gap-2">
								<div class="truncate">
									<p
										class="text-xs font-bold uppercase tracking-wider"
										:class="
											event.type === 'fire'
												? 'text-red-500'
												: 'text-amber-500'
										"
									>
										{{ typeMeta[event.type].label }}
									</p>
									<h3
										class="text-base font-bold text-neutral-900 dark:text-white mt-0.5 truncate group-hover:text-primary-500 transition-colors"
										>{{ event.cameraName }}</h3
									>
								</div>
								<UBadge
									:color="typeMeta[event.type].badge"
									variant="soft"
									class="rounded-full px-2.5 py-0.5 font-semibold text-xs shrink-0"
								>
									<UIcon
										:name="typeMeta[event.type].icon"
										class="w-3.5 h-3.5 mr-1"
									/>
									{{ formatPercent(event.confidence) }}
								</UBadge>
							</div>

							<div
								class="grid grid-cols-3 gap-2 pt-3 border-t border-neutral-100 dark:border-neutral-700/50 text-xs"
							>
								<div class="flex flex-col">
									<span
										class="text-neutral-400 text-[10px] uppercase font-semibold"
										>Статус</span
									>
									<strong
										class="text-neutral-700 dark:text-neutral-300 font-medium truncate mt-0.5"
										>{{ statusMeta[event.status] }}</strong
									>
								</div>
								<div class="flex flex-col">
									<span
										class="text-neutral-400 text-[10px] uppercase font-semibold"
										>Дата</span
									>
									<strong
										class="text-neutral-700 dark:text-neutral-300 font-medium truncate mt-0.5"
										>{{ formatDay(event.timestamp) }}</strong
									>
								</div>
								<div class="flex flex-col">
									<span
										class="text-neutral-400 text-[10px] uppercase font-semibold"
										>Метки</span
									>
									<strong
										class="text-neutral-700 dark:text-neutral-300 font-medium mt-0.5"
										><UBadge
											size="xs"
											color="neutral"
											variant="subtle"
											class="rounded"
											>{{ event.detections.length }}</UBadge
										></strong
									>
								</div>
							</div>
						</div>
					</button>
				</div>
			</section>
		</UContainer>

		<!-- Detailed View Modal Overlay -->
		<UModal
			:open="Boolean(selectedEvent)"
			:content="{ class: 'sm:max-w-4xl' }"
			@update:open="!$event && closeEventDetails()"
		>
			<template #content>
				<UCard
					:ui="{
						body: { padding: 'p-0' },
						header: { padding: 'p-5' },
						footer: { padding: 'p-4' },
					}"
					class="overflow-hidden"
				>
					<template #header>
						<div class="flex items-center justify-between gap-4">
							<div class="flex items-center gap-3">
								<div
									class="p-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300"
								>
									<UIcon
										:name="
											selectedEvent
												? typeMeta[selectedEvent.type].icon
												: 'i-lucide-flame'
										"
										class="w-6 h-6 block"
									/>
								</div>
								<div>
									<h3
										class="text-lg font-bold text-neutral-900 dark:text-white leading-tight"
									>
										{{ selectedEvent ? selectedEvent.cameraName : "Событие" }}
									</h3>
									<p
										class="text-xs text-neutral-500 dark:text-neutral-400 font-medium mt-0.5"
									>
										{{ selectedEvent ? statusMeta[selectedEvent.status] : "" }}
									</p>
								</div>
							</div>
							<UButton
								color="neutral"
								variant="ghost"
								icon="i-lucide-x"
								size="md"
								class="rounded-lg"
								@click="closeEventDetails"
							/>
						</div>
					</template>

					<!-- Modal Dashboard Body Grid Container -->
					<div
						v-if="selectedEvent"
						class="flex flex-col lg:flex-row"
					>
						<!-- Canvas Display (Left Side / Top Side) -->
						<div
							class="relative flex-1 bg-neutral-950 flex items-center justify-center aspect-video lg:aspect-auto lg:min-h-[420px]"
						>
							<div
								class="absolute inset-0 pointer-events-none bg-gradient-to-b from-white/5 via-transparent to-black/30 z-10"
							/>
							<div
								v-for="detection in selectedEvent.detections"
								:key="detection.id"
								class="absolute border-2 font-mono text-[11px] font-bold px-1.5 py-0.5 rounded shadow-md text-white"
								:class="
									selectedEvent.type === 'fire'
										? 'border-red-500 bg-red-500/20'
										: 'border-amber-500 bg-amber-500/20'
								"
								:style="{
									left: `${detection.x}%`,
									top: `${detection.y}%`,
									width: `${detection.width}%`,
									height: `${detection.height}%`,
								}"
							>
								<span
									class="bg-black/70 backdrop-blur-[2px] rounded px-1.5 py-0.5 block w-max"
									>{{ detection.label }}</span
								>
							</div>
							<div
								class="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 p-4 flex items-center justify-between text-white text-xs font-medium z-10"
							>
								<span
									><UIcon
										name="i-lucide-map-pin"
										class="inline w-3.5 h-3.5 mr-1"
									/>{{ selectedEvent.cameraLocation }}</span
								>
								<span class="tabular-nums">{{
									formatDateTime(selectedEvent.timestamp)
								}}</span>
							</div>
						</div>

						<!-- Sidebar Metadata Info Column (Right Side) -->
						<div
							class="w-full lg:w-80 border-t lg:border-t-0 lg:border-l border-neutral-200 dark:border-neutral-800 p-5 bg-neutral-50/50 dark:bg-neutral-900/30 flex flex-col justify-between space-y-6"
						>
							<div class="grid grid-cols-2 gap-4">
								<div
									class="bg-white dark:bg-neutral-800 p-3 rounded-xl border border-neutral-200 dark:border-neutral-700/60 shadow-sm"
								>
									<span
										class="block text-[10px] font-bold text-neutral-400 uppercase tracking-wider"
										>Тип</span
									>
									<strong
										class="block text-sm font-semibold text-neutral-800 dark:text-neutral-200 mt-0.5"
										>{{ typeMeta[selectedEvent.type].label }}</strong
									>
								</div>
								<div
									class="bg-white dark:bg-neutral-800 p-3 rounded-xl border border-neutral-200 dark:border-neutral-700/60 shadow-sm"
								>
									<span
										class="block text-[10px] font-bold text-neutral-400 uppercase tracking-wider"
										>Точность</span
									>
									<strong
										class="block text-sm font-semibold text-neutral-800 dark:text-neutral-200 mt-0.5"
										>{{ formatPercent(selectedEvent.confidence) }}</strong
									>
								</div>
								<div
									class="bg-white dark:bg-neutral-800 p-3 rounded-xl border border-neutral-200 dark:border-neutral-700/60 shadow-sm"
								>
									<span
										class="block text-[10px] font-bold text-neutral-400 uppercase tracking-wider"
										>Температура</span
									>
									<strong
										class="block text-sm font-semibold text-neutral-800 dark:text-neutral-200 mt-0.5 tabular-nums"
									>
										{{
											selectedEvent.temperature !== null
												? `${selectedEvent.temperature.toFixed(1)} °C`
												: "Нет данных"
										}}
									</strong>
								</div>
								<div
									class="bg-white dark:bg-neutral-800 p-3 rounded-xl border border-neutral-200 dark:border-neutral-700/60 shadow-sm"
								>
									<span
										class="block text-[10px] font-bold text-neutral-400 uppercase tracking-wider"
										>Плотность</span
									>
									<strong
										class="block text-sm font-semibold text-neutral-800 dark:text-neutral-200 mt-0.5 tabular-nums text-ellipsis overflow-hidden whitespace-nowrap"
									>
										{{
											selectedEvent.smokeDensity !== null
												? `${selectedEvent.smokeDensity.toFixed(1)} ppm`
												: "Нет данных"
										}}
									</strong>
								</div>
							</div>

							<!-- List inside modal -->
							<div class="flex-1 flex flex-col min-h-0 space-y-3">
								<div class="flex items-center justify-between">
									<div>
										<span
											class="block text-[10px] font-bold text-neutral-400 uppercase tracking-wider"
											>Координаты</span
										>
										<h4
											class="text-xs font-bold text-neutral-900 dark:text-white"
											>Метки распознавания</h4
										>
									</div>
									<UBadge
										color="neutral"
										variant="outline"
										class="rounded-full text-[11px] px-2 py-0.5 font-medium"
									>
										{{ selectedEvent.detections.length }} об.
									</UBadge>
								</div>

								<div
									class="flex-1 overflow-y-auto max-h-48 lg:max-h-none space-y-2 pr-1 custom-scrollbar"
								>
									<article
										v-for="detection in selectedEvent.detections"
										:key="detection.id"
										class="flex items-center justify-between p-2.5 rounded-lg bg-white dark:bg-neutral-800 border border-neutral-100 dark:border-neutral-700 shadow-xs"
									>
										<div class="min-w-0 flex-1 mr-2">
											<p
												class="text-xs font-semibold text-neutral-800 dark:text-neutral-200 truncate"
												>{{ detection.label }}</p
											>
											<p
												class="text-[10px] font-mono text-neutral-400 dark:text-neutral-500 mt-0.5 tabular-nums"
											>
												x:{{ formatBoxValue(detection.x) }} y:{{
													formatBoxValue(detection.y)
												}}
												w:{{ formatBoxValue(detection.width) }} h:{{
													formatBoxValue(detection.height)
												}}
											</p>
										</div>
										<UBadge
											:color="
												selectedEvent.type === 'fire' ? 'error' : 'warning'
											"
											variant="soft"
											class="rounded text-[10px] px-1.5 py-0.5 font-bold shrink-0 tabular-nums"
										>
											{{ formatPercent(detection.confidence) }}
										</UBadge>
									</article>
								</div>
							</div>
						</div>
					</div>

					<template #footer>
						<div class="flex items-center justify-end w-full">
							<UButton
								color="neutral"
								variant="outline"
								size="md"
								@click="closeEventDetails"
							>
								Закрыть окно
							</UButton>
						</div>
					</template>
				</UCard>
			</template>
		</UModal>
	</main>
</template>
