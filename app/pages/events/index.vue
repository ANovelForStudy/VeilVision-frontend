<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import type { Camera } from "~/entities/camera/model/types";
import { useEventStore } from "~/entities/event/model/event.store";
import type { EventCard, EventType } from "~/entities/event/model/types";
import { formatEventTypeLabel } from "~/entities/event/model/types";
import { fetchCameras } from "~/shared/api/cameras";

const eventStore = useEventStore();
const cameras = ref<Camera[]>([]);

const selectedType = ref<"all" | EventType>("all");
const selectedCamera = ref("all");
const selectedDate = ref("");

const typeMeta = {
    fire: {
        label: "Огонь",
        icon: "i-lucide-flame",
        tone: "fire",
        badge: "error",
    },
    smoke: {
        label: "Дым",
        icon: "i-lucide-cloud",
        tone: "smoke",
        badge: "warning",
    },
    other: {
        label: "Прочее",
        icon: "i-lucide-scan-eye",
        tone: "other",
        badge: "neutral",
    },
} as const;

const enrichedEvents = computed<EventCard[]>(() =>
    eventStore.events.map((event) => {
        const camera = cameras.value.find(
            (item) => item.id === event.camera_id,
        );

        return {
            id: event.id,
            timestamp: event.created_at,
            cameraName: camera?.name ?? `Камера ${event.camera_id.slice(0, 8)}`,
            cameraLocation: camera?.location ?? "Локация не указана",
            eventType: event.event_type,
            type: event.type,
            status: event.status,
            confidence: event.confidence,
            imageUrl: event.image_url,
            storageFilename: event.storage_filename,
        };
    }),
);

const cameraOptions = computed(() => {
    if (!enrichedEvents.value || enrichedEvents.value.length === 0) {
        return [{ label: "Все камеры", value: "all" }];
    }

    const names = enrichedEvents.value
        .map((event) => event.cameraName)
        .filter(Boolean);

    return [
        { label: "Все камеры", value: "all" },
        ...Array.from(new Set(names)).map((cameraName) => ({
            label: cameraName,
            value: cameraName,
        })),
    ];
});

const filteredEvents = computed(() =>
    enrichedEvents.value.filter((event) => {
        if (selectedType.value !== "all" && event.type !== selectedType.value) {
            return false;
        }

        if (
            selectedCamera.value !== "all" &&
            event.cameraName !== selectedCamera.value
        ) {
            return false;
        }

        if (
            selectedDate.value &&
            toDateInputValue(event.timestamp) !== selectedDate.value
        ) {
            return false;
        }

        return true;
    }),
);

const summary = computed(() => ({
    all: enrichedEvents.value.length,
    fire: enrichedEvents.value.filter((event) => event.type === "fire").length,
    smoke: enrichedEvents.value.filter((event) => event.type === "smoke")
        .length,
    cameras: new Set(enrichedEvents.value.map((event) => event.cameraName))
        .size,
}));

function clearFilters() {
    selectedType.value = "all";
    selectedCamera.value = "all";
    selectedDate.value = "";
}

