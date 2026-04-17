<script setup lang="ts">
const highlights = [
	{
		title: "YOLO-инференс в реальном времени",
		description:
			"Детекция дыма, открытого пламени и опасных тепловых паттернов объединена в едином контуре наблюдения.",
		icon: "i-lucide-scan-line",
	},
	{
		title: "Превентивный мониторинг объекта",
		description:
			"Операторы получают ранний сигнал до масштабирования события: по кадрам, зонам, вероятностям и истории тревог.",
		icon: "i-lucide-flame",
	},
	{
		title: "Исследовательская трассируемость",
		description:
			"Эксперименты по архитектурам YOLO, метрики и рабочие гипотезы остаются прозрачными для научной и инженерной команды.",
		icon: "i-lucide-file-search",
	},
] as const;

const stats = [
	{ value: "< 2 c", label: "средняя задержка тревоги" },
	{ value: "YOLO", label: "основа детекционного контура" },
	{ value: "24/7", label: "непрерывное видеонаблюдение" },
] as const;
</script>

<template>
	<section class="hero-panel">
		<div class="space-y-6">
			<UBadge
				color="warning"
				variant="subtle"
				class="w-fit rounded-full px-3 py-1"
			>
				YOLO FireWatch Lab
			</UBadge>

			<div class="space-y-4">
				<h2 class="text-4xl font-semibold tracking-tight text-white sm:text-5xl">
					Интеллектуальный контур раннего обнаружения возгорания и задымления
				</h2>
				<p
					class="max-w-2xl text-base leading-7 text-[color:var(--ui-text-dimmed)] sm:text-lg"
				>
					Вход в исследовательскую платформу, где свёрточные нейронные сети семейства YOLO
					применяются для превентивного мониторинга, анализа видеопотока и раннего
					выявления опасных событий на объекте.
				</p>
			</div>
		</div>

		<div class="grid gap-4">
			<article
				v-for="item in highlights"
				:key="item.title"
				class="feature-card items-center"
			>
				<div class="feature-card__icon">
					<UIcon
						:name="item.icon"
						class="text-lg text-white"
					/>
				</div>
				<div class="space-y-1">
					<h3 class="text-sm font-medium text-white">
						{{ item.title }}
					</h3>
					<p class="text-sm leading-6 text-[color:var(--ui-text-toned)]">
						{{ item.description }}
					</p>
				</div>
			</article>
		</div>

		<div class="grid gap-3 sm:grid-cols-3">
			<article
				v-for="item in stats"
				:key="item.label"
				class="stat-card"
			>
				<div class="text-2xl font-semibold tracking-tight text-white">
					{{ item.value }}
				</div>
				<p class="text-sm leading-6 text-[color:var(--ui-text-muted)]">
					{{ item.label }}
				</p>
			</article>
		</div>
	</section>
</template>
