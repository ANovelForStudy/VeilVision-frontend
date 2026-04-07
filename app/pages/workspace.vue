<script setup lang="ts">
import { storeToRefs } from "pinia";

import { useSessionStore } from "~/entities/session/model/session.store";

const sessionStore = useSessionStore();
const { isAuthenticated, user } = storeToRefs(sessionStore);

useSeoMeta({
	title: "YOLO FireWatch Lab | Рабочее пространство",
	description:
		"Рабочее пространство системы превентивного мониторинга и раннего обнаружения возгораний.",
});
</script>

<template>
	<main class="workspace-page">
		<UContainer class="space-y-8">
			<div class="workspace-header">
				<div class="space-y-3">
					<UBadge
						color="warning"
						variant="subtle"
						class="w-fit rounded-full px-3 py-1"
					>
						Monitoring Workspace
					</UBadge>
					<h1 class="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
						{{
							isAuthenticated
								? `С возвращением, ${user?.name}`
								: "Сессия мониторинга не найдена"
						}}
					</h1>
					<p class="max-w-2xl text-base leading-7 text-[color:var(--ui-text-muted)]">
						{{
							isAuthenticated
								? `${user?.workspace} открыт. Здесь можно продолжить анализ видеопотоков, тревожных событий и результатов детекции моделей семейства YOLO.`
								: "Для доступа к панели мониторинга выполните вход через страницу логина."
						}}
					</p>
				</div>

				<div class="flex flex-wrap gap-3">
					<UButton
						v-if="isAuthenticated"
						color="neutral"
						variant="soft"
						icon="i-lucide-log-out"
						@click="sessionStore.signOut()"
					>
						Завершить сессию
					</UButton>
					<UButton
						color="primary"
						to="/"
						icon="i-lucide-arrow-left"
					>
						{{ isAuthenticated ? "Вернуться к точке входа" : "Перейти ко входу" }}
					</UButton>
				</div>
			</div>

			<div class="grid gap-4 lg:grid-cols-3">
				<UCard
					v-for="item in [
						{
							title: 'Учётная запись',
							value: user?.email || 'Не авторизован',
							icon: 'i-lucide-user-round',
						},
						{
							title: 'Роль в контуре',
							value: user?.role || 'Гость',
							icon: 'i-lucide-badge-check',
						},
						{
							title: 'Статус мониторинга',
							value: isAuthenticated ? 'Контур активен' : 'Контур отключён',
							icon: 'i-lucide-shield-check',
						},
					]"
					:key="item.title"
					variant="soft"
					class="workspace-card"
				>
					<div class="space-y-4">
						<div class="workspace-card__icon">
							<UIcon
								:name="item.icon"
								class="text-lg text-white"
							/>
						</div>
						<div class="space-y-1">
							<p class="text-sm text-[color:var(--ui-text-toned)]">
								{{ item.title }}
							</p>
							<p class="text-lg font-medium text-white">
								{{ item.value }}
							</p>
						</div>
					</div>
				</UCard>
			</div>
		</UContainer>
	</main>
</template>
