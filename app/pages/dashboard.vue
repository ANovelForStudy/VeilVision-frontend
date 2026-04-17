<script setup lang="ts">
import { storeToRefs } from "pinia";
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";

import {
	useDashboardStore,
	type CameraFeed,
	type DashboardMetric,
	type DetectionEvent,
	type ServerStatus,
} from "~/entities/dashboard/model/dashboard.store";
import { useSessionStore } from "~/entities/session/model/session.store";

interface SnackbarItem {
	id: string;
	title: string;
	message: string;
	tone: "fire" | "smoke" | "warning";
}

const sessionStore = useSessionStore();
const dashboardStore = useDashboardStore();

const { user } = storeToRefs(sessionStore);
const {
	activeAlertFeeds,
	connectionStatus,
	isLoading,
	latestEvents,
	metrics,
	sensors,
	visibleFeeds,
} = storeToRefs(dashboardStore);

const isHydrated = ref(false);
const selectedFeed = ref<CameraFeed | null>(null);
const snackbars = ref<SnackbarItem[]>([]);
const lastAnnouncedEventId = ref<string | null>(null);

const visibleEvents = computed(() => latestEvents.value.filter((event) => event.type === "fire"));
const visibleAlertFeeds = computed(() =>
	visibleFeeds.value.filter((feed) => feed.status === "fire"),
);
const fireAlertCount = computed(
	() => activeAlertFeeds.value.filter((feed) => feed.status === "fire").length,
);

const connectionMeta: Record<ServerStatus, { label: string; tone: "safe" | "warning" | "fire" }> = {
	connected: { label: "Подключено", tone: "safe" },
	degraded: { label: "Деградация канала", tone: "warning" },
	reconnecting: { label: "Переподключение", tone: "fire" },
};

const statusMeta = {
	normal: { label: "Норма", tone: "safe" },
	fire: { label: "Огонь", tone: "fire" },
	smoke: { label: "Дым", tone: "smoke" },
} as const;

const eventTypeMeta = {
	fire: { label: "Огонь", tone: "fire", icon: "i-lucide-flame" },
	smoke: { label: "Дым", tone: "smoke", icon: "i-lucide-cloud" },
} as const;

const eventStatusMeta = {
	new: "Новая тревога",
	investigating: "В работе",
	acknowledged: "Подтверждено",
} as const;

const metricToneClass: Record<DashboardMetric["tone"], string> = {
	neutral: "dashboard-metric--neutral",
	fire: "dashboard-metric--fire",
	smoke: "dashboard-metric--smoke",
	warning: "dashboard-metric--warning",
	safe: "dashboard-metric--safe",
};

const totalCriticalSensors = computed(
	() => sensors.value.filter((sensor) => sensor.value >= sensor.threshold).length,
);

useSeoMeta({
	title: "YOLO FireWatch Lab | Дашборд мониторинга",
	description:
		"Главная страница дашборда системы превентивного мониторинга возгораний и задымления для операторов предприятия.",
});

onMounted(() => {
	isHydrated.value = true;
	dashboardStore.initialize();
	lastAnnouncedEventId.value = latestEvents.value[0]?.id ?? null;
});

onBeforeUnmount(() => {
	dashboardStore.dispose();
});

watch(
	() => latestEvents.value[0]?.id,
	(eventId) => {
		if (!eventId || !isHydrated.value || isLoading.value) return;
		if (lastAnnouncedEventId.value === null) {
			lastAnnouncedEventId.value = eventId;
			return;
		}
		if (eventId === lastAnnouncedEventId.value) return;

		const newestEvent = latestEvents.value[0];
		if (!newestEvent) return;
		if (newestEvent.type !== "fire") {
			lastAnnouncedEventId.value = eventId;
			return;
		}

		pushSnackbar(newestEvent);
		lastAnnouncedEventId.value = eventId;
	},
);

