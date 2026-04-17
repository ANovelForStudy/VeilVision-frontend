<script setup lang="ts">
import { storeToRefs } from "pinia";

import { useSignInForm } from "../model/use-sign-in-form";

const {
	formError,
	passwordVisible,
	sessionStore,
	state,
	submit,
	togglePasswordVisibility,
	validate,
} = useSignInForm();

const { status } = storeToRefs(sessionStore);
</script>

<template>
	<UCard
		variant="soft"
		class="login-card"
	>
		<template #header>
			<div class="space-y-3">
				<UBadge
					color="error"
					variant="subtle"
					class="w-fit rounded-full px-3 py-1"
				>
					Узел доступа к системе безопасности
				</UBadge>
				<div class="space-y-2">
					<h1 class="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
						Вход в систему превентивного мониторинга
					</h1>
					<p
						class="max-w-xl text-sm leading-6 text-[color:var(--ui-text-muted)] sm:text-base"
					>
						Авторизуйтесь, чтобы получить доступ к видеопотокам, тревожным событиям,
						управлению моделями YOLO и аналитике раннего обнаружения задымления и очагов
						возгорания.
					</p>
				</div>
			</div>
		</template>

		<div class="space-y-6">
			<UAlert
				v-if="formError"
				color="error"
				variant="soft"
				:description="formError"
				icon="i-lucide-shield-alert"
			/>

			<UForm
				:state="state"
				:validate="validate"
				class="space-y-5"
				@submit="submit"
			>
				<UFormField
					name="email"
					label="Корпоративный email"
					size="lg"
				>
					<UInput
						v-model="state.email"
						type="email"
						size="xl"
						variant="subtle"
						placeholder="operator@yolo-firewatch.ai"
						autocomplete="email"
						icon="i-lucide-mail"
						class="w-full"
					/>
				</UFormField>

				<UFormField
					name="password"
					label="Пароль оператора"
					size="lg"
				>
					<UInput
						v-model="state.password"
						:type="passwordVisible ? 'text' : 'password'"
						size="xl"
						variant="subtle"
						placeholder="Введите защищённый пароль"
						autocomplete="current-password"
						icon="i-lucide-lock-keyhole"
						class="w-full"
					>
						<template #trailing>
							<UButton
								color="neutral"
								variant="ghost"
								size="sm"
								type="button"
								:icon="passwordVisible ? 'i-lucide-eye-off' : 'i-lucide-eye'"
								:aria-label="passwordVisible ? 'Скрыть пароль' : 'Показать пароль'"
								@click="togglePasswordVisibility()"
							/>
						</template>
					</UInput>
				</UFormField>

				<div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
					<UCheckbox
						v-model="state.remember"
						label="Доверенное рабочее место"
						description="Сохранить сессию для операторского терминала."
						class="items-center"
					/>

					<UButton
						color="neutral"
						variant="link"
						type="button"
						trailing-icon="i-lucide-life-buoy"
					>
						Запросить доступ
					</UButton>
				</div>

				<UButton
					type="submit"
					color="primary"
					size="xl"
					block
					:loading="status === 'loading'"
					icon="i-lucide-log-in"
					class="justify-center"
				>
					Подключиться к панели мониторинга
				</UButton>
			</UForm>

			<div class="grid gap-3">
				<article class="login-note">
					<p class="login-note__label"> Detection stack </p>
					<p class="login-note__value"> YOLO + CNN </p>
				</article>

				<article class="login-note">
					<p class="login-note__label"> Сигналы </p>
					<p class="login-note__value"> Дым / Огонь / Тепло </p>
				</article>

				<article class="login-note">
					<p class="login-note__label"> Режим </p>
					<p class="login-note__value"> Ранее оповещение </p>
				</article>
			</div>
		</div>
	</UCard>
</template>