function eventTypeLabel(event: EventCard) {
    if (event.type === "other") {
        return formatEventTypeLabel(event.eventType);
    }

    return typeMeta[event.type].label;
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

onMounted(async () => {
    try {
        cameras.value = await fetchCameras();
    } catch (error) {
        console.error("Failed to fetch cameras for events page:", error);
    }

    await eventStore.loadEvents();
});

onBeforeUnmount(() => {
    eventStore.clearEvents();
});

useSeoMeta({
    title: "События",
    description:
        "Журнал детекций с кадрами и фильтрацией по типу, камере и дате.",
});
</script>

<template>
    <main class="events-page">
        <UContainer class="events-layout max-w-none px-3 sm:px-4 lg:px-5">
            <header class="events-hero">
                <div class="events-hero__copy">
                    <div class="events-hero__badge">
                        <UIcon name="i-lucide-history" />
                        <span>Архив тревожных детекций</span>
                    </div>
                    <div>
                        <h1 class="events-title">События</h1>
                        <p class="events-subtitle">
                            Журнал срабатываний с кадрами детекции. Отфильтруйте
                            поток по типу, камере и дате, затем откройте
                            карточку для просмотра полного изображения и
                            метаданных события.
                        </p>
                    </div>
                </div>

                <div class="events-hero__metrics">
                    <div class="events-hero__metric">
                        <span class="events-hero__metric-value">{{
                            summary.all
                        }}</span>
                        <span class="events-hero__metric-label"
                            >событий в журнале</span
                        >
                    </div>
                    <div class="events-hero__metric">
                        <span class="events-hero__metric-value">{{
                            summary.cameras
                        }}</span>
                        <span class="events-hero__metric-label"
                            >камер в выборке</span
                        >
                    </div>
                </div>
            </header>

            <section class="events-stats">
                <button
                    type="button"
                    class="event-stat"
                    :data-active="selectedType === 'all'"
                    @click="selectedType = 'all'"
                >
                    <div class="event-stat__icon">
                        <UIcon name="i-lucide-list-filter" />
                    </div>
                    <div>
                        <span class="event-stat__label">Все</span>
                        <span class="event-stat__value">{{ summary.all }}</span>
                    </div>
                </button>

                <button
                    v-for="type in ['fire', 'smoke'] as const"
                    :key="type"
                    type="button"
                    class="event-stat"
                    :data-tone="type"
                    :data-active="selectedType === type"
                    @click="selectedType = type"
                >
                    <div class="event-stat__icon">
                        <UIcon :name="typeMeta[type].icon" />
                    </div>
                    <div>
                        <span class="event-stat__label">{{
                            typeMeta[type].label
                        }}</span>
                        <span class="event-stat__value">{{
                            summary[type]
                        }}</span>
                    </div>
                </button>
            </section>

            <section class="events-controls">
                <div class="events-controls__field">
                    <label class="events-label">Тип события</label>
                    <USelect
                        v-model="selectedType"
                        :items="[
                            { label: 'Все типы', value: 'all' },
                            { label: 'Огонь', value: 'fire' },
                            { label: 'Дым', value: 'smoke' },
                        ]"
                        value-key="value"
                        label-key="label"
                        size="xl"
                        variant="subtle"
                        leading-icon="i-lucide-flame-kindling"
                        class="events-input"
                    />
                </div>

                <div class="events-controls__field">
                    <label class="events-label">Камера</label>
                    <USelect
                        v-model="selectedCamera"
                        :items="cameraOptions"
                        value-key="value"
                        label-key="label"
                        size="xl"
                        variant="subtle"
                        leading-icon="i-lucide-cctv"
                        class="events-input"
                    />
                </div>

                <div class="events-controls__field">
                    <label class="events-label">Дата</label>
                    <UInput
                        v-model="selectedDate"
                        type="date"
                        size="xl"
                        variant="subtle"
                        icon="i-lucide-calendar-days"
                        class="events-input"
                    />
                </div>

                <div class="events-controls__field events-controls__actions">
                    <label class="events-label events-label--ghost"
                        >Действия</label
                    >
                    <UButton
                        color="neutral"
                        variant="outline"
                        size="xl"
                        icon="i-lucide-rotate-ccw"
                        class="events-reset"
                        @click="clearFilters"
                    >
                        Сбросить фильтры
                    </UButton>
                </div>

                <div class="events-controls__result">
                    <p class="events-label">Результат</p>
                    <p class="events-result">
                        Найдено
                        <strong>{{ filteredEvents.length }}</strong> событий
                    </p>
                </div>
            </section>

            <UAlert
                v-if="eventStore.error"
                color="error"
                variant="subtle"
                icon="i-lucide-circle-alert"
                :title="eventStore.error"
                class="mb-2"
            />

            <section class="events-panel">
                <div class="events-panel__header">
                    <div>
                        <p class="events-panel__eyebrow">Поток тревог</p>
                        <h2 class="events-panel__title">Карточки событий</h2>
                    </div>
                    <UBadge
                        color="neutral"
                        variant="soft"
                        class="rounded-full px-3 py-1"
                    >
                        {{ filteredEvents.length }} / {{ summary.all }}
                    </UBadge>
                </div>

                <!-- Используем реактивный флаг лоадинга из нашего нового стора -->
                <div v-if="eventStore.isLoading" class="events-list">
                    <div
                        v-for="index in 6"
                        :key="`event-skeleton-${index}`"
                        class="event-card event-card--skeleton"
                    />
                </div>

                <div
                    v-else-if="filteredEvents.length === 0"
                    class="events-empty"
                >
                    <div class="events-empty__icon">
                        <UIcon name="i-lucide-search-x" />
                    </div>
                    <h3>Совпадений не найдено</h3>
                    <p>
                        Попробуйте изменить тип события, камеру или дату в
                        фильтрах.
                    </p>
                </div>

                <div v-else class="events-list">
                    <NuxtLink
                        v-for="event in filteredEvents"
                        :key="event.id"
                        :to="`/events/${event.id}`"
                        class="event-card"
                        :data-tone="event.type"
                    >
                        <div class="event-card__preview">
                            <img
                                v-if="event.imageUrl"
                                :src="event.imageUrl"
                                :alt="`Кадр события ${event.id}`"
                                class="event-card__image"
                                loading="lazy"
                            />
                            <div v-else class="event-card__placeholder">
                                <UIcon name="i-lucide-image-off" />
                                <span>Кадр недоступен</span>
                            </div>
                            <div class="event-card__scanline" />
                            <div class="event-card__overlay">
                                <span>{{ event.cameraLocation }}</span>
                                <span>{{
                                    formatDateTime(event.timestamp)
                                }}</span>
                            </div>
                        </div>

                        <div class="event-card__content">
                            <div class="event-card__header">
                                <div>
                                    <p class="event-card__title">
                                        {{ eventTypeLabel(event) }}
                                    </p>
                                    <h3>{{ event.cameraName }}</h3>
                                </div>
                                <UBadge
                                    :color="typeMeta[event.type].badge"
                                    variant="soft"
                                    class="rounded-full px-3 py-1"
                                >
                                    <UIcon :name="typeMeta[event.type].icon" />
                                    {{ formatPercent(event.confidence) }}
                                </UBadge>
                            </div>

                            <div class="event-card__meta">
                                <div class="event-card__fact">
                                    <span>ID</span>
                                    <strong>#{{ event.id }}</strong>
                                </div>
                                <div class="event-card__fact">
                                    <span>Дата</span>
                                    <strong>{{
                                        formatDay(event.timestamp)
                                    }}</strong>
                                </div>
                                <div class="event-card__fact">
                                    <span>Файл</span>
                                    <strong
                                        class="block max-w-[150px] sm:max-w-[200px] md:max-w-[300px] lg:max-w-[400px] truncate"
                                        :title="event.storageFilename ?? '—'"
                                    >
                                        {{ event.storageFilename ?? "—" }}
                                    </strong>
                                </div>
                            </div>
                        </div>
                    </NuxtLink>
                </div>
            </section>
        </UContainer>
    </main>