async function handleSignOut() {
	sessionStore.signOut();
	await navigateTo("/");
}

function openFeed(camera: CameraFeed) {
	selectedFeed.value = camera;
}

function closeFeed() {
	selectedFeed.value = null;
}

function pushSnackbar(event: DetectionEvent) {
	const id = `${event.id}-toast`;
	const item: SnackbarItem = {
		id,
		title: event.type === "fire" ? "Обнаружен очаг возгорания" : "Зафиксировано задымление",
		message: `${event.cameraName} · ${formatClock(event.timestamp)} · ${Math.round(event.confidence * 100)}% уверенности`,
		tone: event.type,
	};

	snackbars.value = [...snackbars.value, item].slice(-3);

	window.setTimeout(() => {
		snackbars.value = snackbars.value.filter((entry) => entry.id !== id);
	}, 4200);
}

function formatClock(value: string) {
	return new Intl.DateTimeFormat("ru-RU", {
		hour: "2-digit",
		minute: "2-digit",
	}).format(new Date(value));
}

function formatDateTime(value: string) {
	return new Intl.DateTimeFormat("ru-RU", {
		hour: "2-digit",
		minute: "2-digit",
		second: "2-digit",
	}).format(new Date(value));
}

function formatRelativeTime(value: string) {
	const diffMinutes = Math.max(0, Math.round((Date.now() - new Date(value).getTime()) / 60_000));
	if (diffMinutes < 1) return "только что";
	if (diffMinutes < 60) return `${diffMinutes} мин назад`;
	const hours = Math.floor(diffMinutes / 60);
	return `${hours} ч назад`;
}

function sensorTone(sensor: (typeof sensors.value)[number]) {
	if (sensor.value >= sensor.threshold) return "danger";
	if (sensor.value >= sensor.threshold * 0.8) return "warning";
	return "safe";
}

function sensorToneLabel(sensor: (typeof sensors.value)[number]) {
	if (sensor.value >= sensor.threshold) return "Превышение";
	if (sensor.value >= sensor.threshold * 0.8) return "Порог близко";
	return "Норма";
}

function trendIcon(direction: DashboardMetric["trend"]["direction"]) {
	return direction === "up" ? "i-lucide-trending-up" : "i-lucide-trending-down";
}
</script>

