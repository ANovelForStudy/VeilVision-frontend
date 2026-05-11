<script setup lang="ts">
const props = defineProps<{
	title: string;
	location?: string;
	webrtcUrl?: string;
	compact?: boolean;
}>();

const frameUrl = computed(() => props.webrtcUrl?.trim() || "");
</script>

<template>
	<div class="camera-preview" :data-compact="compact ? 'true' : 'false'">
		<div v-if="frameUrl" class="camera-preview__frame-wrap">
			<iframe
				:src="frameUrl"
				class="camera-preview__frame"
				:title="title"
				loading="lazy"
				allow="autoplay; fullscreen; picture-in-picture"
				referrerpolicy="no-referrer"
			/>
			<div class="camera-preview__overlay">
				<span class="camera-preview__badge">LIVE WEBRTC</span>
				<div class="camera-preview__meta">
					<strong>{{ title }}</strong>
					<span>{{ location || "Без локации" }}</span>
				</div>
			</div>
		</div>

		<div v-else class="camera-preview__empty">
			<UIcon name="i-lucide-video-off" />
			<strong>Предпросмотр недоступен</strong>
			<span>Для камеры не задан `webrtc_url`.</span>
		</div>
	</div>
</template>

<style scoped>
.camera-preview,
.camera-preview__frame-wrap,
.camera-preview__empty {
	position: relative;
	overflow: hidden;
	border-radius: 1.2rem;
}

.camera-preview__frame-wrap {
	min-height: 14rem;
	background:
		radial-gradient(circle at top left, rgba(56, 189, 248, 0.16), transparent 0 30%),
		linear-gradient(180deg, rgba(15, 23, 42, 0.96), rgba(2, 6, 23, 0.98));
	border: 1px solid rgba(255, 255, 255, 0.08);
}

.camera-preview[data-compact="true"] .camera-preview__frame-wrap {
	min-height: 11rem;
}

.camera-preview__frame {
	display: block;
	width: 100%;
	height: 100%;
	min-height: inherit;
	border: 0;
	background: #020617;
}

.camera-preview__overlay {
	position: absolute;
	inset: auto 0 0 0;
	display: flex;
	align-items: end;
	justify-content: space-between;
	gap: 0.75rem;
	padding: 0.9rem 1rem;
	background: linear-gradient(180deg, transparent, rgba(2, 6, 23, 0.94));
	pointer-events: none;
}

.camera-preview__badge {
	display: inline-flex;
	align-items: center;
	padding: 0.35rem 0.55rem;
	border-radius: 999px;
	background: rgba(239, 68, 68, 0.18);
	border: 1px solid rgba(248, 113, 113, 0.24);
	color: #fecaca;
	font-size: 0.7rem;
	letter-spacing: 0.12em;
}

.camera-preview__meta {
	display: grid;
	gap: 0.2rem;
	text-align: right;
}

.camera-preview__meta strong,
.camera-preview__empty strong {
	color: #f8fafc;
}

.camera-preview__meta span,
.camera-preview__empty span {
	color: rgba(203, 213, 225, 0.74);
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
</style>
