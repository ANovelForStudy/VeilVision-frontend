<script setup lang="ts">
import LoginShell from '~/widgets/auth/login-shell/ui/LoginShell.vue'

useSeoMeta({
  title: 'YOLO FireWatch Lab | Вход в систему',
  description: 'Авторизация во внутренней платформе превентивного мониторинга для раннего обнаружения задымления и возгораний.'
})
</script>

<template>
  <LoginShell />
</template>