<template>
	<main class="dashboard-page">
		<UContainer class="dashboard-layout max-w-none px-3 sm:px-4 lg:px-5">
			<header class="dashboard-topbar">
				<div class="dashboard-brand">
					<div class="dashboard-brand__badge">
						<span class="dashboard-brand__pulse" />
						<span>YOLO FireWatch Lab</span>
					</div>
					<div>
						<h1 class="dashboard-title"> Центр превентивного мониторинга </h1>
						<p class="dashboard-subtitle">
							Раннее обнаружение возгорания и задымления на основе CNN-моделей в
							реальном времени.
						</p>
					</div>
				</div>

				<div class="dashboard-session">
					<div
						class="dashboard-connection"
						:data-tone="connectionMeta[connectionStatus].tone"
					>
						<span class="dashboard-connection__dot" />
						<span>{{ connectionMeta[connectionStatus].label }}</span>
					</div>

					<div class="dashboard-user">
						<p class="dashboard-user__label order-1"> Оператор </p>
						<p class="dashboard-user__name order-2">
							{{ user?.name ?? "Дежурный оператор" }}
						</p>
						<USeparator
							orientation="vertical"
							class="h-7 px-1 order-3"
						/>
						<UButton
							color="neutral"
							variant="ghost"
							icon="i-lucide-log-out"
							class="dashboard-logout order-4"
							@click="handleSignOut"
						>
						</UButton>
					</div>
				</div>
			</header>

			<section class="dashboard-metrics">
				<template v-if="!isHydrated || isLoading">
					<div
						v-for="index in 5"
						:key="`metric-skeleton-${index}`"
						class="dashboard-skeleton dashboard-skeleton--metric"
					/>
				</template>
				<template v-else>
					<article
						v-for="metric in metrics"
						:key="metric.id"
						class="dashboard-metric"
						:class="metricToneClass[metric.tone]"
					>
						<div class="dashboard-metric__header">
							<div>
								<p class="dashboard-metric__label">
									{{ metric.label }}
								</p>
								<p class="dashboard-metric__value">
									{{ metric.value }}
								</p>
							</div>
							<div class="dashboard-metric__icon">
								<UIcon :name="metric.icon" />
							</div>
						</div>

						<div class="dashboard-metric__trend">
							<span class="dashboard-trend">
								<UIcon :name="trendIcon(metric.trend.direction)" />
								{{ metric.trend.value }}
							</span>
							<span>{{ metric.trend.context }}</span>
						</div>

						<p
							v-if="metric.detail"
							class="dashboard-metric__detail"
						>
							{{ metric.detail }}
						</p>
					</article>
				</template>
			</section>

			<section class="dashboard-zone dashboard-zone--compact">
				<div class="dashboard-panel">
					<div class="dashboard-panel__header">
						<div>
							<p class="dashboard-panel__eyebrow"> Поток событий </p>
							<h2 class="dashboard-panel__title"> Последние детекции </h2>
						</div>
						<UBadge
							color="warning"
							variant="outline"
							class="rounded-full px-3 py-1"
						>
							{{ latestEvents.length }} в очереди
						</UBadge>
					</div>

					<div
						v-if="!isHydrated || isLoading"
						class="dashboard-feed"
					>
						<div
							v-for="index in 5"
							:key="`event-skeleton-${index}`"
							class="dashboard-skeleton dashboard-skeleton--event"
						/>
					</div>
					<div
						v-else
						id="events-feed"
						class="dashboard-feed"
					>
						<article
							v-for="event in latestEvents"
							:key="event.id"
							class="event-row"
							:data-tone="event.type"
						>
							<div class="event-row__icon">
								<UIcon :name="eventTypeMeta[event.type].icon" />
							</div>
							<div class="event-row__content">
								<div class="event-row__headline">
									<strong>{{ eventTypeMeta[event.type].label }}</strong>
									<span>{{ event.cameraName }}</span>
								</div>
								<div class="event-row__meta">
									<span>{{ formatDateTime(event.timestamp) }}</span>
									<span>{{ eventStatusMeta[event.status] }}</span>
									<span>{{ Math.round(event.confidence * 100) }}%</span>
								</div>
							</div>
						</article>
					</div>

					<div class="dashboard-panel__footer justify-self-center">
						<UButton
							color="neutral"
							variant="outline"
							to="/dashboard#events-feed"
							icon="i-lucide-list"
							class="dashboard-events-button"
						>
							Все события
						</UButton>
					</div>
				</div>

				<div class="dashboard-panel">
					<div class="dashboard-panel__header">
						<div>
							<p class="dashboard-panel__eyebrow"> Видеопотоки </p>
							<h2 class="dashboard-panel__title"> Активные камеры </h2>
						</div>
						<UBadge
							color="error"
							variant="soft"
							class="rounded-full px-3 py-1"
						>
							{{ activeAlertFeeds.length }} тревожных
						</UBadge>
					</div>

					<div
						v-if="!isHydrated || isLoading"
						class="camera-grid"
					>
						<div
							v-for="index in 4"
							:key="`camera-skeleton-${index}`"
							class="dashboard-skeleton dashboard-skeleton--camera"
						/>
					</div>
					<div
						v-else-if="activeAlertFeeds.length === 0"
						class="dashboard-placeholder"
					>
						<UIcon
							name="i-lucide-camera-off"
							class="dashboard-placeholder__icon"
						/>
						<h3>Активных тревог нет</h3>
						<p
							>Потоки работают штатно. Миниатюры с тревожными статусами появятся
							автоматически при новых срабатываниях.</p
						>
					</div>
					<div
						v-else
						class="camera-grid"
					>
						<button
							v-for="feed in visibleFeeds"
							:key="feed.id"
							type="button"
							class="camera-card"
							:data-status="feed.status"
							@click="openFeed(feed)"
						>
							<div class="camera-card__viewport">
								<div class="camera-card__scanline" />
								<div class="camera-card__hud">
									<span>{{ feed.location }}</span>
									<span>{{
										formatRelativeTime(
											feed.lastEventAt ?? new Date().toISOString(),
										)
									}}</span>
								</div>
							</div>
							<div class="camera-card__footer">
								<div>
									<p class="camera-card__name">
										{{ feed.name }}
									</p>
									<p class="camera-card__status">
										{{ statusMeta[feed.status].label }}
									</p>
								</div>
								<span class="camera-card__expand">
									<UIcon name="i-lucide-expand" />
								</span>
							</div>
						</button>
					</div>
				</div>

				<div class="dashboard-panel">
					<div class="dashboard-panel__header">
						<div>
							<p class="dashboard-panel__eyebrow"> Полевые данные </p>
							<h2 class="dashboard-panel__title"> Показания датчиков </h2>
						</div>
						<UBadge
							:color="totalCriticalSensors > 0 ? 'error' : 'success'"
							variant="soft"
							class="rounded-full px-3 py-1"
						>
							{{
								totalCriticalSensors > 0
									? `${totalCriticalSensors} вне нормы`
									: "Все в норме"
							}}
						</UBadge>
					</div>

					<div
						v-if="!isHydrated || isLoading"
						class="dashboard-feed"
					>
						<div
							v-for="index in 6"
							:key="`sensor-skeleton-${index}`"
							class="dashboard-skeleton dashboard-skeleton--sensor"
						/>
					</div>
					<div
						v-else
						class="sensor-list"
					>
						<article
							v-for="sensor in sensors"
							:key="sensor.id"
							class="sensor-row"
							:data-tone="sensorTone(sensor)"
						>
							<div>
								<p class="sensor-row__name">
									{{ sensor.name }}
								</p>
								<p class="sensor-row__meta">
									{{ sensor.kind.toUpperCase() }} · обновлено
									{{ formatClock(sensor.updatedAt) }}
								</p>
							</div>
							<div class="sensor-row__reading">
								<strong>{{ sensor.value }}</strong>
								<span>{{ sensor.unit }}</span>
							</div>
							<div class="sensor-row__state">
								<span class="sensor-row__dot" />
								<span>{{ sensorToneLabel(sensor) }}</span>
							</div>
						</article>
					</div>
				</div>
			</section>
		</UContainer>

		<Teleport to="body">
			<transition name="dashboard-fade">
				<div
					v-if="selectedFeed"
					class="feed-modal"
					@click.self="closeFeed"
				>
					<div class="feed-modal__card">
						<div class="feed-modal__header">
							<div>
								<p class="dashboard-panel__eyebrow"> Полноэкранный поток </p>
								<h3 class="feed-modal__title">
									{{ selectedFeed.name }}
								</h3>
							</div>
							<button
								type="button"
								class="feed-modal__close"
								@click="closeFeed"
							>
								<UIcon name="i-lucide-x" />
							</button>
						</div>

						<div
							class="feed-modal__viewport"
							:data-status="selectedFeed.status"
						>
							<div class="camera-card__scanline" />
							<div class="feed-modal__overlay">
								<span>{{ selectedFeed.location }}</span>
								<span>{{ statusMeta[selectedFeed.status].label }}</span>
								<span>{{ selectedFeed.temperature.toFixed(1) }} °C</span>
								<span>{{ selectedFeed.smokeDensity.toFixed(1) }} ppm</span>
							</div>
						</div>
					</div>
				</div>
			</transition>
		</Teleport>

		<Teleport to="body">
			<div class="snackbar-stack">
				<transition-group name="dashboard-fade">
					<article
						v-for="item in snackbars"
						:key="item.id"
						class="snackbar"
						:data-tone="item.tone"
					>
						<strong>{{ item.title }}</strong>
						<span>{{ item.message }}</span>
					</article>
				</transition-group>
			</div>
		</Teleport>
	</main>