</template>

<style scoped>
.events-page {
    min-height: 100vh;
    padding: 0.85rem 0 1.2rem;
    background:
        radial-gradient(
            circle at top left,
            rgba(56, 189, 248, 0.14),
            transparent 0 22%
        ),
        radial-gradient(
            circle at top right,
            rgba(248, 113, 113, 0.12),
            transparent 0 18%
        ),
        linear-gradient(180deg, rgba(2, 6, 23, 0.98), rgba(15, 23, 42, 0.96));
}

.events-layout {
    display: grid;
    gap: 0.85rem;
}

.events-hero,
.events-controls,
.events-panel,
.event-stat,
.event-card,
.event-modal__preview {
    border: 1px solid rgba(255, 255, 255, 0.08);
    background:
        linear-gradient(180deg, rgba(15, 23, 42, 0.88), rgba(15, 23, 42, 0.76)),
        linear-gradient(
            135deg,
            rgba(56, 189, 248, 0.08),
            rgba(248, 113, 113, 0.04)
        );
    box-shadow: 0 24px 72px rgba(2, 6, 23, 0.35);
    backdrop-filter: blur(18px);
}

.events-hero {
    display: flex;
    flex-wrap: wrap;
    align-items: end;
    justify-content: space-between;
    gap: 1rem;
    padding: 1.1rem 1.2rem;
    border-radius: 1.8rem;
}

