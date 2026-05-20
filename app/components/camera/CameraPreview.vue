<script setup lang="ts">
import { computed } from "vue";
import { normalizeWebRtcUrl } from "~/shared/api/mediamtx";

const props = defineProps<{
	title: string;
	webrtcUrl?: string;
	compact?: boolean;
}>();

const frameUrl = computed(() => normalizeWebRtcUrl(props.webrtcUrl || ""));
</script>

<template>
	<div
		class="camera-preview"
		:data-compact="compact ? 'true' : 'false'"
	>
		<div
			v-if="frameUrl"
			class="camera-preview__frame-wrap"
		>
			<iframe
				:src="frameUrl"
				class="camera-preview__frame"
				:title="title"
				loading="lazy"
				allow="autoplay; fullscreen; picture-in-picture"
				referrerpolicy="no-referrer"
			/>

			<!-- Прозрачный защитный слой от кликов и наведения -->
			<div class="camera-preview__blocker" />

			<!-- Информационный оверлей (метрики, бейджи) -->
			<div class="camera-preview__overlay">
				<span class="camera-preview__badge">Live</span>
			</div>
		</div>

		<div
			v-else
			class="camera-preview__empty"
		>
			<UIcon name="i-lucide-video-off" />
			<strong>Предпросмотр недоступен</strong>
			<span>Для этой камеры не задан корректный `webrtc_url`.</span>
		</div>
	</div>
</template>

<style scoped>
.camera-preview,
.camera-preview__frame-wrap,
.camera-preview__empty {
	position: relative;
	overflow: hidden;
	border-radius: 1.35rem;
}

.camera-preview__frame-wrap {
	min-height: 14rem;
	border: 1px solid rgba(255, 255, 255, 0.08);
	background:
		radial-gradient(circle at top left, rgba(34, 211, 238, 0.14), transparent 0 30%),
		linear-gradient(180deg, rgba(15, 23, 42, 0.96), rgba(2, 6, 23, 0.98));
	box-shadow:
		inset 0 1px 0 rgba(255, 255, 255, 0.05),
		0 20px 44px rgba(2, 6, 23, 0.28);
	aspect-ratio: 16 / 9;
}

.camera-preview[data-compact="true"] .camera-preview__frame-wrap {
	min-height: 15rem;
}

/* Центрирование iframe и обрезка лишнего управления */
.camera-preview__frame {
	position: absolute;
	top: 50%;
	left: 50%;
	/* Увеличиваем iframe, чтобы элементы управления вылезли за границы видимости */
	width: 115%;
	height: 125%;
	border: 0;
	background: #020617;
	/* Центрируем iframe по осям X и Y */
	transform: translate(-50%, -50%);
}

/* Прозрачный слой-блокиратор, закрывающий iframe */
.camera-preview__blocker {
	position: absolute;
	inset: 0;
	z-index: 1;
	background: transparent;
	cursor: default; /* Предотвращает появление текстового курсора или курсора руки от iframe */
}

/* Оверлей с бейджем поверх блокиратора */
.camera-preview__overlay {
	position: absolute;
	inset: auto 0 0 0;
	z-index: 2;
	display: flex;
	align-items: end;
	justify-content: space-between;
	gap: 0.85rem;
	padding: 1rem 1.05rem;
	background: linear-gradient(180deg, transparent, rgba(2, 6, 23, 0.95));
	pointer-events: none; /* Пропускает клики к блокиратору, если нужно, но сам не мешает */
}

.camera-preview__badge {
	display: inline-flex;
	align-items: center;
	padding: 0.35rem 0.62rem;
	border-radius: 999px;
	background: rgba(239, 68, 68, 0.18);
	border: 1px solid rgba(248, 113, 113, 0.24);
	color: #fecaca;
	font-size: 0.7rem;
	letter-spacing: 0.12em;
	text-transform: uppercase;
}

.camera-preview__empty strong {
	color: #f8fafc;
}

.camera-preview__empty span {
	color: rgba(203, 213, 225, 0.75);
	font-size: 0.84rem;
}

.camera-preview__empty {
	display: grid;
	place-items: center;
	gap: 0.55rem;
	min-height: 14rem;
	padding: 1.5rem;
	text-align: center;
	border: 1px dashed rgba(148, 163, 184, 0.24);
	background: rgba(15, 23, 42, 0.64);
}

.camera-preview__empty :deep(svg) {
	font-size: 1.8rem;
	color: rgba(148, 163, 184, 0.82);
}

@media (max-width: 640px) {
	.camera-preview__frame-wrap,
	.camera-preview[data-compact="true"] .camera-preview__frame-wrap {
		min-height: 13rem;
	}

	.camera-preview__overlay {
		flex-direction: column;
		align-items: start;
	}
}
</style>