</template>

<style scoped>
.dashboard-page {
	min-height: 100vh;
	padding: 0.75rem 0 1rem;
}

.dashboard-layout {
	display: grid;
	gap: 0.75rem;
}

.dashboard-topbar,
.dashboard-panel,
.dashboard-metric,
.feed-modal__card,
.snackbar {
	border: 1px solid rgba(255, 255, 255, 0.08);
	background:
		linear-gradient(180deg, rgba(15, 23, 42, 0.88), rgba(15, 23, 42, 0.76)),
		linear-gradient(135deg, rgba(248, 113, 113, 0.06), rgba(250, 204, 21, 0.03));
	box-shadow: 0 28px 80px rgba(2, 6, 23, 0.42);
	backdrop-filter: blur(18px);
	height: 100%;
}

.dashboard-topbar {
	display: flex;
	flex-direction: column;
	gap: 0.9rem;
	padding: 1rem 1.1rem;
	border-radius: 1.75rem;
}

.dashboard-brand {
	display: grid;
	gap: 1rem;
}

.dashboard-brand__badge {
	display: inline-flex;
	width: fit-content;
	align-items: center;
	gap: 0.65rem;
	padding: 0.55rem 0.9rem;
	border-radius: 999px;
	border: 1px solid rgba(250, 204, 21, 0.18);
	background: rgba(15, 23, 42, 0.72);
	font-size: 0.78rem;
	letter-spacing: 0.08em;
	text-transform: uppercase;
	color: rgba(226, 232, 240, 0.82);
}

