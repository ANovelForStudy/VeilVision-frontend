<script setup lang="ts">
const highlights = [
  {
    title: 'Единый контур доступа',
    description: 'Лента аналитики, отчёты и экспериментальные сценарии собраны в одном защищённом рабочем пространстве.',
    icon: 'i-lucide-orbit'
  },
  {
    title: 'Операционный ритм команды',
    description: 'Сессии, статусы и критичные метрики доступны сразу после входа без лишних переключений контекста.',
    icon: 'i-lucide-activity'
  },
  {
    title: 'Прозрачный handoff',
    description: 'История действий и рабочие артефакты остаются читаемыми для команды на каждом этапе исследования.',
    icon: 'i-lucide-scan-search'
  }
] as const

const stats = [
  { value: '24/7', label: 'наблюдение за событиями' },
  { value: '11', label: 'активных исследовательских потоков' },
  { value: '99.9%', label: 'доступность внутренних сервисов' }
] as const
</script>

<template>
  <section class="hero-panel">
    <div class="space-y-6">
      <UBadge color="primary" variant="subtle" class="w-fit rounded-full px-3 py-1">
        Signal Research Hub
      </UBadge>

      <div class="space-y-4">
        <h2 class="text-4xl font-semibold tracking-tight text-white sm:text-5xl">
          Командная точка входа для продукта, аналитики и экспериментов
        </h2>
        <p class="max-w-2xl text-base leading-7 text-[color:var(--ui-text-dimmed)] sm:text-lg">
          Страница логина собрана вокруг реального сценария: быстро авторизоваться, понять контекст и без трения
          продолжить работу в системе.
        </p>
      </div>
    </div>

    <div class="grid gap-4">
      <article
        v-for="item in highlights"
        :key="item.title"
        class="feature-card"
      >
        <div class="feature-card__icon">
          <UIcon :name="item.icon" class="text-lg text-white" />
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