.events-hero__copy,
.events-hero__metrics,
.event-card__content,
.event-modal,
.event-modal__details,
.event-modal__detections {
    display: grid;
    gap: 0.9rem;
}

.events-hero__metrics {
    width: min(100%, 26rem);
    grid-template-columns: repeat(2, minmax(0, 1fr));
}

.events-hero__badge {
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

.events-title,
.events-panel__title,
.event-card h3,
.event-modal__title,
.event-modal__section-title {
    margin: 0;
    color: #f8fafc;
}

.events-title {
    font-size: clamp(1.8rem, 4vw, 2.6rem);
    font-weight: 700;
    letter-spacing: -0.04em;
}

.events-subtitle,
.events-label,
.events-panel__eyebrow,
.event-card__title,
.event-card__fact span,
.event-modal__subtitle,
.event-modal__fact span,
.event-modal__detection-meta {
    color: rgba(203, 213, 225, 0.68);
}

.events-subtitle {
    max-width: 52rem;
    margin: 0.5rem 0 0;
    line-height: 1.6;
}

.events-hero__metric {
    display: grid;
    padding: 0.85rem 1rem;
    border-radius: 1.25rem;
    border: 1px solid rgba(255, 255, 255, 0.06);
    background: rgba(15, 23, 42, 0.64);
}

.events-hero__metric-value,
.event-stat__value {
    font-size: 1.7rem;
    font-weight: 700;
    line-height: 1;
    color: #f8fafc;
}

.events-hero__metric-label,
.events-result {
    color: rgba(203, 213, 225, 0.76);
}

.events-hero__metric-label {
    margin-top: 0.35rem;
    font-size: 0.82rem;
}

.events-stats {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
    gap: 0.75rem;
}

.event-stat {
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

.event-stat:hover,
.event-stat[data-active="true"] {
    transform: translateY(-2px);
    border-color: rgba(148, 163, 184, 0.28);
}

.event-stat[data-tone="fire"][data-active="true"] {
    border-color: rgba(248, 113, 113, 0.34);
}

.event-stat[data-tone="smoke"][data-active="true"] {
    border-color: rgba(251, 146, 60, 0.34);
}

.event-stat__icon {
    display: grid;
    place-items: center;
    width: 2.7rem;
    height: 2.7rem;
    border-radius: 1rem;
    background: rgba(15, 23, 42, 0.78);
    color: #f8fafc;
    font-size: 1.1rem;
}

.event-stat__label,
.events-panel__eyebrow,
.events-label,
.event-card__title,
.event-card__fact span,
.event-modal__fact span {
    font-size: 0.75rem;
    text-transform: uppercase;
    letter-spacing: 0.12em;
}

.event-stat__label {
    display: block;
    margin-bottom: 0.3rem;
    color: rgba(203, 213, 225, 0.62);
}

.events-controls,
.events-panel {
    display: grid;
    gap: 1rem;
    padding: 1rem 1.1rem;
    border-radius: 1.6rem;
}

.events-controls {
    grid-template-columns: repeat(4, minmax(0, 1fr));
    align-items: end;
}

.events-controls__field {
    display: grid;
    gap: 0.5rem;
    min-width: 0;
}

.events-controls__actions {
    align-content: end;
}

.events-controls__result {
    grid-column: 1 / -1;
    display: flex;
    align-items: center;
    gap: 0.85rem;
    padding-top: 0.2rem;
    border-top: 1px solid rgba(255, 255, 255, 0.06);
}

.events-label--ghost {
    opacity: 0;
    pointer-events: none;
}

.events-input {
    width: 100%;
}

:deep(.events-input[data-slot="base"]),
:deep(.events-input [data-slot="base"]) {
    width: 100%;
    min-height: 3.25rem;
    border-radius: 1.15rem;
    border-color: rgba(148, 163, 184, 0.14);
    background: rgba(30, 41, 59, 0.72);
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.02);
}

:deep(.events-input[data-slot="base"]:focus-visible),
:deep(.events-input [data-slot="base"]:focus-within) {
    border-color: rgba(56, 189, 248, 0.32);
    box-shadow:
        0 0 0 1px rgba(56, 189, 248, 0.2),
        inset 0 1px 0 rgba(255, 255, 255, 0.03);
}

:deep(.events-input [data-slot="leading-icon"]),
:deep(.events-input [data-slot="trailing-icon"]),
:deep(.events-input[data-slot="base"] [data-slot="leading-icon"]) {
    color: rgba(148, 163, 184, 0.88);
}

.events-result {
    margin: 0;
    font-size: 0.98rem;
}

.events-result strong,
.event-card__fact strong,
.event-modal__fact strong,
.event-modal__detection-title {
    color: #f8fafc;
}

.events-reset,
.event-modal__footer {
    justify-content: center;
}

.events-panel__header,
.event-card__header,
.event-modal__header,
.event-modal__heading,
.event-modal__footer,
.event-modal__detection-item,
.event-modal__overlay,
.event-card__overlay {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
}

.events-panel__title {
    font-size: 1.25rem;
    font-weight: 600;
}

.events-list {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 0.85rem;
}

.event-card {
    display: grid;
    gap: 0.9rem;
    padding: 0.9rem;
    border-radius: 1.35rem;
    text-align: left;
    transition:
        transform 0.2s ease,
        border-color 0.2s ease;
}

.event-card:hover {
    transform: translateY(-2px);
}

.event-card[data-tone="fire"] {
    border-color: rgba(248, 113, 113, 0.24);
}

.event-card[data-tone="smoke"] {
    border-color: rgba(251, 146, 60, 0.24);
}

.event-card[data-tone="other"] {
    border-color: rgba(148, 163, 184, 0.24);
}

.event-card__preview,
.event-modal__preview {
    position: relative;
    overflow: hidden;
    border-radius: 1.1rem;
    background:
        radial-gradient(
            circle at 14% 18%,
            rgba(248, 113, 113, 0.22),
            transparent 0 24%
        ),
        radial-gradient(
            circle at 84% 20%,
            rgba(56, 189, 248, 0.18),
            transparent 0 26%
        ),
        linear-gradient(180deg, rgba(30, 41, 59, 0.96), rgba(15, 23, 42, 0.96));
}

.event-card__preview {
    min-height: 11.5rem;
}

.event-card__image {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
}

.event-card__placeholder {
    position: absolute;
    inset: 0;
    display: grid;
    place-content: center;
    gap: 0.5rem;
    color: rgba(203, 213, 225, 0.72);
    font-size: 0.85rem;
}

.event-card__placeholder .iconify {
    font-size: 2rem;
}

.event-modal__preview {
    min-height: 22rem;
}

.event-card__scanline {
    position: absolute;
    inset: 0;
    background:
        linear-gradient(
            180deg,
            transparent,
            rgba(248, 250, 252, 0.08),
            transparent
        ),
        repeating-linear-gradient(
            180deg,
            rgba(255, 255, 255, 0.02) 0 2px,
            transparent 2px 6px
        );
    animation: scanline 4.5s linear infinite;
}

.event-card__box {
    position: absolute;
    display: flex;
    align-items: flex-start;
    justify-content: flex-start;
    padding: 0.35rem;
    border: 2px solid rgba(251, 191, 36, 0.9);
    border-radius: 0.8rem;
    background: rgba(251, 191, 36, 0.08);
    box-shadow: 0 0 0 1px rgba(15, 23, 42, 0.36) inset;
}

.event-card__box span {
    padding: 0.18rem 0.35rem;
    border-radius: 999px;
    background: rgba(15, 23, 42, 0.88);
    font-size: 0.7rem;
    color: #f8fafc;
}

.event-card__box--modal {
    border-color: rgba(96, 165, 250, 0.92);
    background: rgba(96, 165, 250, 0.1);
}

.event-card__overlay,
.event-modal__overlay {
    position: absolute;
    inset: auto 0 0 0;
    padding: 0.8rem 0.95rem;
    background: linear-gradient(180deg, transparent, rgba(15, 23, 42, 0.94));
    font-size: 0.82rem;
    color: rgba(248, 250, 252, 0.82);
}

.event-card__header h3 {
    font-size: 1.05rem;
    font-weight: 600;
}

.event-card__title {
    margin: 0 0 0.35rem;
}

.event-card__meta,
.event-modal__grid,
.event-modal__detection-list {
    display: grid;
    gap: 0.75rem;
}

.event-card__meta,
.event-modal__grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
}