.dashboard-brand__pulse,
.dashboard-connection__dot,
.sensor-row__dot {
	width: 0.6rem;
	height: 0.6rem;
	border-radius: 999px;
}

.dashboard-brand__pulse {
	background: #22c55e;
	box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.45);
	animation: pulse 2.3s infinite;
}

.dashboard-title {
	margin: 0;
	font-size: clamp(1.75rem, 4vw, 2.8rem);
	font-weight: 700;
	line-height: 1.05;
	letter-spacing: -0.04em;
	color: #f8fafc;
}

.dashboard-subtitle,
.dashboard-user__label,
.dashboard-panel__eyebrow,
.dashboard-metric__label,
.dashboard-metric__detail,
.event-row__meta,
.sensor-row__meta,
.dashboard-placeholder p {
	color: rgba(203, 213, 225, 0.7);
}

.dashboard-subtitle {
	max-width: 52rem;
	margin: 0.75rem 0 0;
	line-height: 1.7;
}

.dashboard-session {
	display: flex;
	flex-wrap: wrap;
	align-items: center;
	justify-content: space-between;
	gap: 0.9rem;
}

.dashboard-connection,
.dashboard-user {
	display: flex;
	align-items: center;
	gap: 0.75rem;
	padding: 0.8rem 1rem;
	border-radius: 1rem;
	background: rgba(15, 23, 42, 0.68);
	border: 1px solid rgba(255, 255, 255, 0.06);
}

.dashboard-connection[data-tone="safe"] .dashboard-connection__dot,
.sensor-row[data-tone="safe"] .sensor-row__dot {
	background: #22c55e;
	box-shadow: 0 0 18px rgba(34, 197, 94, 0.42);
}

.dashboard-connection[data-tone="warning"] .dashboard-connection__dot,
.sensor-row[data-tone="warning"] .sensor-row__dot {
	background: #facc15;
	box-shadow: 0 0 18px rgba(250, 204, 21, 0.42);
}

