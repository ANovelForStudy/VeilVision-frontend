<script setup lang="ts">
import { storeToRefs } from 'pinia'

import { useSignInForm } from '../model/use-sign-in-form'

const {
  demoAccess,
  fillDemoAccess,
  formError,
  passwordVisible,
  sessionStore,
  state,
  submit,
  togglePasswordVisibility,
  validate
} = useSignInForm()

const { status } = storeToRefs(sessionStore)
</script>

<template>
  <UCard variant="soft" class="login-card">
    <template #header>
      <div class="space-y-3">
        <UBadge color="neutral" variant="soft" class="w-fit rounded-full px-3 py-1">
          Secure Workspace Access
        </UBadge>
        <div class="space-y-2">
          <h1 class="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
            Вход в исследовательскую платформу
          </h1>
          <p class="max-w-xl text-sm leading-6 text-[color:var(--ui-text-muted)] sm:text-base">
            Войдите в единое пространство аналитики, сценариев и операционных дашбордов. Интерфейс подготовлен
            под быстрый доступ к данным и ежедневным рабочим ритуалам команды.
          </p>
        </div>
      </div>
    </template>

    <div class="space-y-6">
      <UAlert
        color="info"
        variant="soft"
        title="Демо-доступ"
        :description="`${demoAccess.email} / ${demoAccess.password}`"
        icon="i-lucide-key-round"
      >
        <template #actions>
          <UButton
            color="neutral"
            variant="ghost"
            size="sm"
            type="button"
            icon="i-lucide-wand-sparkles"
            @click="fillDemoAccess"
          >
            Подставить
          </UButton>
        </template>
      </UAlert>

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
        <UFormField name="email" label="Рабочий email" size="lg">
          <UInput
            v-model="state.email"
            type="email"
            size="xl"
            variant="subtle"
            placeholder="name@company.com"
            autocomplete="email"
            icon="i-lucide-mail"
            class="w-full"
          />
        </UFormField>

        <UFormField name="password" label="Пароль" size="lg">
          <UInput
            v-model="state.password"
            :type="passwordVisible ? 'text' : 'password'"
            size="xl"
            variant="subtle"
            placeholder="Введите пароль"
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
            label="Запомнить устройство"
            description="Сохранить последнюю рабочую сессию."
          />

          <UButton
            color="neutral"
            variant="link"
            type="button"
            trailing-icon="i-lucide-arrow-up-right"
          >
            Восстановить доступ
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
          Войти в систему
        </UButton>
      </UForm>
    </div>
  </UCard>
</template>