.event-card__fact,
.event-modal__fact,
.event-modal__detection-item {
    padding: 0.8rem 0.9rem;
    border-radius: 1rem;
    background: rgba(15, 23, 42, 0.6);
}

.event-card__fact,
.event-modal__fact {
    display: grid;
    gap: 0.35rem;
}

.event-card--skeleton {
    min-height: 19rem;
    position: relative;
    overflow: hidden;
    background: rgba(51, 65, 85, 0.38);
}

.event-card--skeleton::after {
    content: "";
    position: absolute;
    inset: 0;
    transform: translateX(-100%);
    background: linear-gradient(
        90deg,
        transparent,
        rgba(255, 255, 255, 0.08),
        transparent
    );
    animation: shimmer 1.4s infinite;
}

.events-empty {
    display: grid;
    place-items: center;
    gap: 0.9rem;
    min-height: 14rem;
    padding: 2rem;
    border-radius: 1.35rem;
    border: 1px dashed rgba(255, 255, 255, 0.12);
    text-align: center;
}

.events-empty__icon,
.event-modal__icon {
    display: grid;
    place-items: center;
    width: 4.4rem;
    height: 4.4rem;
    border-radius: 1.4rem;
    background: rgba(15, 23, 42, 0.72);
    color: rgba(203, 213, 225, 0.76);
    font-size: 1.9rem;
}