.dashboard-connection[data-tone="fire"] .dashboard-connection__dot,
.sensor-row[data-tone="danger"] .sensor-row__dot {
	background: #f87171;
	box-shadow: 0 0 18px rgba(248, 113, 113, 0.48);
}

.dashboard-user {
	min-width: 14rem;
	justify-content: space-between;
}

.dashboard-user__label,
.dashboard-user__name {
	order: 1;
}

.dashboard-logout {
	order: 2;
	margin-left: auto;
	border-color: rgba(248, 250, 252, 0.14);
	background: rgba(15, 23, 42, 0.38);
}

.dashboard-user__label,
.dashboard-panel__eyebrow,
.dashboard-metric__label {
	margin: 0;
	font-size: 0.75rem;
	text-transform: uppercase;
	letter-spacing: 0.12em;
}

.dashboard-user__name,
.dashboard-panel__title,
.camera-card__name,
.feed-modal__title {
	margin: 0;
	color: #f8fafc;
}

.dashboard-user__name {
	font-weight: 600;
}

.dashboard-metrics,
.dashboard-zone {
	display: grid;
	gap: 0.75rem;
}

.dashboard-metrics {
	grid-template-columns: repeat(auto-fit, minmax(210px, 1fr));
}

.dashboard-zone {
	grid-template-columns: minmax(0, 1fr);
}

.dashboard-metric {
	display: grid;
	gap: 0.75rem;
	padding: 0.9rem;
	border-radius: 1.5rem;
	overflow: hidden;
}

.dashboard-metric__header,
.dashboard-panel__header,
.dashboard-panel__footer,
.camera-card__footer,
.feed-modal__header,
.feed-modal__overlay {
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 1rem;
}

.dashboard-metric__value {
	margin: 0.35rem 0 0;
	font-size: 2rem;
	font-weight: 700;
	line-height: 1;
	letter-spacing: -0.04em;
	color: #f8fafc;
}

.dashboard-metric__icon {
	display: grid;
	place-items: center;
	width: 2.8rem;
	height: 2.8rem;
	border-radius: 1rem;
	background: rgba(15, 23, 42, 0.88);
	font-size: 1.2rem;
	color: #f8fafc;
}

.dashboard-metric__trend {
	display: flex;
	flex-wrap: wrap;
	gap: 0.65rem;
	align-items: center;
	font-size: 0.9rem;
	color: rgba(226, 232, 240, 0.78);
}

.dashboard-trend {
	display: inline-flex;
	align-items: center;
	gap: 0.35rem;
	font-weight: 600;
	color: #f8fafc;
}

.dashboard-metric__detail {
	margin: 0;
	font-size: 0.9rem;
}

.dashboard-metric--fire {
	border-color: rgba(248, 113, 113, 0.22);
}

.dashboard-metric--smoke {
	border-color: rgba(251, 146, 60, 0.22);
}

.dashboard-metric--warning {
	border-color: rgba(250, 204, 21, 0.22);
}

.dashboard-metric--safe {
	border-color: rgba(34, 197, 94, 0.22);
}

.dashboard-panel {
	display: grid;
	gap: 0.75rem;
	padding: 0.9rem;
	border-radius: 1.75rem;
}

.dashboard-panel__title {
	font-size: 1.2rem;
	font-weight: 600;
}

.dashboard-events-button {
	border-color: rgba(248, 250, 252, 0.14);
	background: transparent;
}

.dashboard-feed,
.sensor-list {
	display: grid;
	gap: 0.75rem;
}

.event-row,
.sensor-row {
	display: grid;
	gap: 0.65rem;
	align-items: center;
	padding: 0.75rem 0.85rem;
	border-radius: 1.15rem;
	border: 1px solid rgba(255, 255, 255, 0.06);
	background: rgba(15, 23, 42, 0.62);
}

.event-row {
	grid-template-columns: auto minmax(0, 1fr);
}

.event-row[data-tone="fire"] {
	border-color: rgba(248, 113, 113, 0.24);
}

.event-row[data-tone="smoke"] {
	border-color: rgba(251, 146, 60, 0.24);
}

.event-row__icon {
	display: grid;
	place-items: center;
	width: 2.75rem;
	height: 2.75rem;
	border-radius: 0.95rem;
	font-size: 1.1rem;
	color: #f8fafc;
	background: linear-gradient(135deg, rgba(248, 113, 113, 0.2), rgba(251, 146, 60, 0.14));
}

.event-row__headline,
.event-row__meta {
	display: flex;
	flex-wrap: wrap;
	gap: 0.55rem 0.9rem;
}

.event-row__headline {
	color: #f8fafc;
}

.event-row__meta,
.camera-card__status {
	font-size: 0.87rem;
}

.camera-grid {
	display: grid;
	gap: 0.85rem;
	grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
}

.camera-card {
	display: grid;
	gap: 0.75rem;
	padding: 0.8rem;
	border-radius: 1.25rem;
	border: 1px solid rgba(255, 255, 255, 0.06);
	background: rgba(15, 23, 42, 0.58);
	text-align: left;
	transition:
		transform 0.2s ease,
		border-color 0.2s ease;
}

.camera-card:hover {
	transform: translateY(-2px);
}

.camera-card[data-status="fire"] {
	border-color: rgba(248, 113, 113, 0.28);
}

.camera-card[data-status="smoke"] {
	border-color: rgba(251, 146, 60, 0.28);
}

.camera-card__viewport,
.feed-modal__viewport {
	position: relative;
	overflow: hidden;
	min-height: 9rem;
	border-radius: 1rem;
	background:
		radial-gradient(circle at 12% 20%, rgba(248, 113, 113, 0.24), transparent 0 30%),
		radial-gradient(circle at 84% 14%, rgba(251, 146, 60, 0.18), transparent 0 26%),
		linear-gradient(180deg, rgba(30, 41, 59, 0.94), rgba(15, 23, 42, 0.94));
}

.feed-modal__viewport {
	min-height: min(70vh, 42rem);
}

.camera-card__scanline {
	position: absolute;
	inset: 0;
	background:
		linear-gradient(180deg, transparent, rgba(248, 250, 252, 0.08), transparent),
		repeating-linear-gradient(180deg, rgba(255, 255, 255, 0.02) 0 2px, transparent 2px 6px);
	animation: scanline 4.5s linear infinite;
}

.camera-card__hud,
.feed-modal__overlay {
	position: absolute;
	inset: auto 0 0 0;
	padding: 0.75rem 0.85rem;
	background: linear-gradient(180deg, transparent, rgba(15, 23, 42, 0.92));
	color: rgba(248, 250, 252, 0.82);
	font-size: 0.82rem;
}

.camera-card__footer {
	align-items: end;
}

.camera-card__name {
	font-size: 0.96rem;
	font-weight: 600;
}

.camera-card__status {
	margin: 0.25rem 0 0;
	color: rgba(203, 213, 225, 0.72);
}

.camera-card__expand,
.feed-modal__close {
	display: grid;
	place-items: center;
	width: 2.4rem;
	height: 2.4rem;
	border-radius: 0.9rem;
	border: 1px solid rgba(255, 255, 255, 0.08);
	background: rgba(15, 23, 42, 0.75);
	color: #f8fafc;
}

.dashboard-placeholder {
	display: grid;
	place-items: center;
	gap: 0.75rem;
	min-height: 18rem;
	padding: 2rem;
	border-radius: 1.3rem;
	border: 1px dashed rgba(255, 255, 255, 0.12);
	text-align: center;
}

.dashboard-placeholder h3 {
	margin: 0;
	color: #f8fafc;
}

.dashboard-placeholder__icon {
	font-size: 2rem;
	color: rgba(203, 213, 225, 0.82);
}