.events-empty h3,
.events-empty p,
.event-modal__subtitle,
.event-modal__detection-title,
.event-modal__detection-meta {
    margin: 0;
}

.events-empty h3 {
    color: #f8fafc;
}

.event-modal {
    padding: 0 1.25rem 1.25rem;
    grid-template-columns: minmax(0, 1.05fr) minmax(0, 0.95fr);
    align-items: start;
}

.event-modal__heading {
    justify-content: flex-start;
}

.event-modal__icon {
    width: 2.9rem;
    height: 2.9rem;
    border-radius: 1rem;
    background: rgba(37, 99, 235, 0.18);
    color: #93c5fd;
    font-size: 1.2rem;
}

.event-modal__title {
    font-size: 1.15rem;
    font-weight: 600;
}

.event-modal__subtitle {
    font-size: 0.9rem;
}

.event-modal__section-title {
    font-size: 1rem;
    font-weight: 600;
}

.event-modal__detection-item {
    background: rgba(15, 23, 42, 0.56);
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
    .events-controls {
        grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    .event-card__meta,
    .event-modal__grid {
        grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    .event-modal {
        grid-template-columns: minmax(0, 1fr);
    }
}

@media (max-width: 820px) {
    .events-controls__result,
    .event-modal__header,
    .event-modal__heading,
    .event-modal__detection-item {
        flex-direction: column;
        align-items: stretch;
    }

    .events-hero__metrics {
        width: 100%;
    }
}

@media (max-width: 640px) {
    .events-page {
        padding-top: 0.7rem;
    }

    .events-hero,
    .events-controls,
    .events-panel,
    .event-card {
        padding: 0.85rem;
    }

    .events-controls {
        grid-template-columns: minmax(0, 1fr);
    }

    .event-card__meta,
    .event-modal__grid,
    .events-hero__metrics {
        grid-template-columns: minmax(0, 1fr);
    }

    .events-label--ghost {
        display: none;
    }

    .event-modal {
        padding: 0 0.9rem 1rem;
    }
}
</style>