.sensor-row {
	grid-template-columns: minmax(0, 1fr) auto auto;
}

.sensor-row__name {
	margin: 0;
	color: #f8fafc;
	font-weight: 600;
}

.sensor-row__meta {
	margin: 0.25rem 0 0;
	font-size: 0.82rem;
}

.sensor-row__reading {
	display: flex;
	align-items: baseline;
	gap: 0.35rem;
	color: #f8fafc;
}

.sensor-row__reading strong {
	font-size: 1.45rem;
	line-height: 1;
}

.sensor-row__state {
	display: inline-flex;
	align-items: center;
	gap: 0.55rem;
	color: rgba(226, 232, 240, 0.82);
}

.dashboard-skeleton {
	position: relative;
	overflow: hidden;
	border-radius: 1.25rem;
	border: 1px solid rgba(255, 255, 255, 0.06);
	background: rgba(15, 23, 42, 0.62);
}

.dashboard-skeleton::after {
	content: "";
	position: absolute;
	inset: 0;
	transform: translateX(-100%);
	background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.08), transparent);
	animation: shimmer 1.5s infinite;
}

.dashboard-skeleton--metric {
	min-height: 11rem;
}

.dashboard-skeleton--event,
.dashboard-skeleton--sensor {
	min-height: 5rem;
}

.dashboard-skeleton--camera {
	min-height: 12rem;
}

.feed-modal {
	position: fixed;
	inset: 0;
	z-index: 60;
	display: grid;
	place-items: center;
	padding: 1rem;
	background: rgba(2, 6, 23, 0.72);
	backdrop-filter: blur(10px);
}

.feed-modal__card {
	width: min(100%, 72rem);
	padding: 1rem;
	border-radius: 1.5rem;
}

.snackbar-stack {
	position: fixed;
	right: 1rem;
	bottom: 1rem;
	z-index: 70;
	display: grid;
	gap: 0.75rem;
	width: min(100% - 2rem, 24rem);
}

.snackbar {
	display: grid;
	gap: 0.25rem;
	padding: 0.9rem 1rem;
	border-radius: 1rem;
	color: #f8fafc;
}

.snackbar[data-tone="fire"] {
	border-color: rgba(248, 113, 113, 0.28);
}

.snackbar[data-tone="smoke"] {
	border-color: rgba(251, 146, 60, 0.28);
}

.snackbar[data-tone="warning"] {
	border-color: rgba(250, 204, 21, 0.28);
}

.dashboard-fade-enter-active,
.dashboard-fade-leave-active {
	transition:
		opacity 0.2s ease,
		transform 0.2s ease;
}

.dashboard-fade-enter-from,
.dashboard-fade-leave-to {
	opacity: 0;
	transform: translateY(8px);
}

@keyframes shimmer {
	100% {
		transform: translateX(100%);
	}
}

@keyframes pulse {
	0% {
		box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.45);
	}

	100% {
		box-shadow: 0 0 0 14px rgba(34, 197, 94, 0);
	}
}

@keyframes scanline {
	0% {
		transform: translateY(-100%);
	}

	100% {
		transform: translateY(100%);
	}
}

@media (min-width: 1024px) {
	.dashboard-page {
		padding-top: 0.85rem;
	}

	.dashboard-topbar {
		flex-direction: row;
		justify-content: space-between;
		align-items: end;
	}

	.dashboard-zone {
		grid-template-columns: minmax(0, 1.05fr) minmax(0, 0.95fr);
	}

	.dashboard-zone--compact {
		grid-template-columns: minmax(0, 0.92fr) minmax(0, 1.2fr) minmax(0, 0.88fr);
		align-items: start;
	}
}

@media (max-width: 767px) {
	.sensor-row {
		grid-template-columns: minmax(0, 1fr);
	}

	.dashboard-user,
	.dashboard-connection {
		width: 100%;
	}
}
</style>
